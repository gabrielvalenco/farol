/**
 * Transforma a resposta da PSI + os fatos do HTML no `Report` do Farol.
 * Funcao pura: roda igual no servidor e no script que gera os exemplos.
 */

import type { CategoryKey } from "@/lib/copy";
import { clampScore, scoreBand, type Impact, type MetricKey, type ScoreBand } from "@/lib/score";

import {
  CHECK_LABELS,
  cleanLighthouseText,
  copyFor,
  groupKey,
  humanizeUnits,
  NOT_A_CHECK,
  NOT_AN_ISSUE,
  resolveText,
  type AuditContext,
} from "./audits";
import type { HtmlFacts } from "./html";
import type { LhAudit, PsiResult } from "./psi";
import type { Report, ReportCategory, ReportCheck, ReportIssue, ReportMetric } from "./types";

export const CATEGORY_ORDER: CategoryKey[] = ["performance", "seo", "accessibility", "best-practices"];

/**
 * Peso de cada categoria na nota geral.
 * Performance pesa mais porque e o que mais custa cliente (DESIGN.md 2, tom de voz).
 *
 * A nota geral e a MEDIA GEOMETRICA ponderada, nao a aritmetica: uma
 * categoria pessima derruba a nota como um elo fraco. Com media simples,
 * um site com performance 13 e o resto perfeito tiraria 65 ("funciona"),
 * e na pratica ele esta perdendo visitante.
 */
export const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  performance: 0.4,
  seo: 0.2,
  accessibility: 0.2,
  "best-practices": 0.2,
};

/** Com tantos arquivos quebrados, a nota geral nao passa de "Critico". */
const BROKEN_RESOURCES_CAP = { threshold: 10, max: 49 };

const COUNTED_MODES = new Set<LhAudit["scoreDisplayMode"]>(["numeric", "binary", "metricSavings"]);

type Row = Record<string, unknown>;

function rows(audit: LhAudit | undefined): Row[] {
  const list = audit?.details?.items;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const row = item as Row;
    return (row?.type === "table" || row?.type === "list") && Array.isArray(row.items) ? (row.items as Row[]) : [row];
  });
}

function truncate(value: string, max = 110): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function elementLabel(row: Row): string | null {
  const node = row.node as { snippet?: string; selector?: string } | undefined;
  if (node?.snippet) return truncate(node.snippet.replace(/\s+/g, " "));
  if (node?.selector) return truncate(node.selector);
  for (const key of ["url", "source", "label"]) {
    const value = row[key];
    if (typeof value === "string" && value) return truncate(value);
    if (value && typeof value === "object" && typeof (value as { url?: string }).url === "string") {
      return truncate((value as { url: string }).url);
    }
  }
  return null;
}

function uniqueElements(audit: LhAudit): string[] {
  const seen = new Set<string>();
  for (const row of rows(audit)) {
    const label = elementLabel(row);
    if (label) seen.add(label);
  }
  return [...seen];
}

function wastedBytes(audit: LhAudit): number {
  return rows(audit).reduce((sum, row) => sum + (typeof row.wastedBytes === "number" ? row.wastedBytes : 0), 0);
}

function severityOf(score: number | null): ScoreBand {
  return scoreBand((score ?? 0) * 100);
}

interface PerfSignals {
  tbt: number;
  cls: number;
}

/** Limites da regua de impacto (0 a 1). */
const IMPACT_CUTS = { high: 0.6, medium: 0.3 };
/** Se tudo e alto impacto, nada e: no maximo este tanto de "Alto impacto" por relatorio. */
const MAX_HIGH_IMPACT = 3;
/** Peso de cada categoria quando a verificacao nao tem economia medida. */
const CATEGORY_URGENCY: Record<CategoryKey, number> = {
  performance: 1,
  seo: 0.8,
  accessibility: 0.5,
  "best-practices": 0.5,
};
const FIXED_PRIORITY: Record<Impact, number> = { high: 0.75, medium: 0.45, low: 0.15 };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Prioridade de um problema, de 0 a 1: quanto arruma-lo melhora o site.
 *
 * - Performance: pela economia estimada. 2,5s a menos de espera, 2,5 MB a menos
 *   de imagem ou 1 MB a menos de JavaScript valem 1. Pagina que pula e JavaScript
 *   que trava entram pelo tamanho do estrago medido (CLS e TBT).
 * - Demais categorias: peso da verificacao na nota x urgencia da categoria.
 *
 * O selo ("Alto", "Medio", "Baixo") sai daqui em `assignImpact`, com teto de altos.
 */
