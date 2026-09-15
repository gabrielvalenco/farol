import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/**
 * Slug do relatorio: legivel no WhatsApp e dificil de adivinhar.
 * `rosevalenco.com.br` -> `rosevalenco-com-br-k3x9qa`
 */
export function createSlug(host: string): string {
  const base = host
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length];

  return `${base || "site"}-${suffix}`;
}

export const SLUG_PATTERN = /^[a-z0-9-]{3,64}$/;
