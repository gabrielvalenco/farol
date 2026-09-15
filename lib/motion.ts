/**
 * Farol, sistema de movimento.
 * Fonte de verdade: DESIGN.md, secao 4.
 *
 * Modulo puro: so `import type` de motion/react, nenhum runtime.
 * Assim uma rota de servidor pode ler `duration` sem arrastar o cliente.
 * O hook que respeita prefers-reduced-motion mora em `lib/use-motion.ts`.
 */

import type { Transition, Variants } from "motion/react";

/* ------------------------------------------------------------------
   4.1 Duracoes e curvas. Nada passa de 900ms.
   ------------------------------------------------------------------ */

export const duration = {
  /** Troca de estado de icone, ripple de checkbox. */
  instant: 0.12,
  /** Hover, press, tooltip. */
  fast: 0.18,
  /** Entrada de elemento, fade-up. */
  base: 0.26,
  /** Entrada de secao, expansao de accordion. */
  slow: 0.42,
  /** Desenho do anel + contagem do numero. Uma vez so. */
  score: 0.9,
} as const;

type Bezier = [number, number, number, number];

export const ease: Record<"out" | "inOut" | "in", Bezier> = {
  /** Padrao para entradas. */
  out: [0.22, 1, 0.36, 1],
  /** Para movimentos que voltam. */
  inOut: [0.65, 0, 0.35, 1],
  /** Saidas. */
  in: [0.4, 0, 1, 1],
};

export const spring = {
  soft: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  snug: { type: "spring", stiffness: 420, damping: 34 },
} as const satisfies Record<string, Transition>;

/**
 * 4.3: entrada em scroll. Nunca reanima ao subir a pagina.
 * Usar como `viewport={viewportOnce}`.
 */
export const viewportOnce = { once: true, margin: "-80px" } as const;

/** Teto de fade permitido com prefers-reduced-motion (4.4). */
const REDUCED_FADE = 0.15;

/* ------------------------------------------------------------------
   4.2 Animacoes nomeadas.
   ------------------------------------------------------------------ */

export type MotionSet = {
  /** opacity 0 -> 1, y 8px -> 0. */
  fadeUp: Variants;
  /** So opacidade. */
  fadeIn: Variants;
  /** Container. Stagger so no primeiro nivel (4.3). */
  stagger: Variants;
  /** scale 0.97 -> 1 + fade. Popover e tooltip. */
  scaleIn: Variants;
  /** height 0 -> auto + fade do conteudo. */
  collapse: Variants;
};

/**
 * Monta o conjunto de variants.
 *
 * Com `reduced`, a secao 4.4 manda: nenhum transform, nenhum stagger,
 * fades de no maximo 150ms. O nome e o contrato (`hidden`/`visible`)
 * continuam identicos, entao o componente nao precisa de dois caminhos.
 */
export function getVariants(reduced: boolean): MotionSet {
  const fade: Transition = reduced
    ? { duration: REDUCED_FADE, ease: "linear" }
    : { duration: duration.base, ease: ease.out };

  return {
    fadeUp: {
      hidden: { opacity: 0, y: reduced ? 0 : 8 },
      visible: { opacity: 1, y: 0, transition: fade },
    },

    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: fade },
    },

    stagger: {
      hidden: {},
      visible: {
        transition: reduced
          ? {}
          : { staggerChildren: 0.05, delayChildren: 0.06 },
      },
    },

    scaleIn: {
      hidden: { opacity: 0, scale: reduced ? 1 : 0.97 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: reduced ? fade : spring.snug,
      },
    },

    collapse: {
      hidden: {
        height: 0,
        opacity: 0,
        transition: reduced
          ? { height: { duration: 0 }, opacity: { duration: REDUCED_FADE } }
          : { duration: duration.slow, ease: ease.inOut },
      },
      visible: {
        height: "auto",
        opacity: 1,
        transition: reduced
          ? { height: { duration: 0 }, opacity: { duration: REDUCED_FADE } }
          : { duration: duration.slow, ease: ease.inOut },
      },
    },
  };
}

/**
 * Conjunto em movimento pleno. Use direto so em contexto que ja garantiu
 * que o usuario nao pediu reducao. No componente, prefira `useVariants()`.
 */
export const variants: MotionSet = getVariants(false);

export const { fadeUp, fadeIn, stagger, scaleIn, collapse } = variants;

/* ------------------------------------------------------------------
   Transicoes nomeadas para animacao imperativa (ScoreRing, barras).
   ------------------------------------------------------------------ */

/** `drawRing` e `countUp` compartilham esta transicao, por isso andam juntos. */
export function scoreTransition(reduced: boolean): Transition {
  return reduced
    ? { duration: 0 }
    : { duration: duration.score, ease: ease.out };
}

/** Barra de sub-score (5.3): cresce de 0 ao valor, com delay escalonado de 60ms. */
export function barTransition(reduced: boolean, index = 0): Transition {
  return reduced
    ? { duration: 0 }
    : { duration: duration.slow, ease: ease.out, delay: index * 0.06 };
}

/** 4.3: press em botao e card clicavel. */
export function pressTransition(reduced: boolean): Transition {
  return { duration: reduced ? 0 : duration.instant, ease: ease.out };
}
