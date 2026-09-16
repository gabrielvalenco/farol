/**
 * Gera um caso de antes e depois a partir de duas medicoes do Lighthouse.
 *
 *   npm run case:build -- \
 *     --slug gabrielvalenco --host www.gabrielvalenco.com.br \
 *     --before antes.json --after depois.json \
 *     --before-html antes/index.html --after-html depois/index.html \
 *     --origin http://localhost:4174 --origin http://localhost:4175
 *
 * Os dois JSON precisam ter sido medidos do mesmo jeito (mesma maquina,
 * mesmas flags). `--origin` troca o endereco local pelo dominio real nos dados.
 * Os textos de "o que mudou" ficam em data/cases/<slug>.changes.json.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { buildReport } from "@/lib/analysis/build-report";
import { parseHtmlFacts } from "@/lib/analysis/html";
import type { LighthouseResult } from "@/lib/analysis/psi";
import type { CaseChange, CaseSnapshot, CaseStudy } from "@/lib/cases";

const { values } = parseArgs({
  options: {
    slug: { type: "string" },
    host: { type: "string" },
    kind: { type: "string", default: "Site" },
    before: { type: "string" },
    after: { type: "string" },
    "before-html": { type: "string" },
    "after-html": { type: "string" },
    origin: { type: "string", multiple: true, default: [] },
    "measured-at": { type: "string" },
    method: { type: "string" },
  },
});

const required = ["slug", "host", "before", "after", "before-html", "after-html"] as const;
for (const key of required) {
  if (!values[key]) throw new Error(`faltou --${key}`);
}

const root = process.cwd();
const host = values.host!.replace(/^https?:\/\//, "").replace(/\/$/, "");
const siteUrl = `https://${host}/`;
const displayHost = host.replace(/^www\./, "");

function loadLighthouse(file: string): LighthouseResult {
  let raw = readFileSync(file, "utf8");
  for (const origin of values.origin ?? []) {
    raw = raw.split(origin.replace(/\/$/, "")).join(`https://${host}`);
  }
  return JSON.parse(raw) as LighthouseResult;
}

function snapshot(lh: LighthouseResult, reportSlug: string, score: number): CaseSnapshot {
  const a = lh.audits;
  const num = (id: string) => Math.round((a[id]?.numericValue ?? 0) * (id === "cumulative-layout-shift" ? 1000 : 1));
  return {
    report: reportSlug,
    score,
    fcp: num("first-contentful-paint"),
    lcp: num("largest-contentful-paint"),
    tbt: num("total-blocking-time"),
    // CLS guardado x1000 pra continuar inteiro; volta ao normal abaixo.
    cls: num("cumulative-layout-shift") / 1000,
    speedIndex: num("speed-index"),
    weightBytes: Math.round(a["total-byte-weight"]?.numericValue ?? 0),
    requests: Array.isArray(a["network-requests"]?.details?.items) ? a["network-requests"]!.details!.items!.length : 0,
  };
}

const measuredAt = new Date(values["measured-at"] ?? Date.now());
const versions = [
  { key: "before", suffix: "antes", lh: values.before!, html: values["before-html"]! },
  { key: "after", suffix: "depois", lh: values.after!, html: values["after-html"]! },
] as const;

const snapshots = {} as Record<"before" | "after", CaseSnapshot>;

for (const version of versions) {
  const lighthouseResult = loadLighthouse(version.lh);
  lighthouseResult.finalDisplayedUrl = siteUrl;
  lighthouseResult.finalUrl = siteUrl;

  const slug = `caso-${values.slug}-${version.suffix}`;
  const html = parseHtmlFacts(readFileSync(version.html, "utf8"), siteUrl);
  const report = buildReport({
    slug,
    url: siteUrl,
    host: displayHost,
    psi: { lighthouseResult },
    html,
    createdAt: measuredAt,
  });

  const out = path.join(root, "data", "examples", `${slug}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));
  snapshots[version.key] = snapshot(lighthouseResult, slug, report.score);
  console.log(`${version.suffix}: nota ${report.score} | ${report.issues.length} problemas -> ${path.relative(root, out)}`);
}

const changesFile = path.join(root, "data", "cases", `${values.slug}.changes.json`);
const changes = JSON.parse(readFileSync(changesFile, "utf8")) as CaseChange[];

const study: CaseStudy = {
  slug: values.slug!,
  host: displayHost,
  kind: values.kind!,
  measuredAt: measuredAt.toISOString(),
  method:
    values.method ??
    "Medido com o Lighthouse no mesmo computador, simulando um celular com 4G. Mediana de 3 medições de cada versão.",
  before: snapshots.before,
  after: snapshots.after,
  changes,
};

writeFileSync(path.join(root, "data", "cases", `${values.slug}.json`), JSON.stringify(study, null, 2));
console.log(`caso: ${study.before.score} -> ${study.after.score}`);
