/**
 * Onde os relatorios moram.
 *
 * - Com `DATABASE_URL`: Postgres (Neon ou Supabase). A tabela e criada sozinha
 *   na primeira escrita; o SQL tambem esta em `db/schema.sql`.
 * - Sem `DATABASE_URL`, localmente: arquivos JSON em `.data/reports/`.
 * - Relatorios de exemplo (`data/examples/`) sao sempre lidos do repositorio.
 */

import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

import type { Report } from "@/lib/analysis/types";
import { env } from "@/lib/env";
import { SLUG_PATTERN } from "@/lib/slug";

const LOCAL_DIR = path.join(process.cwd(), ".data", "reports");
const EXAMPLES_DIR = path.join(process.cwd(), "data", "examples");

type Sql = ReturnType<typeof postgres>;

let sql: Sql | null = null;
let schemaReady: Promise<void> | null = null;

function db(): Sql {
  if (!env.databaseUrl) throw new Error("DATABASE_URL ausente");
  // `prepare: false` e obrigatorio atras de pooler (Supabase e Neon em modo transaction).
  // Banco remoto sempre com TLS, mesmo se a connection string vier sem `sslmode`.
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(env.databaseUrl);
  sql ??= postgres(env.databaseUrl, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: local ? false : "require",
  });
  schemaReady ??= sql`
    create table if not exists farol_reports (
      slug text primary key,
      url text not null,
      host text not null,
      score smallint not null,
      created_at timestamptz not null default now(),
      data jsonb not null
    )
  `.then(() => sql!`create index if not exists farol_reports_host_created on farol_reports (host, created_at desc)`).then(() => undefined);
  return sql;
}

let warnedMemory = false;
const memory = new Map<string, Report>();

export async function saveReport(report: Report): Promise<void> {
  if (env.databaseUrl) {
    const client = db();
    await schemaReady;
    await client`
      insert into farol_reports (slug, url, host, score, created_at, data)
      values (${report.slug}, ${report.url}, ${report.host}, ${report.score}, ${report.createdAt}, ${client.json(JSON.parse(JSON.stringify(report)))})
      on conflict (slug) do nothing
    `;
    return;
  }

  if (env.isVercel) {
    // Na Vercel o disco some entre execucoes: sem banco, o link nao sobrevive.
    if (!warnedMemory) {
      console.warn("[farol] DATABASE_URL ausente em producao: relatorios ficam so em memoria.");
      warnedMemory = true;
    }
    memory.set(report.slug, report);
    return;
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, `${report.slug}.json`), JSON.stringify(report));
}

async function readJson(file: string): Promise<Report | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Report;
  } catch {
    return null;
  }
}

export async function getReport(slug: string): Promise<Report | null> {
  if (!SLUG_PATTERN.test(slug)) return null;

  const example = await readJson(path.join(EXAMPLES_DIR, `${slug}.json`));
  if (example) return example;

  if (env.databaseUrl) {
    const client = db();
    await schemaReady;
    const rows = await client<{ data: Report }[]>`select data from farol_reports where slug = ${slug} limit 1`;
    return rows[0]?.data ?? null;
  }

  if (env.isVercel) return memory.get(slug) ?? null;

  return readJson(path.join(LOCAL_DIR, `${slug}.json`));
}
