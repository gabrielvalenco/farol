"use client";

import { AnimatePresence, motion } from "motion/react";

import { Skeleton } from "@/components/ui/skeleton";
import { duration, ease } from "@/lib/motion";
import { useMotion } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

/**
 * Mockup de browser slim (DESIGN.md 5.2): barra de 28px, tres circulos de 8px
 * em --line e a URL em mono 11px. O screenshot entra com fade + scale 0.98 -> 1.
 * O skeleton ocupa exatamente a mesma caixa: nada se move quando a imagem chega.
 */
export function BrowserFrame({
  host,
  favicon,
  screenshot,
  className,
}: {
  host: string;
  favicon: string | null;
  screenshot: string | null;
  className?: string;
}) {
  const { reduced } = useMotion();

  return (
    <figure
      className={cn("w-full max-w-56 overflow-hidden rounded-md border border-line bg-surface shadow-xs", className)}
      aria-label={screenshot ? `Captura de tela de ${host}` : `Carregando captura de tela de ${host}`}
    >
      <div className="flex h-7 items-center gap-2 border-b border-line px-2.5">
        <span aria-hidden className="flex gap-1">
          <span className="size-2 rounded-full bg-line" />
          <span className="size-2 rounded-full bg-line" />
          <span className="size-2 rounded-full bg-line" />
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          {favicon ? (
            // Favicon de site de terceiro: <img> simples, sem otimizacao do Next.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={10}
              height={10}
              className="size-2.5 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <span className="truncate font-mono text-chrome text-ink-500">{host}</span>
        </span>
      </div>

      <div className="relative aspect-3/4 bg-muted">
        <AnimatePresence initial={false}>
          {screenshot ? (
            <motion.img
              key="shot"
              src={screenshot}
              alt=""
              className="absolute inset-0 size-full object-cover object-top"
              initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduced ? { duration: 0.15 } : { duration: duration.base, ease: ease.out }}
            />
          ) : (
            <motion.div key="skeleton" className="absolute inset-0 flex flex-col gap-2.5 p-3" exit={{ opacity: 0 }}>
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-2 h-24 w-full rounded-sm" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </figure>
  );
}
