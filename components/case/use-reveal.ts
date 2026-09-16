"use client";

import { animate, useInView, useMotionValue, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { duration, ease, viewportOnce } from "@/lib/motion";
import { useMotion } from "@/lib/use-motion";

/**
 * Valor que conta de `from` ate `to` quando o elemento entra na tela
 * (DESIGN.md 4: "o que mudou").
 *
 * O servidor sempre renderiza `to`: sem JavaScript, ou pra quem ja esta
 * vendo o bloco no primeiro paint, o numero certo aparece e nada pisca.
 * So um bloco ainda fora da tela volta pra `from` antes de ser visto.
 */
export function useReveal<T extends HTMLElement>(
  from: number,
  to: number,
  { delay = 0 }: { delay?: number } = {},
): { ref: RefObject<T | null>; value: MotionValue<number> } {
  const ref = useRef<T>(null);
  const value = useMotionValue(to);
  const inView = useInView(ref, viewportOnce);
  const { reduced } = useMotion();
  const [armed, setArmed] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const below = el.getBoundingClientRect().top > window.innerHeight;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (below && !prefersReduced) {
      value.set(from);
      setArmed(true);
    }
  }, [from, value]);

  useEffect(() => {
    if (!armed || !inView) return;
    if (reduced) {
      value.set(to);
      return;
    }
    const controls = animate(value, to, { duration: duration.score, ease: ease.out, delay });
    return () => controls.stop();
  }, [armed, inView, reduced, to, delay, value]);

  return { ref, value };
}
