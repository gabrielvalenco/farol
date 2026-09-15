import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Badge generico (DESIGN.md 3.3: raio sm).
 * Nao existe variante verde/ambar/vermelha aqui: cor semantica e so pra score,
 * e para isso existem `ImpactBadge` e `ScoreStatus`.
 */
const badgeVariants = cva(
  "inline-flex h-5.5 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-2 text-badge [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-ink-700",
        accent: "bg-accent-soft text-accent",
        outline: "border border-line bg-surface text-ink-700",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