function priorityOf(audit: LhAudit, category: CategoryKey, weight: number, signals: PerfSignals): number {
  const fixed = copyFor(audit.id)?.impact;
  if (fixed) return FIXED_PRIORITY[fixed];

  if (category !== "performance") {
    return clamp01((weight / 10) * CATEGORY_URGENCY[category]);
  }

  const candidates: number[] = [0.05];
  const saved = Math.max(audit.metricSavings?.LCP ?? 0, audit.metricSavings?.FCP ?? 0, audit.details?.overallSavingsMs ?? 0);
  candidates.push(saved / 2500);

  const bytes = audit.details?.overallSavingsBytes ?? wastedBytes(audit);
  const isScript = /javascript|bootup/.test(audit.id);
  candidates.push(bytes / (isScript ? 1_000_000 : 2_500_000));

  if ((audit.metricSavings?.CLS ?? 0) > 0 || audit.id === "cls-culprits-insight") {
    // 0,1 e o limite do bom; acima de 0,25 o Google ja considera ruim.
    candidates.push((signals.cls - 0.1) / 0.3);
  }
  if (["bootup-time", "unused-javascript", "forced-reflow-insight", "legacy-javascript-insight", "duplicated-javascript-insight"].includes(audit.id)) {
    // TBT: 200 ms e o limite do bom; 1,5s trava a pagina de vez.
    const tbtShare = (signals.tbt - 200) / 1300;
    // O travamento e um so: conta cheio no processamento, parcial nas causas.
    candidates.push(audit.id === "bootup-time" ? tbtShare : tbtShare * 0.6);
  }
  if (audit.id === "total-byte-weight") {
    candidates.push(((audit.numericValue ?? 0) - 1_600_000) / 8_000_000);
  }

  return clamp01(Math.max(...candidates));
}

/** Aplica a regua e o teto de "Alto impacto" numa lista ja ordenada por prioridade. */
function assignImpact(issues: ReportIssue[]): ReportIssue[] {
  let highs = 0;
  return issues.map((issue) => {
    const priority = issue.priority ?? FIXED_PRIORITY[issue.impact];
    let impact: Impact = priority >= IMPACT_CUTS.high ? "high" : priority >= IMPACT_CUTS.medium ? "medium" : "low";
    if (impact === "high" && ++highs > MAX_HIGH_IMPACT) impact = "medium";
    return { ...issue, impact };
  });
}

function checkTitle(audit: LhAudit): string {
  return copyFor(audit.id)?.label ?? CHECK_LABELS[audit.id] ?? cleanLighthouseText(audit.title);
}

/** "Economia estimada de 214 KiB" -> "economia de 209 KB"; "O tamanho total foi de 1.340 KiB" -> "1,4 MB". */
function checkValue(display: string | undefined): string | undefined {
  if (!display) return undefined;
  const value = humanizeUnits(cleanLighthouseText(display))
    .replace(/^Economia estimada de/i, "economia de")
    .replace(/^O tamanho total (foi|era) de\s*/i, "");
  return value || undefined;
}

