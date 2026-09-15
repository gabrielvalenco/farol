/**
 * Formato do relatorio salvo. E o contrato entre a rota de analise,
 * o armazenamento, a pagina /r/[slug] e a imagem de OG.
 * Mudou o formato? Suba `version` e trate o antigo em `lib/storage.ts`.
 */

import type { CategoryKey } from "@/lib/copy";
import type { Impact, MetricKey, ScoreBand } from "@/lib/score";

export type { CategoryKey };

export interface ReportCheck {
  id: string;
  /** Titulo ja em portugues de gente. */
  title: string;
  passed: boolean;
  /** Valor medido, quando existe ("4,2s", "3 imagens"). */
  displayValue?: string;
  /** `lighthouse` veio da PSI; `farol` e checagem propria no HTML. */
  source: "lighthouse" | "farol";
}

export interface ReportCategory {
  score: number;
  passed: number;
  total: number;
  checks: ReportCheck[];
  /** A secao nao pode ser verificada por inteiro (7, analise parcial). */
  partial?: boolean;
}

export interface ReportIssue {
  id: string;
  category: CategoryKey;
  title: string;
  severity: ScoreBand;
  impact: Impact;
  what: string;
  why: string;
  how: string;
  elements?: string[];
}

export interface ReportMetric {
  key: MetricKey;
  value: number;
  /** `field`: visitantes reais (CrUX). `lab`: medido no laboratorio da PSI. */
  source: "field" | "lab";
}

export interface Report {
  version: 1;
  slug: string;
  /** URL que a pessoa pediu, normalizada. */
  url: string;
  /** URL onde a pagina terminou depois de redirecionamentos. */
  finalUrl: string;
  /** Dominio sem www, para exibir. */
  host: string;
  createdAt: string;
  strategy: "mobile";
  /** Nota geral de 0 a 100. Formula em `lib/analysis/build-report.ts`. */
  score: number;
  /** Quando a nota geral foi limitada por um problema grave. */
  scoreCap?: { max: number; reason: string };
  categories: Record<CategoryKey, ReportCategory>;
  /** Todos os problemas, do mais importante pro menos. */
  issues: ReportIssue[];
  /** Os tres Core Web Vitals exibidos. */
  metrics: ReportMetric[];
  /** Tempo ate o conteudo principal aparecer, em ms, para o veredito. */
  loadTimeMs: number | null;
  site: {
    title: string | null;
    favicon: string | null;
  };
}
