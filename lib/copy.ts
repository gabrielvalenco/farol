/**
 * Farol, copy e glossario.
 * Fonte de verdade: DESIGN.md, secao 9 (glossario), 5.3 (veredito) e 7 (estados).
 *
 * Nenhum componente traduz sigla ou formata numero por conta propria.
 * Modulo puro, sem React.
 */

import type { AnalysisErrorCode } from "./analysis/errors";
import { scoreBand, type ScoreBand } from "./score";

/* ------------------------------------------------------------------
   9. Glossario obrigatorio: nome humano primeiro, sigla depois.
   ------------------------------------------------------------------ */

export type GlossaryKey =
  | "lcp"
  | "cls"
  | "inp"
  | "ttfb"
  | "render-blocking"
  | "meta-description"
  | "alt-text"
  | "viewport-meta";

export interface GlossaryEntry {
  /** Nome humano. Sempre aparece primeiro, e sozinho se preciso. */
  human: string;
  /** Termo tecnico. So aparece acompanhado do nome humano, em mono menor e cinza. */
  technical: string;
}

export const GLOSSARY: Record<GlossaryKey, GlossaryEntry> = {
  lcp: {
    human: "Tempo até o conteúdo principal aparecer",
    technical: "LCP",
  },
  cls: {
    human: "Estabilidade visual (quanto a página “pula” ao carregar)",
    technical: "CLS",
  },
  inp: {
    human: "Tempo de resposta ao clique",
    technical: "INP",
  },
  ttfb: {
    human: "Tempo de resposta do servidor",
    technical: "TTFB",
  },
  "render-blocking": {
    human: "Arquivos que atrasam o carregamento",
    technical: "Render-blocking resources",
  },
  "meta-description": {
    human: "Resumo que aparece no Google",
    technical: "Meta description",
  },
  "alt-text": {
    human: "Descrição da imagem (pra leitores de tela e pro Google)",
    technical: "Alt text",
  },
  "viewport-meta": {
    human: "Configuração que faz o site funcionar no celular",
    technical: "Viewport meta tag",
  },
};

export function term(key: GlossaryKey): GlossaryEntry {
  return GLOSSARY[key];
}

/* ------------------------------------------------------------------
   Categorias do relatorio (5.1 item 4 e 5.3 item 3).
   ------------------------------------------------------------------ */

export type CategoryKey = "performance" | "seo" | "accessibility" | "best-practices";

export const CATEGORIES: Record<CategoryKey, { label: string; description: string }> = {
  performance: {
    label: "Performance",
    description: "Quanto tempo seu site leva pra abrir e responder",
  },
  seo: {
    label: "SEO",
    description: "Se o Google entende e mostra bem o seu site",
  },
  accessibility: {
    label: "Acessibilidade",
    description: "Se todo mundo consegue usar, inclusive com leitor de tela",
  },
  "best-practices": {
    label: "Boas práticas",
    description: "Segurança e cuidados técnicos que evitam dor de cabeça",
  },
};

/* ------------------------------------------------------------------
   5.3 Veredito: a frase que traduz o numero.
   ------------------------------------------------------------------ */

const VERDICTS: Record<ScoreBand, string> = {
  good: "Seu site está em ótima forma.",
  warn: "Seu site funciona, mas está deixando visitantes na mesa.",
  bad: "Seu site está perdendo clientes agora.",
};

export function verdict(score: number): string {
  return VERDICTS[scoreBand(score)];
}

/* ------------------------------------------------------------------
   9. Numeros no formato brasileiro: 4,2s e 1.240 ms.
   ------------------------------------------------------------------ */

const LOCALE = "pt-BR";

const intFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const twoDecimals = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1240 -> "1.240" */
export function formatInt(value: number): string {
  return intFormat.format(value);
}

/** 1240 -> "1.240 ms" */
export function formatMs(ms: number): string {
  return `${intFormat.format(ms)} ms`;
}

/** 4200 -> "4,2s" */
export function formatSeconds(ms: number): string {
  return `${oneDecimal.format(ms / 1000)}s`;
}

/**
 * Valor de metrica ja no formato de exibicao.
 * Abaixo de 1s mostra em ms, a partir de 1s mostra em segundos.
 * CLS e adimensional, com duas casas.
 */
