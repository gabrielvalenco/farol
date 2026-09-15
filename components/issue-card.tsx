"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { ImpactBadge } from "@/components/impact-badge";
import { ScoreIcon } from "@/components/score-status";
import { COPY } from "@/lib/copy";
import { bandMeta, type Impact, type ScoreBand } from "@/lib/score";
import { useVariants } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

const MAX_ELEMENTS = 5;

export interface Issue {
  id: string;
  title: string;
  /** Gravidade do achado. Decide icone e cor da borda de destaque. */
  severity: ScoreBand;
  /** Quanto arrumar isso melhora o site. Decide o chip. */
  impact: Impact;
  what: string;
  why: string;
  how: string;
  /** Seletores ou tags afetados, conteudo literal. */
  elements?: string[];
}

/**
 * Card de problema (DESIGN.md 6.3).
 *
 * - O card inteiro fechado e o alvo de toque (secao 8), nao o chevron.
 * - Abrir um card nao fecha os outros.
 * - Hover: so borda + translateY(-1px). Press: scale(0.985) so no cabecalho.
 */
export function IssueCard({
  issue,
  emphasized = false,
  defaultOpen = false,
  className,
}: {
  issue: Issue;
  /** Primeiro card de "Comece por aqui": borda esquerda de 2px na cor da severidade. */
  emphasized?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const v = useVariants();
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const panelId = `${baseId}-panel`;

  const elements = issue.elements ?? [];
  const visibleElements = elements.slice(0, MAX_ELEMENTS);
  const hiddenCount = elements.length - visibleElements.length;

  return (
    <article
      className={cn(
        "rounded-md border border-line bg-surface",
        "transition-[border-color,translate,scale] duration-180 ease-out",
        "lift press-group hover:border-line-strong",
        emphasized && "border-l-2",
        className,
      )}
      style={emphasized ? { borderLeftColor: bandMeta(issue.severity).color } : undefined}
    >
      <h3>
        <button
          id={triggerId}
          type="button"
          data-press-trigger
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 w-full items-start gap-3 rounded-md p-5 text-left sm:items-center"
        >
          {/* Icone alinhado a primeira linha do titulo (19px * 1.35 = ~26px). */}
          <span className="flex h-6.5 shrink-0 items-center sm:h-auto">
            <ScoreIcon band={issue.severity} size={18} />
          </span>
          {/* No mobile o chip desce pra baixo do titulo em vez de espremer o texto. */}
          <span className="flex min-w-0 flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="min-w-0 flex-1 text-h3 text-ink-900">{issue.title}</span>
            <ImpactBadge impact={issue.impact} />
          </span>
          <ChevronDown
            aria-hidden
            size={16}
            strokeWidth={1.75}
            className={cn(
              "mt-1.5 shrink-0 text-ink-400 transition-transform duration-200 ease-out sm:mt-0",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            variants={v.collapse}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-5 pb-5 sm:pl-12.5">
              <section>
                <h4 className="text-label text-ink-500">{COPY.issue.what}</h4>
                <p className="mt-1 text-body-sm text-ink-700">{issue.what}</p>
              </section>

              <section>
                <h4 className="text-label text-ink-500">{COPY.issue.why}</h4>
                <p className="mt-1 text-body-sm text-ink-700">{issue.why}</p>
              </section>

              <section className="rounded-sm bg-muted p-4">
                {/* --ink-500 sobre --bg-muted fica abaixo de 4.5:1; aqui vai --ink-700. */}
                <h4 className="text-label text-ink-700">{COPY.issue.how}</h4>
                <p className="mt-1 text-body-sm text-ink-700">{issue.how}</p>
              </section>

              {visibleElements.length > 0 ? (
                <section>
                  <h4 className="text-label text-ink-500">{COPY.issue.elements}</h4>
                  <ul className="mt-2 flex flex-col gap-1">
                    {visibleElements.map((el, i) => (
                      <li key={`${el}-${i}`} className="font-mono text-mono break-all text-ink-700">
                        {el}
                      </li>
                    ))}
                    {hiddenCount > 0 ? (
                      <li className="text-body-sm text-ink-500">{COPY.issue.more(hiddenCount)}</li>
                    ) : null}
                  </ul>
                </section>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
