/**
 * Protocolo do stream de `/api/analyze` (NDJSON: um JSON por linha).
 * Compartilhado entre a rota e o cliente, sem dependencia de servidor.
 */

import type { StepKey } from "@/lib/copy";

import type { AnalysisErrorCode } from "./errors";

export type AnalysisEvent =
  /** Primeiro evento: o tempo limite real, pro cliente mostrar numeros honestos. */
  | { type: "start"; timeoutSeconds: number }
  | { type: "step"; key: StepKey; status: "active" | "done" }
  /** O HTML respondeu: ja da pra mostrar titulo e favicon no mockup. */
  | { type: "site"; host: string; title: string | null; favicon: string | null }
  /** A PSI devolveu o screenshot final (data URI). */
  | { type: "screenshot"; data: string }
  /** Parte da analise nao pode ser feita; o relatorio sai mesmo assim. */
  | { type: "partial"; section: "seo" }
  | { type: "done"; slug: string; cached?: boolean }
  | { type: "error"; code: AnalysisErrorCode; retryAfter?: number; timeoutSeconds?: number };

/** Resposta JSON para erros antes do stream (400, 429). */
export interface AnalysisErrorBody {
  code: AnalysisErrorCode;
  retryAfter?: number;
  /** So no rate limit: pra montar "Voce ja analisou 5 sites nos ultimos 10 minutos". */
  limit?: number;
  windowMinutes?: number;
}

export function encodeEvent(event: AnalysisEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/** Le um stream NDJSON e entrega cada evento conforme chega. */
export async function readEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AnalysisEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) onEvent(JSON.parse(line) as AnalysisEvent);
      newline = buffer.indexOf("\n");
    }
  }

  const rest = buffer.trim();
  if (rest) onEvent(JSON.parse(rest) as AnalysisEvent);
}
