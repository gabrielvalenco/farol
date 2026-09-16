"use client";

import { motion } from "motion/react";

import { formatBytes } from "@/lib/copy";
import { CASE_COPY } from "@/lib/copy";

import { useReveal } from "./use-reveal";

/**
 * O peso da pagina em escala real (DESIGN.md 5.6): as duas barras usam a
 * mesma regua, entao a diferenca aparece do tamanho que ela tem.
 */
export function WeightScale({ before, after }: { before: number; after: number }) {
  return (
    <div className="flex flex-col gap-6 rounded-md border border-line bg-surface p-5 sm:p-6">
      <WeightRow label={CASE_COPY.before} bytes={before} share={1} color="var(--bad)" />
      <WeightRow label={CASE_COPY.after} bytes={after} share={after / before} color="var(--good)" delay={0.25} />
    </div>
  );
}

function WeightRow({
  label,
  bytes,
  share,
  color,
  delay = 0,
}: {
  label: string;
  bytes: number;
  share: number;
  color: string;
  delay?: number;
}) {
  // Barra minima visivel: 0,6% ainda e um traco que da pra ver.
  const target = Math.max(share, 0.006);
  const { ref, value } = useReveal<HTMLDivElement>(0, target, { delay });

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-label text-ink-500 uppercase">{label}</span>
        <span className="text-stat text-ink-900 tnum">{formatBytes(bytes)}</span>
      </div>
      <div aria-hidden className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full origin-left rounded-full" style={{ backgroundColor: color, scaleX: value }} />
      </div>
    </div>
  );
}
