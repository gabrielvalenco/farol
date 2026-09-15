/**
 * Limite de analises por pessoa e cache de URL recem-analisada.
 * Upstash Redis quando configurado; memoria do processo quando nao.
 * Em memoria o limite vale por instancia: bom pra desenvolvimento, fraco em producao.
 */

import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

export interface LimitResult {
  allowed: boolean;
  /** Segundos ate liberar, quando bloqueado. */
  retryAfter: number;
}

const redis = env.upstashUrl && env.upstashToken ? new Redis({ url: env.upstashUrl, token: env.upstashToken }) : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(env.rateLimitMax, `${env.rateLimitWindowMinutes} m`),
      prefix: "farol:rl",
      analytics: false,
    })
  : null;

const windowMs = env.rateLimitWindowMinutes * 60_000;
const hits = new Map<string, number[]>();

export async function checkRateLimit(identifier: string): Promise<LimitResult> {
  if (ratelimit) {
    const result = await ratelimit.limit(identifier);
    return {
      allowed: result.success,
      retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  }

  const now = Date.now();
  const recent = (hits.get(identifier) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= env.rateLimitMax) {
    hits.set(identifier, recent);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(identifier, recent);
  return { allowed: true, retryAfter: 0 };
}

/* ------------------------------------------------------------------
   Cache: mesma URL analisada ha pouco reaproveita o relatorio.
   ------------------------------------------------------------------ */

const cacheTtlSeconds = env.cacheMinutes * 60;
const memoryCache = new Map<string, { slug: string; expires: number }>();

function cacheKey(url: string): string {
  return `farol:url:${url}`;
}

export async function getCachedSlug(url: string): Promise<string | null> {
  if (redis) return (await redis.get<string>(cacheKey(url))) ?? null;
  const entry = memoryCache.get(url);
  if (!entry || entry.expires < Date.now()) return null;
  return entry.slug;
}

export async function setCachedSlug(url: string, slug: string): Promise<void> {
  if (redis) {
    await redis.set(cacheKey(url), slug, { ex: cacheTtlSeconds });
    return;
  }
  memoryCache.set(url, { slug, expires: Date.now() + cacheTtlSeconds * 1000 });
}

/** IP de quem chamou, atras do proxy da Vercel. */
export function clientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "anonymous";
}