export function formatMetric(key: "lcp" | "cls" | "inp" | "ttfb", value: number): string {
  if (key === "cls") return twoDecimals.format(value);
  return value < 1000 ? formatMs(value) : formatSeconds(value);
}

/** Contagem com plural: plural(3, "problema", "problemas") -> "3 problemas" */
export function plural(count: number, one: string, many: string): string {
  return `${formatInt(count)} ${count === 1 ? one : many}`;
}

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** "14 de setembro de 2026 às 10:32" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFormat.format(d).replace(", ", " às ");
}

/* ------------------------------------------------------------------
   5.2 Etapas da analise.
   ------------------------------------------------------------------ */

export type StepKey = "fetch" | "performance" | "seo" | "accessibility" | "report";

export const ANALYSIS_STEPS: ReadonlyArray<{ key: StepKey; label: string }> = [
  { key: "fetch", label: "Buscando o site..." },
  { key: "performance", label: "Medindo a velocidade de carregamento..." },
  { key: "seo", label: "Analisando SEO e metadados..." },
  { key: "accessibility", label: "Verificando acessibilidade..." },
  { key: "report", label: "Montando o relatório..." },
];

/* ------------------------------------------------------------------
   7. Estados. Erro diz o que aconteceu e o que fazer.
   ------------------------------------------------------------------ */

export const COPY = {
  brand: {
    name: "Farol",
    tagline: "O raio-x do seu site em 30 segundos.",
  },
  landing: {
    title: "Descubra o que está travando o seu site.",
    subtitle:
      "Análise completa de performance, SEO e acessibilidade em menos de 30 segundos. De graça.",
    placeholder: "seusite.com.br",
    submit: "Analisar",
    reassurance: "Sem cadastro. Sem cartão.",
  },
  input: {
    label: "Endereço do site",
    /* Curtas de proposito: cabem em uma linha a 375px, sem layout shift. */
    empty: "Digite o endereço do site, como seusite.com.br",
    invalid: "Confira o endereço. Algo como seusite.com.br",
  },
  issue: {
    what: "O que é",
    why: "Por que importa",
    how: "Como resolver",
    elements: "Elementos afetados",
    more: (count: number) => `e mais ${count}`,
  },
  common: {
    loading: "Carregando",
  },
  unreachable: {
    title: "Não conseguimos acessar esse site",
    body: "O site pode estar fora do ar, bloqueando robôs de análise, ou o endereço pode estar digitado errado. Confira o endereço e tente de novo em alguns minutos.",
    action: "Tentar de novo",
  },
  partial: {
    body: "Parte desta seção não pôde ser verificada porque não conseguimos ler o HTML do site. O restante do relatório está completo.",
  },
  conversion: {
    title: "Quer que a gente arrume isso pra você?",
    action: "Falar no WhatsApp",
  },
} as const;

/* ------------------------------------------------------------------
   7. Erros da analise: o que aconteceu e o que fazer.
   ------------------------------------------------------------------ */

export interface ErrorCopy {
  title: string;
  body: string;
  action: string;
}

export const ANALYSIS_ERRORS: Record<Exclude<AnalysisErrorCode, "rate_limited">, ErrorCopy> = {
  invalid_url: {
    title: "Esse endereço não parece um site",
    body: "Confira se digitou algo como seusite.com.br, sem espaços.",
    action: "Corrigir endereço",
  },
  blocked_url: {
    title: "Esse endereço não pode ser analisado",
    body: "O Farol só analisa sites públicos na internet. Confira se digitou o endereço do site certo.",
    action: "Corrigir endereço",
  },
  unreachable: {
    title: "Não conseguimos acessar esse site",
    body: "O site pode estar fora do ar, bloqueando robôs de análise, ou o endereço pode estar digitado errado. Confira o endereço e tente de novo em alguns minutos.",
    action: "Tentar de novo",
  },
  quota_exceeded: {
    title: "Nosso medidor atingiu o limite de hoje",
    body: "A ferramenta do Google que usamos pra medir os sites chegou ao limite diário de análises. Tente de novo mais tarde.",
    action: "Tentar de novo",
  },
  measure_failed: {
    title: "A medição não terminou",
    body: "A ferramenta do Google que mede o site não conseguiu concluir agora. Costuma ser passageiro: tente de novo em alguns minutos.",
    action: "Tentar de novo",
  },
  storage_failed: {
    title: "Não conseguimos salvar o relatório",
    body: "A análise terminou, mas o relatório não foi salvo. Tente de novo em instantes.",
    action: "Tentar de novo",
  },
  internal: {
    title: "A análise parou no meio",
    body: "Aconteceu um erro do nosso lado, não do seu site. Tente de novo; se continuar, fale com a gente.",
    action: "Tentar de novo",
  },
};

