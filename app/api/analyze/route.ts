/**
 * POST /api/analyze  { url: string, force?: boolean }
 *
 * Responde em NDJSON com o progresso real da analise (DESIGN.md 5.2):
 * cada etapa so e marcada quando o trabalho dela terminou de fato.
 * Erros antes de comecar (endereco invalido, limite) voltam como JSON.
 */

import { buildReport } from "@/lib/analysis/build-report";
import { AnalysisError, httpStatus, toAnalysisError } from "@/lib/analysis/errors";
import { encodeEvent, type AnalysisErrorBody, type AnalysisEvent } from "@/lib/analysis/events";
import { fetchHtmlFacts, type HtmlFacts } from "@/lib/analysis/html";
import { finalScreenshot, runPageSpeed, type PsiResult } from "@/lib/analysis/psi";
import { assertPublicHost } from "@/lib/analysis/safe-fetch";
import { env } from "@/lib/env";
import { checkRateLimit, clientIdentifier, getCachedSlug, setCachedSlug } from "@/lib/limits";
import { createSlug } from "@/lib/slug";
import { getReport, saveReport } from "@/lib/storage";
import { normalizeUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A PSI leva de 10 a 30s, as vezes mais. */
export const maxDuration = 90;

type Settled<T> = { ok: true; value: T } | { ok: false; error: AnalysisError };

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error: toAnalysisError(error) }),
  );
}

function jsonError(error: AnalysisError): Response {
  const body: AnalysisErrorBody = { code: error.code, retryAfter: error.retryAfter };
  if (error.code === "rate_limited") {
    body.limit = env.rateLimitMax;
    body.windowMinutes = env.rateLimitWindowMinutes;
  }
  return Response.json(body, {
    status: httpStatus(error.code),
    headers: error.retryAfter ? { "retry-after": String(error.retryAfter) } : undefined,
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { url?: unknown; force?: unknown } | null;
  const normalized = normalizeUrl(typeof body?.url === "string" ? body.url : "");
  if (!normalized.ok) return jsonError(new AnalysisError("invalid_url"));

  const { url, host } = normalized;
  const force = body?.force === true;

  // Endereco interno ou dominio inexistente: responde na hora, sem gastar PSI.
  try {
    await assertPublicHost(new URL(url).hostname);
  } catch (error) {
    const analysisError = toAnalysisError(error);
    if (analysisError.code === "blocked_url") return jsonError(analysisError);
    // DNS falhou: segue pro stream, que mostra o estado "site inacessivel".
    return streamOf([{ type: "step", key: "fetch", status: "active" }, { type: "error", code: analysisError.code }]);
  }

  if (!force) {
    const cachedSlug = await getCachedSlug(url).catch(() => null);
    if (cachedSlug && (await getReport(cachedSlug).catch(() => null))) {
      return streamOf([{ type: "done", slug: cachedSlug, cached: true }]);
    }
  }

  const limit = await checkRateLimit(clientIdentifier(request.headers)).catch(() => ({ allowed: true, retryAfter: 0 }));
  if (!limit.allowed) return jsonError(new AnalysisError("rate_limited", undefined, limit.retryAfter));

  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (event: AnalysisEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          closed = true;
        }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* ja fechado pelo cliente */
        }
      };

      try {
        send({ type: "step", key: "fetch", status: "active" });

        // PSI e HTML em paralelo: a PSI e o gargalo, o HTML chega em ~1s.
        const psiPromise = settle(runPageSpeed(url, { signal: abort.signal }));
        const html = await settle<HtmlFacts>(fetchHtmlFacts(url));

        if (html.ok) {
          send({ type: "site", host, title: html.value.title, favicon: html.value.favicon });
        } else if (html.error.code === "blocked_url") {
          abort.abort();
          send({ type: "error", code: "blocked_url" });
          return finish();
        }
        send({ type: "step", key: "fetch", status: "done" });

        send({ type: "step", key: "performance", status: "active" });
        const psi = await psiPromise;

        if (!psi.ok) {
          // Os dois falharam por inacessibilidade: o site esta fora do ar.
          const code =
            psi.error.code === "unreachable" || (!html.ok && html.error.code === "unreachable")
              ? "unreachable"
              : psi.error.code;
          console.error("[farol] analise falhou", { url, psi: psi.error.message, html: html.ok ? "ok" : html.error.message });
          send({ type: "error", code });
          return finish();
        }

        const screenshot = finalScreenshot(psi.value);
        if (screenshot) send({ type: "screenshot", data: screenshot });
        send({ type: "step", key: "performance", status: "done" });

        send({ type: "step", key: "seo", status: "active" });
        const report = buildReport({
          slug: createSlug(host),
          url,
          host,
          psi: psi.value as PsiResult,
          html: html.ok ? html.value : null,
        });
        if (!html.ok) send({ type: "partial", section: "seo" });
        send({ type: "step", key: "seo", status: "done" });

        send({ type: "step", key: "accessibility", status: "active" });
        send({ type: "step", key: "accessibility", status: "done" });

        send({ type: "step", key: "report", status: "active" });
        try {
          await saveReport(report);
        } catch (error) {
          console.error("[farol] falha ao salvar relatorio", error);
          send({ type: "error", code: "storage_failed" });
          return finish();
        }
        await setCachedSlug(url, report.slug).catch(() => undefined);
        send({ type: "step", key: "report", status: "done" });

        send({ type: "done", slug: report.slug });
        finish();
      } catch (error) {
        console.error("[farol] erro inesperado", error);
        send({ type: "error", code: toAnalysisError(error).code });
        finish();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, { headers: streamHeaders });
}

const streamHeaders = {
  "content-type": "application/x-ndjson; charset=utf-8",
  "cache-control": "no-store, no-transform",
  "x-accel-buffering": "no",
};

function streamOf(events: AnalysisEvent[]): Response {
  return new Response(events.map(encodeEvent).join(""), { headers: streamHeaders });
}
