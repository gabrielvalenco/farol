"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { ScoreIcon } from "@/components/score-status";
import type { ReportCategory } from "@/lib/analysis/types";
import { CATEGORIES, type CategoryKey } from "@/lib/copy";
import { viewportOnce } from "@/lib/motion";
import { scoreMeta } from "@/lib/score";
import { useMotion } from "@/lib/use-motion";

const ORDER: CategoryKey[] = ["performance", "seo", "accessibility", "best-practices"];

/**
 * Quatro sub-scores (DESIGN.md 5.3 item 3): label maiusculo, numero 28/600
 * na cor da faixa com icone, barra de 3px que cresce com delay de 60ms.
 */
export function SubScores({
  categories,
  animate = true,
}: {
  categories: Record<CategoryKey, ReportCategory>;
  animate?: boolean;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, viewportOnce);
  const { reduced: prefersReduced, bar } = useMotion();
  const reduced = prefersReduced || !animate;

  return (
    <ul ref={ref} className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
      {ORDER.map((key, index) => {
        const category = categories[key];
        const meta = scoreMeta(category.score);
        return (
          <li key={key} className="flex flex-col">
            <h3 className="text-label text-ink-500 uppercase">{CATEGORIES[key].label}</h3>
            <p className="mt-2 flex items-center gap-2" aria-label={`${category.score} de 100, ${meta.label}`}>
              <ScoreIcon value={category.score} size={20} />
              <span className="text-stat-lg tnum" style={{ color: meta.ink }}>
                {category.score}
              </span>
            </p>
            <div aria-hidden className="mt-3 h-0.75 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full origin-left rounded-full"
                style={{ backgroundColor: meta.color }}
                initial={{ scaleX: animate ? 0 : category.score / 100 }}
                animate={{ scaleX: inView || reduced ? category.score / 100 : 0 }}
                transition={reduced ? { duration: 0 } : bar(index)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
