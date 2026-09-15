import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Botao (DESIGN.md 6.7).
 *
 * Alvo de toque: o botao visual tem 40px (36px no sm), mas a secao 8 pede
 * 44px. Um pseudo-elemento invisivel estende a area clicavel na vertical
 * sem mudar o desenho.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-control text-body-sm font-medium select-none",
    "transition-[background-color,border-color,color,scale] duration-150 ease-out press",
    "disabled:pointer-events-none disabled:opacity-50",
    "before:absolute before:inset-x-0 before:content-['']",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover",
        secondary: "border border-line bg-surface text-ink-700 hover:bg-muted",
        ghost: "text-ink-500 hover:bg-muted hover:text-ink-900",
      },
      size: {
        default: "h-10 px-4 before:-inset-y-0.5",
        sm: "h-9 px-3 before:-inset-y-1",
        icon: "size-10 before:-inset-y-0.5",
        "icon-sm": "size-9 before:-inset-y-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Renderiza o filho (ex.: `<Link>`) com o estilo do botao. */
    asChild?: boolean;
    /** Troca o texto por um spinner de 14px mantendo a largura original. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* O conteudo continua ocupando espaco: a largura nao muda no loading. */}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {children}
      </span>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={14} />
        </span>
      ) : null}
    </button>
  );
}

export { Button, buttonVariants, type ButtonProps };
