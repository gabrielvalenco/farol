/**
 * Farol, semantica de score.
 * Fonte de verdade: DESIGN.md, secao 3.1 (tabela de faixa) e 6.4.
 *
 * Nenhum componente decide cor, rotulo ou icone de score por conta propria.
 * Modulo puro, sem React: roda igual na rota de API e no cliente.
 * O icone volta como chave estavel; quem resolve a chave para o componente
 * Lucide e `components/score-status.tsx`.
 */

export type ScoreBand = "good" | "warn" | "bad";

/** Nomes conforme a tabela da secao 3.1. */
export type ScoreIcon = "check-circle-2" | "alert-triangle" | "alert-octagon";

export interface ScoreMeta {
  band: ScoreBand;
  /** Rotulo em PT. Cor nunca e o unico canal de informacao (secao 3.1 e 10). */
  label: string;
  /** Cor de grafico da faixa: anel, barra, regua. Nao passa 4.5:1 como texto. */
  color: string;
  /** Cor de texto da faixa. Passa 4.5:1 sobre --bg e sobre o fundo soft. */
  ink: string;
  /** Fundo soft da faixa. */
  soft: string;
  icon: ScoreIcon;
}

const BANDS: Record<ScoreBand, Omit<ScoreMeta, "band">> = {
  good: {
    label: "Bom",
    color: "var(--good)",
    ink: "var(--good-ink)",
    soft: "var(--good-soft)",
    icon: "check-circle-2",
  },
  warn: {
    label: "Precisa de atenção",
    color: "var(--warn)",
    ink: "var(--warn-ink)",
    soft: "var(--warn-soft)",
    icon: "alert-triangle",
  },
  bad: {
    label: "Crítico",
    color: "var(--bad)",
    ink: "var(--bad-ink)",
    soft: "var(--bad-soft)",
    icon: "alert-octagon",
  },
};

/** Prende o valor em 0..100 e arredonda. Toda entrada passa por aqui. */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** 90 a 100 = bom, 50 a 89 = atencao, 0 a 49 = critico. */
export function scoreBand(value: number): ScoreBand {
  const n = clampScore(value);
  if (n >= 90) return "good";
  if (n >= 50) return "warn";
  return "bad";
}

export function scoreMeta(value: number): ScoreMeta {
  const band = scoreBand(value);
  return { band, ...BANDS[band] };
}

export function bandMeta(band: ScoreBand): ScoreMeta {
  return { band, ...BANDS[band] };
}

/* ------------------------------------------------------------------
   6.4 Impacto de um problema.
   ------------------------------------------------------------------ */

export type Impact = "high" | "medium" | "low";

export interface ImpactMeta {
  label: string;
  color: string;
  background: string;
}

const IMPACTS: Record<Impact, ImpactMeta> = {
  high: { label: "Alto impacto", color: "var(--bad-ink)", background: "var(--bad-soft)" },
  medium: { label: "Médio", color: "var(--warn-ink)", background: "var(--warn-soft)" },
  /* --ink-500 sobre --bg-muted fica em 4.43:1, abaixo do minimo. --ink-700 da 9.99. */
  low: { label: "Baixo", color: "var(--ink-700)", background: "var(--bg-muted)" },
};

export function impactMeta(impact: Impact): ImpactMeta {
  return IMPACTS[impact];
}

/** Ordem de prioridade para "Comece por aqui" (5.3, item 4). */
export const IMPACT_ORDER: Record<Impact, number> = { high: 0, medium: 1, low: 2 };

/* ------------------------------------------------------------------
   6.5 Core Web Vitals: faixas da regua do MetricGauge.
   Limiares do Google. `scaleMax` e so o fim da regua desenhada.
   ------------------------------------------------------------------ */

export type MetricKey = "lcp" | "cls" | "inp" | "ttfb";

export interface MetricThresholds {
  /** Ate aqui e bom. */
  good: number;
  /** Ate aqui precisa de atencao. Acima disso e critico. */
  warn: number;
  /** Fim da regua desenhada. */
  scaleMax: number;
}

const METRICS: Record<MetricKey, MetricThresholds> = {
  lcp: { good: 2500, warn: 4000, scaleMax: 6000 },
  cls: { good: 0.1, warn: 0.25, scaleMax: 0.5 },
  inp: { good: 200, warn: 500, scaleMax: 1000 },
  ttfb: { good: 800, warn: 1800, scaleMax: 3000 },
};

export function metricThresholds(key: MetricKey): MetricThresholds {
  return METRICS[key];
}

/** Faixa de uma metrica bruta. Mesmo vocabulario de cor, rotulo e icone do score. */
export function metricBand(key: MetricKey, value: number): ScoreBand {
  const { good, warn } = METRICS[key];
  if (value <= good) return "good";
  if (value <= warn) return "warn";
  return "bad";
}

export function metricMeta(key: MetricKey, value: number): ScoreMeta {
  return bandMeta(metricBand(key, value));
}

/**
 * Posicao do pin na regua, de 0 a 1.
 * Valor acima do fim da escala encosta em 1 em vez de estourar o desenho.
 */
export function metricPosition(key: MetricKey, value: number): number {
  const { scaleMax } = METRICS[key];
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value / scaleMax);
}

/** Largura de cada segmento da regua (bom / atencao / critico), somando 1. */
export function metricSegments(key: MetricKey): [number, number, number] {
  const { good, warn, scaleMax } = METRICS[key];
  return [good / scaleMax, (warn - good) / scaleMax, (scaleMax - warn) / scaleMax];
}