function issueFromAudit(audit: LhAudit, category: CategoryKey, weight: number, signals: PerfSignals): ReportIssue {
  const elements = uniqueElements(audit);
  const ctx: AuditContext = {
    count: Math.max(elements.length, 1),
    display: audit.displayValue,
    numericValue: audit.numericValue,
  };
  const copy = copyFor(audit.id);

  return {
    id: audit.id,
    category,
    title: copy?.title ?? cleanLighthouseText(audit.title),
    severity: severityOf(audit.score),
    impact: "low",
    priority: priorityOf(audit, category, weight, signals),
    what: copy ? resolveText(copy.what, ctx) : cleanLighthouseText(audit.displayValue) || cleanLighthouseText(audit.title),
    why: copy?.why ?? cleanLighthouseText(audit.description),
    how: copy?.how ?? "Veja os elementos afetados abaixo e corrija cada um deles.",
    elements: elements.length > 0 ? elements : undefined,
  };
}

/* ------------------------------------------------------------------
   Checagens proprias do Farol
   ------------------------------------------------------------------ */

interface FarolFinding {
  check: ReportCheck;
  category: CategoryKey;
  issue?: ReportIssue;
}

function brokenResources(result: PsiResult): FarolFinding {
  const requests = rows(result.lighthouseResult.audits["network-requests"]).filter(
    (row) => typeof row.url === "string" && !String(row.url).startsWith("data:"),
  );
  const failed = requests.filter((row) => {
    const status = typeof row.statusCode === "number" ? row.statusCode : 0;
    if (row.resourceType === "Ping" || row.resourceType === "Preflight") return false;
    // -1: a requisicao nem chegou a ter resposta (DNS, conexao recusada, bloqueio).
    return status >= 400 || status < 0;
  });

  const unique = [...new Set(failed.map((row) => String(row.url)))];
  const urls = unique.map((url) => truncate(url));
  const count = unique.length;
  const passed = count === 0;

  const hosts = new Map<string, number>();
  for (const row of failed) {
    try {
      const host = new URL(String(row.url)).host;
      hosts.set(host, (hosts.get(host) ?? 0) + 1);
    } catch {
      /* URL invalida, ignora */
    }
  }
  const [topHost, topCount] = [...hosts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const concentrated = topHost && topCount >= Math.max(3, failed.length * 0.6);

  const check: ReportCheck = {
    id: "farol-broken-resources",
    title: "Todos os arquivos carregam sem erro",
    passed,
    displayValue: passed ? undefined : `${count} com erro`,
    source: "farol",
  };

  if (passed) return { check, category: "best-practices" };

  const many = count >= 5;
  return {
    check,
    category: "best-practices",
    issue: {
      id: "farol-broken-resources",
      category: "best-practices",
      title: many ? "Arquivos do seu site não estão carregando" : "Alguns arquivos do site não carregam",
      severity: many ? "bad" : "warn",
      impact: many ? "high" : "medium",
      // Arquivo quebrado e o problema mais visivel pra quem visita: fica no topo.
      priority: many ? 0.95 : 0.5,
      what: `${count} ${count === 1 ? "arquivo falhou" : "arquivos falharam"} ao carregar (imagens, scripts ou dados)${
        concentrated ? `, quase todos vindos de ${topHost}` : ""
      }.`,
      why: "Quem visita vê imagem quebrada ou pedaço da página faltando. Passa descuido, e o que não carrega também não conta pro Google.",
      how: concentrated
        ? `Confira se o serviço em ${topHost} está ativo. Armazenamento em nuvem pausado, domínio expirado ou arquivo apagado são as causas mais comuns.`
        : "Abra cada endereço da lista. Corrija os que mudaram de lugar e remova da página os que não existem mais.",
      elements: urls,
    },
  };
}

function sharePreview(html: HtmlFacts): FarolFinding[] {
  const findings: FarolFinding[] = [];
  const hasImage = Boolean(html.og.image);
  const hasText = Boolean(html.og.title && html.og.description);

  findings.push({
    category: "seo",
    check: {
      id: "farol-og-image",
      title: "Imagem de pré-visualização do link (WhatsApp, redes sociais)",
      passed: hasImage,
      source: "farol",
    },
    issue: hasImage
      ? undefined
      : {
          id: "farol-og-image",
          category: "seo",
          title: "Seu link aparece sem imagem no WhatsApp",
          severity: "warn",
          impact: "medium",
          priority: 0.4,
          what: "A página não define a imagem que aparece quando alguém compartilha o link.",
          why: "Link com imagem chama mais atenção no WhatsApp, Instagram e Facebook, e passa mais confiança.",
          how: "Adicione <meta property=\"og:image\" content=\"https://seusite.com.br/capa.jpg\"> com uma imagem de 1200x630.",
        },
  });

  findings.push({
    category: "seo",
    check: {
      id: "farol-og-text",
      title: "Título e descrição da pré-visualização do link",
      passed: hasText,
      source: "farol",
    },
    issue: hasText
      ? undefined
      : {
          id: "farol-og-text",
          category: "seo",
          title: "O link compartilhado não tem título e descrição próprios",
          severity: "warn",
          impact: "low",
          priority: 0.15,
          what: "Faltam og:title ou og:description, que aparecem junto do link compartilhado.",
          why: "Sem eles, cada rede mostra um texto diferente, às vezes cortado ou sem sentido.",
          how: "Adicione <meta property=\"og:title\"> e <meta property=\"og:description\"> com o nome e o resumo do negócio.",
        },
  });

  return findings;
}

/* ------------------------------------------------------------------
   Metricas
   ------------------------------------------------------------------ */

function buildMetrics(result: PsiResult): ReportMetric[] {
  const audits = result.lighthouseResult.audits;
  const field = result.loadingExperience?.metrics ?? {};
  const lab = (id: string) => audits[id]?.numericValue;

  const pick = (key: MetricKey, fieldKey: string, labValue: number | undefined, scale = 1): ReportMetric | null => {
    const f = field[fieldKey];
    if (f && Number.isFinite(f.percentile)) return { key, value: f.percentile / scale, source: "field" };
    if (labValue !== undefined && Number.isFinite(labValue)) return { key, value: labValue, source: "lab" };
    return null;
  };

  const lcp = pick("lcp", "LARGEST_CONTENTFUL_PAINT_MS", lab("largest-contentful-paint"));
  const cls = pick("cls", "CUMULATIVE_LAYOUT_SHIFT_SCORE", lab("cumulative-layout-shift"), 100);
  // Tempo de resposta ao clique so existe com visitantes reais. Sem eles, mostra o servidor.
  const inp = field.INTERACTION_TO_NEXT_PAINT
    ? pick("inp", "INTERACTION_TO_NEXT_PAINT", undefined)
    : pick("ttfb", "EXPERIMENTAL_TIME_TO_FIRST_BYTE", lab("server-response-time"));

  return [lcp, cls, inp].filter((m): m is ReportMetric => m !== null);
}

/* ------------------------------------------------------------------
   Montagem
   ------------------------------------------------------------------ */

export function overallScore(categories: Record<CategoryKey, { score: number }>): number {
  const logSum = CATEGORY_ORDER.reduce(
    (sum, key) => sum + CATEGORY_WEIGHTS[key] * Math.log(Math.max(categories[key].score, 1)),
    0,
  );
  return clampScore(Math.exp(logSum));
}

export interface BuildReportInput {
  slug: string;
  url: string;
  host: string;
  psi: PsiResult;
  /** `null` quando o fetch do HTML falhou (analise parcial). */
  html: HtmlFacts | null;
  createdAt?: Date;
}

export function buildReport({ slug, url, host, psi, html, createdAt = new Date() }: BuildReportInput): Report {
  const lh = psi.lighthouseResult;
  const audits = lh.audits;
  const signals: PerfSignals = {
    tbt: audits["total-blocking-time"]?.numericValue ?? 0,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
  };

  const categories = {} as Record<CategoryKey, ReportCategory>;
  const issues = new Map<string, ReportIssue>();

  for (const key of CATEGORY_ORDER) {
    const lhCategory = lh.categories[key];
    const checks: ReportCheck[] = [];
    const seen = new Set<string>();

    for (const ref of lhCategory?.auditRefs ?? []) {
      const audit = audits[ref.id];
      if (!audit || seen.has(ref.id) || NOT_A_CHECK.has(ref.id)) continue;
      if (ref.group === "hidden" && ref.id !== "redirects") continue;
      if (!COUNTED_MODES.has(audit.scoreDisplayMode) || audit.score === null) continue;
      seen.add(ref.id);

      const passed = audit.score >= 0.9;
      const group = groupKey(audit.id);
      const existing = checks.find((c) => c.id === group);

      if (existing) {
        // Verificacoes agrupadas (ARIA): a linha so passa se todas passarem.
        existing.passed = existing.passed && passed;
      } else {
        checks.push({
          id: group,
          title: checkTitle(audit),
          passed,
          displayValue: group === audit.id ? checkValue(audit.displayValue) : undefined,
          source: "lighthouse",
        });
      }

      if (passed || NOT_AN_ISSUE.has(audit.id)) continue;

      const issue = issueFromAudit(audit, key, ref.weight, signals);
      const previous = issues.get(group);
      if (!previous) {
        issues.set(group, { ...issue, id: group });
      } else if (group !== audit.id) {
        // Mesmo grupo: soma os elementos afetados num card so.
        const elements = [...new Set([...(previous.elements ?? []), ...(issue.elements ?? [])])];
        const ctx = { count: Math.max(elements.length, 1) };
        const copy = copyFor(audit.id);
        issues.set(group, {
          ...previous,
          priority: Math.max(previous.priority ?? 0, issue.priority ?? 0),
          what: copy ? resolveText(copy.what, ctx) : previous.what,
          elements: elements.length > 0 ? elements : undefined,
        });
      }
    }

    categories[key] = {
      score: clampScore((lhCategory?.score ?? 0) * 100),
      passed: checks.filter((c) => c.passed).length,
      total: checks.length,
      checks,
    };
  }

  const findings: FarolFinding[] = [brokenResources(psi)];
  if (html) findings.push(...sharePreview(html));
  else categories.seo.partial = true;

  for (const finding of findings) {
    const category = categories[finding.category];
    category.checks.push(finding.check);
    category.total += 1;
    if (finding.check.passed) category.passed += 1;
    if (finding.issue) issues.set(finding.issue.id, finding.issue);
  }

  // Aprovadas primeiro? Nao: quem abre a lista quer ver o que falhou.
  for (const category of Object.values(categories)) {
    category.checks.sort((a, b) => Number(a.passed) - Number(b.passed));
  }

  const severityRank: Record<ScoreBand, number> = { bad: 0, warn: 1, good: 2 };
  const categoryRank = Object.fromEntries(CATEGORY_ORDER.map((c, i) => [c, i])) as Record<CategoryKey, number>;
  const sortedIssues = assignImpact(
    [...issues.values()].sort(
      (a, b) =>
        (b.priority ?? 0) - (a.priority ?? 0) ||
        severityRank[a.severity] - severityRank[b.severity] ||
        categoryRank[a.category] - categoryRank[b.category],
    ),
  );

  let score = overallScore(categories);

  let scoreCap: Report["scoreCap"];
  const broken = findings[0].issue?.elements?.length ?? 0;
  if (broken >= BROKEN_RESOURCES_CAP.threshold && score > BROKEN_RESOURCES_CAP.max) {
    scoreCap = { max: BROKEN_RESOURCES_CAP.max, reason: `${broken} arquivos do site não carregam` };
    score = BROKEN_RESOURCES_CAP.max;
  }

  const metrics = buildMetrics(psi);
  const lcp = metrics.find((m) => m.key === "lcp");

  return {
    version: 1,
    slug,
    url,
    finalUrl: lh.finalDisplayedUrl ?? lh.finalUrl ?? html?.finalUrl ?? url,
    host,
    createdAt: createdAt.toISOString(),
    strategy: "mobile",
    score,
    scoreCap,
    categories,
    issues: sortedIssues,
    metrics,
    loadTimeMs: lcp ? Math.round(lcp.value) : null,
    site: {
      title: html?.title ?? null,
      favicon: html?.favicon ?? null,
    },
  };
}
