/**
 * Relatorios de exemplo versionados em `data/examples/`.
 * Alimentam o link "Ver exemplo" e a linha de sites ja analisados (5.1).
 */

export const EXAMPLES = [
  { host: "enfantia.com.br", slug: "exemplo-enfantia" },
  { host: "gabrielvalenco.com.br", slug: "exemplo-gabrielvalenco" },
  { host: "rosevalenco.com.br", slug: "exemplo-rosevalenco" },
] as const;

/** O exemplo que o header abre em "Ver exemplo". */
export const FEATURED_EXAMPLE = EXAMPLES[1];
