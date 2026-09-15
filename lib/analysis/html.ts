/**
 * Checagens proprias no HTML (fetch + cheerio).
 *
 * Cobre o que a PSI nao olha, principalmente como o link aparece quando e
 * compartilhado. O que a PSI ja mede (titulo, meta description, idioma,
 * viewport) fica com ela; aqui so entra como reserva quando a PSI falha.
 */

import "server-only";

import { load } from "cheerio";

import { AnalysisError } from "./errors";
import { safeFetchText } from "./safe-fetch";

export interface HtmlFacts {
  finalUrl: string;
  status: number;
  title: string | null;
  description: string | null;
  lang: string | null;
  viewport: string | null;
  canonical: string | null;
  favicon: string | null;
  og: { title: string | null; description: string | null; image: string | null };
  /** Pouco texto no HTML bruto: o conteudo e montado por JavaScript. */
  clientRendered: boolean;
}

function absolute(href: string | undefined, base: string): string | null {
  if (!href) return null;
  try {
    const url = new URL(href.trim(), base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function text(value: string | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

export async function fetchHtmlFacts(url: string): Promise<HtmlFacts> {
  const response = await safeFetchText(url);

  if (response.status >= 500) {
    throw new AnalysisError("unreachable", `http ${response.status}`);
  }
  if (response.status >= 400) {
    // 403/429 costumam ser bloqueio de robo: o site existe, so nao deixou ler.
    throw new AnalysisError("measure_failed", `http ${response.status}`);
  }
  if (response.contentType && !/html|xml/i.test(response.contentType)) {
    throw new AnalysisError("measure_failed", `nao e html: ${response.contentType}`);
  }

  const $ = load(response.body);
  const base = response.finalUrl;
  const meta = (selector: string) => text($(selector).attr("content"));

  const bodyText = $("body").clone().find("script,style,noscript,svg").remove().end().text();

  return {
    finalUrl: response.finalUrl,
    status: response.status,
    title: text($("title").first().text()),
    description: meta('meta[name="description"]'),
    lang: text($("html").attr("lang")),
    viewport: meta('meta[name="viewport"]'),
    canonical: absolute($('link[rel="canonical"]').attr("href"), base),
    favicon:
      absolute($('link[rel~="icon"]').first().attr("href"), base) ??
      absolute($('link[rel="apple-touch-icon"]').first().attr("href"), base) ??
      absolute("/favicon.ico", base),
    og: {
      title: meta('meta[property="og:title"]'),
      description: meta('meta[property="og:description"]'),
      image: absolute($('meta[property="og:image"]').attr("content"), base),
    },
    clientRendered: bodyText.replace(/\s+/g, " ").trim().length < 200,
  };
}
