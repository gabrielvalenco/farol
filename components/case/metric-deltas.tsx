"use client";

import { ArrowRight, TrendingUp } from "lucide-react";
import { motion, useTransform } from "motion/react";

import { caseDeltas, type MetricDelta } from "@/lib/case-metrics";
import type { CaseSnapshot } from "@/lib/cases";

import { useReveal } from "./use-reveal";

type Snapshot = CaseSnapshot & { performance: number };

/** Grade de "Os numeros que mudaram" (DESIGN.md 5.6). */
export function MetricDeltas({ before, after }: { before: Snapshot; after: Snapshot }) {
  const deltas = caseDeltas(before, after);
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {deltas.map((delta, i) => (
        <DeltaCard key={delta.key} delta={delta} index={i} />
      ))}
    </ul>
  );
}

function DeltaCard({ delta, index }: { delta: MetricDelta; index: number }) {
  const { ref, value } = useReveal<HTMLLIElement>(delta.before, delta.after, { delay: index * 0.06 });
  const shown = useTransform(value, (v) => delta.format(v));

  return (
    <li ref={ref} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5">
      <p className="text-body-sm text-ink-700 sm:min-h-10.5">
        {delta.label}
        {delta.technical ? <span className="ml-1.5 font-mono text-label font-normal text-ink-500">{delta.technical}</span> : null}
      </p>

      <p
        className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
        aria-label={`Antes ${delta.beforeText}, depois ${delta.afterText}`}
      >
        <span aria-hidden className="text-body text-ink-500 tnum line-through decoration-line-strong">
          {delta.beforeText}
        </span>
        <ArrowRight aria-hidden size={16} strokeWidth={1.75} className="self-center text-ink-400" />
        <motion.span aria-hidden className="text-stat-lg text-ink-900 tnum">
          {shown}
        </motion.span>
      </p>

      <span className="inline-flex h-6 items-center gap-1 self-start rounded-full bg-good-soft px-2 text-badge text-good-ink">
        <TrendingUp aria-hidden size={12} strokeWidth={1.75} />
        {delta.gain}
      </span>
    </li>
  );
}
