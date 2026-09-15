/**
 * Configuracao do servidor. Tudo opcional: sem as variaveis, o Farol roda
 * localmente com fallback (arquivo em disco, memoria, cota anonima da PSI).
 * Ver `.env.example` e o README.
 */

import "server-only";

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  psiApiKey: process.env.PSI_API_KEY || null,
  /** So troque para testes (servidor falso da PSI). */
  psiApiUrl: process.env.PSI_API_URL || "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",

  // POSTGRES_URL e o nome que a integracao Supabase/Neon da Vercel cria sozinha.
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || null,

  upstashUrl: process.env.UPSTASH_REDIS_REST_URL || null,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN || null,

  /** DESIGN.md 7: "5 sites nos ultimos 10 minutos". */
  rateLimitMax: int(process.env.RATE_LIMIT_MAX, 5),
  rateLimitWindowMinutes: int(process.env.RATE_LIMIT_WINDOW_MINUTES, 10),
  /** Mesmo endereco analisado de novo dentro deste prazo reaproveita o relatorio. */
  cacheMinutes: int(process.env.CACHE_MINUTES, 10),

  isVercel: Boolean(process.env.VERCEL),
} as const;
