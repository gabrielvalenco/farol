"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { ScoreIcon } from "@/components/score-status";
import { CASE_COPY, CATEGORIES, type CategoryKey } from "@/lib/copy";
import { scoreMeta } from "@/lib/score";

import { useReveal } from "./use-reveal";

const ORDER: CategoryKey[] = ["performance", "seo", "accessibility", "best-practices"];

/** Nota por categoria, antes (trilho claro) e depois (cor da faixa). */
export function CategoryCompare({
  before,
  after,
}: {
  before: Record<CategoryKey, number>;
  after: Record<CategoryKey, number>;
}) {
  return (
    <ul className="grid grid-cols-1 gap-x-10 gap-y-6 rounded-md border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
      {ORDER.map((key, i) => (
        <CategoryRow key={key} label={CATEGORIES[key].label} before={before[key]} after={after[key]} index={i} />
      ))}
    </ul>
  );
}

function CategoryRow({ label, before, after, index }: { label: string; before: number; after: number; index: number }) {
  const beforeMeta = scoreMeta(before);
  const afterMeta = scoreMeta(after);
  const beforeBar = useReveal<HTMLLIElement>(0, before / 100, { delay: index * 0.06 });
  const afterBar = useReveal<HTMLDivElement>(before / 100, after / 100, { delay: 0.3 + index * 0.06 });

  return (
    <li ref={beforeBar.ref} className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-label text-ink-500 uppercase">{label}</h3>
        <p
          className="flex items-center gap-1.5 tnum"
          aria-label={`${CASE_COPY.before} ${before} (${beforeMeta.label}), ${CASE_COPY.after} ${after} (${afterMeta.label})`}
        >
          <span aria-hidden className="text-body-sm" style={{ color: beforeMeta.ink }}>
            {before}
          </span>
          <ArrowRight aria-hidden size={14} strokeWidth={1.75} className="text-ink-400" />
          <ScoreIcon value={after} size={16} />
          <span aria-hidden className="text-stat" style={{ color: afterMeta.ink }}>
            {after}
          </span>
        </p>
      </div>
      <div ref={afterBar.ref} aria-hidden className="flex flex-col gap-1">
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full origin-left rounded-full opacity-45"
            style={{ backgroundColor: beforeMeta.color, scaleX: beforeBar.value }}
          />
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ backgroundColor: afterMeta.color, scaleX: afterBar.value }}
          />
        </div>
      </div>
    </li>
  );
}
