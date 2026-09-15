/**
 * Normalizacao de URL digitada (DESIGN.md 6.1).
 * Aceita `site.com.br`, `www.site.com.br`, com ou sem `http(s)://`.
 *
 * Modulo puro. O cliente usa para validar antes do submit; a rota de API
 * roda de novo, porque validacao de cliente nao e seguranca.
 */

export type NormalizedUrl =
  | { ok: true; url: string; host: string }
  | { ok: false; reason: "empty" | "invalid" };

const LABEL = /^(?!-)[a-z\d-]{1,63}(?<!-)$/;
const TLD = /^(?:[a-z]{2,63}|xn--[a-z\d-]{1,59})$/;

export function normalizeUrl(input: string): NormalizedUrl {
  let raw = input.trim().replace(/\s+/g, "");
  if (!raw) return { ok: false, reason: "empty" };

  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(raw)) {
    raw = `https://${raw.replace(/^\/+/, "")}`;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "invalid" };
  }
  if (url.username || url.password) return { ok: false, reason: "invalid" };

  // `new URL` ja converte dominio com acento para punycode.
  const hostname = url.hostname.toLowerCase();
  const labels = hostname.split(".");
  const tld = labels[labels.length - 1];

  if (
    hostname.length > 253 ||
    labels.length < 2 ||
    !labels.every((label) => LABEL.test(label)) ||
    !TLD.test(tld)
  ) {
    return { ok: false, reason: "invalid" };
  }

  url.hash = "";

  return { ok: true, url: url.toString(), host: hostname.replace(/^www\./, "") };
}
