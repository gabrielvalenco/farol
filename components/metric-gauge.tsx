"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { ScoreStatus } from "@/components/score-status";
import { formatMetric, term } from "@/lib/copy";
import { spring, viewportOnce } from "@/lib/motion";
import { metricBand, metricPosition, metricSegments, type MetricKey } from "@/lib/score";
import { useMotion } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

const SEGMENT_COLORS = ["var(--good-track)", "var(--warn-track)", "var(--bad-track)"] as const;

/** Recuo do pin nas pontas: em 0 ou no fim da escala ele nao cola na borda. */
const PIN_INSET = 0.02;

/**
 * Core Web Vital (DESIGN.md 6.5 e 5.3 item 5).
 * Nome humano em cima, valor 24/600, regua com pin, sigla em mono embaixo.
 */
export function MetricGauge({
  metric,
  value,
  animate = true,
  className,
}: {
  metric: MetricKey;
  value: number;
  /** `false` desenha o pin direto na posicao (impressao). */
  animate?: boolean;
  className?: string;
}) {
  const { reduced: prefersReduced } = useMotion();
  const reduced = prefersReduced || !animate;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportOnce);

  const glossary = term(metric);
  const band = metricBand(metric, value);
  const position = metricPosition(metric, value);
  const segments = metricSegments(metric);
  const target = `${(PIN_INSET + position * (1 - 2 * PIN_INSET)) * 100}%`;

  return (
    <div ref={ref} className={cn("flex min-w-0 flex-col", className)}>
      {/* Duas linhas reservadas em colunas: valores alinhados mesmo quando um nome quebra. */}
      <p className="text-body-sm text-ink-700 sm:min-h-10.5">{glossary.human}</p>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-stat tnum text-ink-900">{formatMetric(metric, value)}</p>
        <ScoreStatus band={band} />
      </div>

      {/* A regua e grafica; o valor e o rotulo acima ja dizem tudo em texto. */}
      <div aria-hidden className="relative mt-3 overflow-x-clip py-1">
        <div className="flex h-1 gap-0.5 overflow-hidden rounded-full">
          {segments.map((width, i) => (
            <span key={i} style={{ flexBasis: `${width * 100}%`, backgroundColor: SEGMENT_COLORS[i] }} />
          ))}
        </div>

        {/* O wrapper ocupa a largura da regua; transladar X% dele move o pin
            X% da regua, usando so transform. */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          // Inicial fixo em 0%: nao pode depender de `reduced`, que o servidor nao conhece.
          initial={{ x: animate ? "0%" : target }}
          animate={{ x: inView || reduced ? target : "0%" }}
          transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.2 }}
        >
          <span className="absolute top-1/2 left-0 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900" />
        </motion.div>
      </div>

      <p className="mt-2 font-mono text-label font-normal text-ink-500">{glossary.technical}</p>
    </div>
  );
}