/* ------------------------------------------------------------------
   5.3 Relatorio
   ------------------------------------------------------------------ */

export const REPORT_COPY = {
  reanalyze: "Reanalisar",
  share: "Compartilhar",
  linkCopied: "Link copiado",
  linkCopyFailed: "Não conseguimos copiar o link",
  linkCopyFailedBody: "Selecione o endereço na barra do navegador e copie manualmente.",
  analyzedAt: (date: string) => `Analisado em ${date}, no celular`,
  startHere: {
    title: "Comece por aqui",
    description: "Os problemas que mais pesam no seu site, do mais importante pro menos.",
    empty: "Não encontramos nenhum problema que valha a pena arrumar agora.",
    more: (count: number) => `Ver mais ${count} ${count === 1 ? "problema" : "problemas"}`,
    less: "Mostrar menos",
  },
  vitals: {
    title: "Métricas essenciais do Google",
    technical: "Core Web Vitals",
    field: "Dados de visitantes reais do seu site nos últimos 28 dias.",
    lab: "Medido em laboratório, simulando um celular com 4G. Seu site ainda não tem visitas suficientes pro Google mostrar dados reais.",
    mixed: "Parte vem de visitantes reais e parte foi medida em laboratório, simulando um celular com 4G.",
  },
  checks: {
    title: "Todas as verificações",
    description: "A lista completa, pra quem quer o detalhe técnico.",
    summary: (label: string, passed: number, total: number) => `${label}, ${passed} de ${total} aprovadas`,
    farol: "Farol",
    passed: "Aprovada",
    failed: "Reprovada",
  },
  partialSeo:
    "Não conseguimos ler o HTML do site (ele pode estar bloqueando robôs). As verificações de pré-visualização do link ficaram de fora; o resto do relatório está completo.",
  scoreCap: (reason: string) => `A nota geral foi limitada a "Crítico" porque ${reason}.`,
  print: "Versão para imprimir ou salvar em PDF",
  printNow: "Imprimir ou salvar PDF",
  notFound: {
    title: "Relatório não encontrado",
    body: "O link pode estar incompleto, ou o relatório foi removido. Você pode analisar o site de novo em 30 segundos.",
    action: "Analisar um site",
  },
} as const;

/** Duas linhas de impacto concreto abaixo do veredito (5.3 item 2). */
export function verdictDetails(loadTimeMs: number | null, highImpactCount: number): string[] {
  const lines: string[] = [];

  if (loadTimeMs !== null) {
    const time = formatSeconds(loadTimeMs);
    if (loadTimeMs >= 3000) {
      lines.push(`Seu site demora ${time} pra mostrar o conteúdo principal no celular. Metade dos visitantes desiste antes de 3s.`);
    } else if (loadTimeMs > 2500) {
      lines.push(`Seu site leva ${time} pra mostrar o conteúdo principal no celular, perto do limite que o Google considera bom (2,5s).`);
    } else {
      lines.push(`Seu site mostra o conteúdo principal em ${time} no celular, dentro do que o Google considera bom.`);
    }
  }

  lines.push(
    highImpactCount === 0
      ? "Não encontramos nenhum problema de alto impacto."
      : `Encontramos ${plural(highImpactCount, "problema de alto impacto", "problemas de alto impacto")} pra resolver primeiro.`,
  );

  return lines;
}

/** Mensagem pronta do botao de WhatsApp (5.3 item 7). */
export function whatsappMessage(host: string, score: number, reportUrl: string): string {
  return `Olá! Analisei o site ${host} no Farol (nota ${score}) e quero ajuda pra arrumar os problemas: ${reportUrl}`;
}

/** 7. Rate limit: tempo restante, sem culpar ninguem. */
export function rateLimitMessage(limit: number, windowMinutes: number, retryMinutes: number): string {
  const wait = Math.max(1, Math.ceil(retryMinutes));
  return `Você já analisou ${plural(limit, "site", "sites")} nos últimos ${windowMinutes} minutos. Tente de novo em ${plural(wait, "minuto", "minutos")}.`;
}
