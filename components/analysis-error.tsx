import { Clock, Hourglass, PlugZap, TriangleAlert, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnalysisErrorCode } from "@/lib/analysis/errors";
import { ANALYSIS_ERRORS, rateLimitMessage, timeoutError, type ErrorCopy } from "@/lib/copy";

export interface AnalysisFailure {
  code: AnalysisErrorCode;
  retryAfter?: number;
  limit?: number;
  windowMinutes?: number;
  timeoutSeconds?: number;
}

const ICONS: Partial<Record<AnalysisErrorCode, LucideIcon>> = {
  unreachable: PlugZap,
  rate_limited: Clock,
  timeout: Hourglass,
};

function copyFor(failure: AnalysisFailure): ErrorCopy {
  if (failure.code === "rate_limited") {
    return {
      title: "Muitas análises seguidas",
      body: rateLimitMessage(failure.limit ?? 5, failure.windowMinutes ?? 10, (failure.retryAfter ?? 60) / 60),
      action: "Tentar de novo",
    };
  }
  if (failure.code === "timeout") return timeoutError(failure.timeoutSeconds ?? 45);
  return ANALYSIS_ERRORS[failure.code];
}

/**
 * Estados de erro da analise (DESIGN.md 7).
 * Sem ilustracao: icone de 32px em --ink-400, titulo, explicacao e uma acao.
 */
export function AnalysisError({ failure, onRetry }: { failure: AnalysisFailure; onRetry: () => void }) {
  const Icon = ICONS[failure.code] ?? TriangleAlert;
  const copy = copyFor(failure);

  return (
    <div role="alert" className="flex flex-col items-center rounded-lg border border-line bg-surface px-5 py-10 text-center sm:px-10">
      <Icon aria-hidden size={32} strokeWidth={1.75} className="text-ink-400" />
      <h2 className="mt-4 text-h3">{copy.title}</h2>
      <p className="mt-2 max-w-110 text-body-sm text-ink-500">{copy.body}</p>
      <Button variant="secondary" className="mt-6" onClick={onRetry}>
        {copy.action}
      </Button>
    </div>
  );
}
