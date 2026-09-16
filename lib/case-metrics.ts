/**
 * Diferencas de um caso de antes e depois (DESIGN.md 5.6).
 * Pura: usada pela pagina, pelo destaque da landing e pela imagem de OG.
 */

import type { CaseSnapshot } from "@/lib/cases";
import { formatBytes, formatInt, formatMetric, formatRatio } from "@/lib/copy";

export type DeltaKey = "performance" | "lcp" | "weight" | "cls" | "tbt" | "requests";

export interface MetricDelta {
  key: DeltaKey;
  label: string;
  /** Sigla em mono, quando houver (DESIGN.md 9). */
  technical?: string;
  before: number;
  after: number;
  beforeText: string;
  afterText: string;
  /** Frase curta do ganho: "2,6x mais rápido". */
  gain: string;
  /** Formata um valor intermediario, pra animar de antes pra depois. */
  format: (value: number) => string;
}

const pct = (before: number, after: number) => Math.round((1 - after / Math.max(before, 1e-9)) * 100);

function clsText(value: number): string {
  return value < 0.005 ? "0" : formatMetric("cls", value);
}

export function caseDeltas(
  before: CaseSnapshot & { performance: number },
  after: CaseSnapshot & { performance: number },
): MetricDelta[] {
  const speedup = before.lcp / Math.max(after.lcp, 1);

  return [
    {
      key: "performance",
      label: "Performance no celular",
      before: before.performance,
      after: after.performance,
      beforeText: String(before.performance),
      afterText: String(after.performance),
      gain: `+${after.performance - before.performance} pontos`,
      format: (v) => String(Math.round(v)),
    },
    {
      key: "lcp",
      label: "Tempo até o conteúdo principal aparecer",
      technical: "LCP",
      before: before.lcp,
      after: after.lcp,
      beforeText: formatMetric("lcp", before.lcp),
      afterText: formatMetric("lcp", after.lcp),
      gain: `${formatRatio(speedup)} mais rápido`,
      format: (v) => formatMetric("lcp", v),
    },
    {
      key: "weight",
      label: "Peso da página ao abrir",
      before: before.weightBytes,
      after: after.weightBytes,
      beforeText: formatBytes(before.weightBytes),
      afterText: formatBytes(after.weightBytes),
      gain: `${pct(before.weightBytes, after.weightBytes)}% mais leve`,
      format: (v) => formatBytes(v),
    },
    {
      key: "cls",
      label: "Estabilidade visual (quanto a página “pula” ao carregar)",
      technical: "CLS",
      before: before.cls,
      after: after.cls,
      beforeText: clsText(before.cls),
      afterText: clsText(after.cls),
      gain: after.cls < 0.005 ? "Parou de pular" : `${pct(before.cls, after.cls)}% mais estável`,
      format: clsText,
    },
    {
      key: "tbt",
      label: "Tempo em que a página fica travada",
      technical: "TBT",
      before: before.tbt,
      after: after.tbt,
      beforeText: formatMetric("inp", before.tbt),
      afterText: formatMetric("inp", after.tbt),
      gain: after.tbt < 50 ? "Sem travamentos" : `${pct(before.tbt, after.tbt)}% menos travado`,
      format: (v) => formatMetric("inp", v),
    },
    {
      key: "requests",
      label: "Arquivos baixados ao abrir",
      before: before.requests,
      after: after.requests,
      beforeText: formatInt(before.requests),
      afterText: formatInt(after.requests),
      gain: `${pct(before.requests, after.requests)}% menos`,
      format: (v) => formatInt(Math.round(v)),
    },
  ];
}

/** "2,6x": quanto mais rapido o conteudo principal aparece. */
export function caseSpeedup(before: CaseSnapshot, after: CaseSnapshot): string {
  return formatRatio(before.lcp / Math.max(after.lcp, 1));
}

/** "60x": quantas vezes menos dados. */
export function caseWeightRatio(before: CaseSnapshot, after: CaseSnapshot): string {
  return `${Math.round(before.weightBytes / Math.max(after.weightBytes, 1))}x`;
}
