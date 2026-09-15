import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Skeleton (DESIGN.md 6.6).
 *
 * Regra: dimensao e raio IDENTICOS ao conteudo final. Passe a mesma altura,
 * largura e `rounded-*` do componente que vai substituir este bloco.
 * Um skeleton que causa reflow ao ser trocado e pior que nenhum.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("shimmer rounded-sm", className)} {...props} />;
}

export { Skeleton };
