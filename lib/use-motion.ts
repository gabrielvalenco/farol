"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import {
  barTransition,
  getVariants,
  pressTransition,
  scoreTransition,
  type MotionSet,
} from "./motion";

/**
 * prefers-reduced-motion so depois da hidratacao.
 *
 * O servidor nao conhece a preferencia. Se o primeiro render do cliente ja
 * usasse as variants reduzidas, o `initial` (ex.: y: 8 vs y: 0) nao bateria
 * com o HTML e o React acusaria hydration mismatch. Ate montar, o bloco
 * `@media (prefers-reduced-motion)` do globals.css ja segura as animacoes.
 */
function useHydratedReducedMotion(): boolean {
  const prefers = useReducedMotion() ?? false;
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated && prefers;
}

/**
 * Lado cliente do sistema de movimento (DESIGN.md 4.4).
 * O CSS cobre transition e keyframes; este hook cobre o que passa pelo JS.
 */
export function useMotion(): {
  reduced: boolean;
  v: MotionSet;
  score: ReturnType<typeof scoreTransition>;
  bar: (index?: number) => ReturnType<typeof barTransition>;
  press: ReturnType<typeof pressTransition>;
} {
  const reduced = useHydratedReducedMotion();

  return useMemo(
    () => ({
      reduced,
      v: getVariants(reduced),
      score: scoreTransition(reduced),
      bar: (index = 0) => barTransition(reduced, index),
      press: pressTransition(reduced),
    }),
    [reduced],
  );
}

/** Atalho para quem so precisa das variants nomeadas. */
export function useVariants(): MotionSet {
  const reduced = useHydratedReducedMotion();
  return useMemo(() => getVariants(reduced), [reduced]);
}
