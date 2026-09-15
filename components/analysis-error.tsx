import { Clock, PlugZap, TriangleAlert, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ANALYSIS_ERRORS, rateLimitMessage } from "@/lib/copy";
import type { AnalysisErrorCode } from "@/lib/analysis/errors";

export interface AnalysisFailure {
  code: AnalysisErrorCode;
  retryAfter?: number;
  limit?: number;
  windowMinutes?: number;
}

const ICONS: Partial<Record<AnalysisErrorCode, LucideIcon>> = {
  unreachable: PlugZap,
  rate_limited: Clock,
};

/**
 * Estados de erro da analise (DESIGN.md 7).
 * Sem ilustracao: icone de 32px em --ink-400, titulo, explicacao e uma acao.
 */
export function AnalysisError({ failure, onRetry }: { failure: AnalysisFailure; onRetry: () => void }) {
  const Icon = ICONS[failure.code] ?? TriangleAlert;

  const copy =
    failure.code === "rate_limited"
      ? {
          title: "Muitas análises seguidas",
          body: rateLimitMessage(failure.limit ?? 5, failure.windowMinutes ?? 10, (failure.retryAfter ?? 60) / 60),
          action: "Tentar de novo",
        }
      : ANALYSIS_ERRORS[failure.code];

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
