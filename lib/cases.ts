/**
 * Casos de antes e depois (DESIGN.md 5.6).
 *
 * Cada caso vive em `data/cases/<slug>.json` e aponta pra dois relatorios
 * normais do Farol (`data/examples/`), medidos do mesmo jeito. Os numeros
 * extras (peso, requisicoes) vem do mesmo Lighthouse dos relatorios.
 * Gerado por `scripts/build-case.ts`.
 */

import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Report } from "@/lib/analysis/types";
import { getReport } from "@/lib/storage";

export interface CaseSnapshot {
  /** Slug do relatorio completo desta versao. */
  report: string;
  score: number;
  /** Milissegundos. */
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  speedIndex: number;
  weightBytes: number;
  requests: number;
}

export interface CaseChange {
  title: string;
  detail: string;
  /** Efeito medido, curto: "−8,7 MB na abertura". */
  effect: string;
}

export interface CaseStudy {
  slug: string;
  host: string;
  /** "Portfolio de desenvolvedor". */
  kind: string;
  measuredAt: string;
  method: string;
  before: CaseSnapshot;
  after: CaseSnapshot;
  changes: CaseChange[];
}

export interface LoadedCase {
  study: CaseStudy;
  before: Report;
  after: Report;
}

const CASES_DIR = path.join(process.cwd(), "data", "cases");

/** So o resumo do caso (sem os relatorios). Usado na landing e na imagem de OG. */
export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) return null;
  try {
    return JSON.parse(await readFile(path.join(CASES_DIR, `${slug}.json`), "utf8")) as CaseStudy;
  } catch {
    return null;
  }
}

export async function getCase(slug: string): Promise<LoadedCase | null> {
  const study = await getCaseStudy(slug);
  if (!study) return null;
  const [before, after] = await Promise.all([getReport(study.before.report), getReport(study.after.report)]);
  if (!before || !after) return null;
  return { study, before, after };
}
