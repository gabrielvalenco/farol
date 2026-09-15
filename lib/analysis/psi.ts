/**
 * Cliente da PageSpeed Insights API v5.
 * Uma chamada, modo celular, as quatro categorias, textos em pt_BR.
 */

import "server-only";

import { env } from "@/lib/env";

import { AnalysisError } from "./errors";

/* Tipos parciais: so o que o Farol le do resultado do Lighthouse. */

export interface LhAuditRef {
  id: string;
  weight: number;
  group?: string;
}

export interface LhCategory {
  id: string;
  title: string;
  score: number | null;
  auditRefs: LhAuditRef[];
}

export interface LhAudit {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  scoreDisplayMode: "numeric" | "binary" | "manual" | "informative" | "notApplicable" | "error" | "metricSavings";
  displayValue?: string;
  numericValue?: number;
  metricSavings?: Partial<Record<"LCP" | "FCP" | "CLS" | "INP" | "TBT", number>>;
  details?: LhDetails;
}

export interface LhDetails {
  type?: string;
  items?: unknown[];
  data?: string;
  overallSavingsMs?: number;
  overallSavingsBytes?: number;
}

export interface LighthouseResult {
  requestedUrl?: string;
  finalUrl?: string;
  finalDisplayedUrl?: string;
  fetchTime?: string;
  runtimeError?: { code: string; message: string };
  categories: Record<string, LhCategory>;
  audits: Record<string, LhAudit>;
}

export interface CruxMetric {
  percentile: number;
  category?: string;
}

export interface PsiResult {
  lighthouseResult: LighthouseResult;
  loadingExperience?: {
    metrics?: Record<string, CruxMetric>;
    overall_category?: string;
  };
}

/** Codigos do Lighthouse que significam "o site nao carregou". */
const UNREACHABLE_CODES = [
  "FAILED_DOCUMENT_REQUEST",
  "ERRORED_DOCUMENT_REQUEST",
  "DNS_FAILURE",
  "INSECURE_DOCUMENT_REQUEST",
  "NO_FCP",
  "PAGE_HUNG",
  "PROTOCOL_TIMEOUT",
  "NOT_HTML",
];

function classify(message: string): AnalysisError {
  const code = UNREACHABLE_CODES.find((c) => message.includes(c));
  if (code) return new AnalysisError("unreachable", `psi: ${code}`);
  return new AnalysisError("measure_failed", `psi: ${message.slice(0, 300)}`);
}

export async function runPageSpeed(
  url: string,
  // O corte vem da rota (tempo limite da analise). Este padrao so vale fora dela.
  { timeoutMs = 45_000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<PsiResult> {
  const params = new URLSearchParams({ url, strategy: "mobile", locale: "pt_BR" });
  for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
    params.append("category", category);
  }
  if (env.psiApiKey) params.set("key", env.psiApiKey);

  let response: Response;
  try {
    response = await fetch(`${env.psiApiUrl}?${params}`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (signal?.aborted) throw new AnalysisError("internal", "psi cancelada");
    // Tempo esgotado nao prova site fora do ar: e medicao lenta demais.
    if ((error as Error).name === "TimeoutError") throw new AnalysisError("timeout", `psi: passou de ${timeoutMs}ms`);
    throw new AnalysisError("measure_failed", `psi fetch: ${(error as Error).message}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | (PsiResult & { error?: { code?: number; message?: string } })
    | null;

  if (!response.ok || !payload) {
    const message = payload?.error?.message ?? `http ${response.status}`;
    if (response.status === 429 || /quota/i.test(message)) {
      throw new AnalysisError("quota_exceeded", `psi: ${message.slice(0, 200)}`);
    }
    throw classify(message);
  }

  const runtimeError = payload.lighthouseResult?.runtimeError;
  if (runtimeError?.code) throw classify(runtimeError.code);

  if (!payload.lighthouseResult?.categories?.performance) {
    throw new AnalysisError("measure_failed", "psi: resposta sem categorias");
  }

  return payload;
}

/** Screenshot final da pagina (data URI jpeg), quando a PSI devolve. */
export function finalScreenshot(result: PsiResult): string | null {
  const data = result.lighthouseResult.audits["final-screenshot"]?.details?.data;
  return typeof data === "string" && data.startsWith("data:image/") ? data : null;
}
