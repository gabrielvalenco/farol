/**
 * Erros da analise (DESIGN.md 7).
 * Todo erro diz o que aconteceu e o que fazer. A copy mora em `lib/copy.ts`.
 */

export type AnalysisErrorCode =
  /** Endereco invalido. */
  | "invalid_url"
  /** Endereco aponta pra rede interna ou algo que nao e site publico. */
  | "blocked_url"
  /** DNS, timeout, 5xx, recusa de conexao: o site nao respondeu. */
  | "unreachable"
  /** Limite de analises por pessoa. */
  | "rate_limited"
  /** A cota diaria da PageSpeed acabou. */
  | "quota_exceeded"
  /** A PageSpeed falhou por motivo dela. */
  | "measure_failed"
  /** Nao deu pra salvar o relatorio. */
  | "storage_failed"
  | "internal";

export class AnalysisError extends Error {
  readonly code: AnalysisErrorCode;
  /** Segundos ate poder tentar de novo (rate limit). */
  readonly retryAfter?: number;

  constructor(code: AnalysisErrorCode, detail?: string, retryAfter?: number) {
    super(detail ?? code);
    this.name = "AnalysisError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function toAnalysisError(error: unknown): AnalysisError {
  if (error instanceof AnalysisError) return error;
  return new AnalysisError("internal", error instanceof Error ? error.message : String(error));
}

/** Status HTTP para erros que acontecem antes do stream comecar. */
export function httpStatus(code: AnalysisErrorCode): number {
  switch (code) {
    case "invalid_url":
    case "blocked_url":
      return 400;
    case "rate_limited":
      return 429;
    default:
      return 500;
  }
}
