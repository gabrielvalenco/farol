"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

import { viewportOnce } from "@/lib/motion";
import { useMotion } from "@/lib/use-motion";
import { clampScore, scoreMeta } from "@/lib/score";
import { cn } from "@/lib/utils";

/** Abaixo disso o "/100" ficaria menor que 12px e sai de cena. */
const SUFFIX_MIN_SIZE = 96;

/**
 * Proporcao do numero em relacao ao anel.
 * A spec pede `display` (64px) no anel de 168, mas "100" + "/100" nessa
 * medida passa de 170px e o miolo do anel tem 148. Com 0.3 cabe com folga
 * e a proporcao vale igual para 168, 128 e 64.
 */
const NUMBER_RATIO = 0.3;

export interface ScoreRingProps {
  value: number;
  /** 168 no hero, 128 no mobile, 64 nos cards. */
  size?: number;
  /** Nome do que esta sendo medido, para leitor de tela. Ex.: "Nota geral". */
  label?: string;
  /** `false` renderiza direto no valor final (impressao, OG, lista longa). */
  animate?: boolean;
  className?: string;
}

/**
 * Anel de score (DESIGN.md 6.2). SVG feito a mao, sem biblioteca de grafico.
 * `drawRing` e `countUp` compartilham o mesmo motion value, entao andam juntos.
 */
export function ScoreRing({ value, size = 168, label, animate: shouldAnimate = true, className }: ScoreRingProps) {
  const score = clampScore(value);
  const meta = scoreMeta(score);
  const { reduced, score: transition } = useMotion();
  const skip = reduced || !shouldAnimate;

  const stroke = size * 0.06;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportOnce);

  // O valor inicial nao pode depender de `reduced`: o servidor nao sabe a
  // preferencia do usuario e o HTML hidratado precisa bater. Reduced motion
  // pula direto pro valor final no efeito, sem animar.
  const progress = useMotionValue(shouldAnimate ? 0 : score);
  const dashOffset = useTransform(progress, (p) => circumference * (1 - p / 100));
  const shown = useTransform(progress, (p) => Math.round(p));
  // Com linecap round, 0 desenharia um ponto as 12h.
  const arcOpacity = useTransform(progress, (p) => (p <= 0 ? 0 : 1));

  useEffect(() => {
    if (skip) {
      progress.set(score);
      return;
    }
    if (!inView) return;
    const controls = animate(progress, score, transition);
    return () => controls.stop();
  }, [inView, skip, score, progress, transition]);

  const numberSize = size * NUMBER_RATIO;
  const accessibleName = `${label ? `${label}: ` : ""}nota ${score} de 100, ${meta.label}`;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={accessibleName}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          style={{ stroke: "var(--bg-muted)" }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ stroke: meta.color, strokeDashoffset: dashOffset, opacity: arcOpacity }}
        />
      </svg>

      <span aria-hidden className="relative flex items-baseline text-ink-900">
        <motion.span className="text-display tnum" style={{ fontSize: numberSize }}>
          {shown}
        </motion.span>
        {size >= SUFFIX_MIN_SIZE ? (
          <span
            className="tnum font-normal tracking-normal text-ink-400"
            style={{ fontSize: numberSize * 0.4 }}
          >
            /100
          </span>
        ) : null}
      </span>
    </div>
  );
}
