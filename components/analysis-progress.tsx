"use client";

import { Check, Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { BrowserFrame } from "@/components/browser-frame";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ANALYSIS_PROGRESS_COPY, ANALYSIS_STEPS, type StepKey } from "@/lib/copy";
import { duration, ease, spring } from "@/lib/motion";
import { useMotion } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "done";

export interface ProgressState {
  steps: Record<StepKey, StepStatus>;
  /** 0 a 1. Nunca chega em 1 antes do resultado. */
  progress: number;
  host: string;
  favicon: string | null;
  screenshot: string | null;
  /** Passou do tempo normal: mostra o aviso de site pesado. */
  slow: boolean;
  timeoutSeconds: number;
}

/**
 * Estado de analise (DESIGN.md 5.2): etapas reais vindas do stream, mockup
 * de browser com o screenshot e barra de progresso de 2px.
 */
export function AnalysisProgress({ state, onCancel }: { state: ProgressState; onCancel?: () => void }) {
  const { reduced, v } = useMotion();
  const active = ANALYSIS_STEPS.find((s) => state.steps[s.key] === "active");
  const doneCount = ANALYSIS_STEPS.filter((s) => state.steps[s.key] === "done").length;

  const announcement = active
    ? active.label
    : doneCount === ANALYSIS_STEPS.length
      ? "Análise concluída. Abrindo o relatório."
      : "";

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-label text-ink-500">
            Analisando <span className="font-mono font-normal text-ink-700">{state.host}</span>
          </p>
          <ol className="mt-4 flex flex-col gap-2.5">
            {ANALYSIS_STEPS.map((step) => {
              const status = state.steps[step.key];
              return (
                <li
                  key={step.key}
                  className={cn(
                    "flex items-center gap-3 text-body-sm transition-[color] duration-200",
                    status === "active" ? "text-ink-900" : "text-ink-500",
                  )}
                >
                  <StepIcon status={status} reduced={reduced} />
                  <span>{status === "done" ? step.label.replace(/\.\.\.$/, "") : step.label}</span>
                </li>
              );
            })}
          </ol>
          {/* Anuncio pra leitor de tela: so a etapa atual, sem repetir a lista inteira. */}
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>

          <div aria-live="polite">
            <AnimatePresence initial={false}>
              {state.slow && active ? (
                <motion.p
                  key="slow"
                  variants={v.fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="mt-4 flex items-start gap-2 text-body-sm text-ink-700"
                >
                  <Clock aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-500" />
                  {ANALYSIS_PROGRESS_COPY.slow(state.timeoutSeconds)}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          {onCancel && active ? (
            <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={onCancel}>
              {ANALYSIS_PROGRESS_COPY.cancel}
            </Button>
          ) : null}
        </div>

        <div className="flex justify-center md:justify-end">
          <BrowserFrame host={state.host} favicon={state.favicon} screenshot={state.screenshot} />
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Progresso da análise"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(state.progress * 100)}
        className="absolute inset-x-0 bottom-0 h-0.5"
      >
        <motion.div
          className="h-full origin-left bg-accent"
          initial={false}
          animate={{ scaleX: state.progress }}
          transition={reduced ? { duration: 0 } : { duration: duration.base, ease: ease.out }}
        />
      </div>
    </div>
  );
}

function StepIcon({ status, reduced }: { status: StepStatus; reduced: boolean }) {
  return (
    <span aria-hidden className="relative flex size-4 shrink-0 items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout">
        {status === "done" ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduced ? { duration: 0.15 } : spring.snug}
            className="flex text-good"
          >
            <Check size={16} strokeWidth={1.75} />
          </motion.span>
        ) : status === "active" ? (
          <motion.span key="active" className="flex text-ink-900" exit={{ opacity: 0 }}>
            <Spinner size={16} />
          </motion.span>
        ) : (
          <span key="pending" className="size-3.5 rounded-full border border-ink-400" />
        )}
      </AnimatePresence>
    </span>
  );
}
