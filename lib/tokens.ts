/**
 * Espelho em hex dos tokens de `app/globals.css`, para onde CSS variable
 * nao funciona: imagem de OG (Satori) e `themeColor` do metadata.
 * Mudou uma cor em globals.css? Mude aqui tambem.
 */

export const TOKENS = {
  bg: "#FFFFFF",
  bgSubtle: "#FAFAFA",
  bgMuted: "#F4F5F7",
  ink900: "#0B0D12",
  ink700: "#383D47",
  ink500: "#6B7280",
  ink400: "#9CA3AF",
  line: "#EAECF0",
  accent: "#2F5BFF",
  good: "#0E9F6E",
  goodInk: "#067A55",
  warn: "#D98A00",
  warnInk: "#9A5800",
  bad: "#E0413F",
  badInk: "#C4302E",
} as const;
