import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Input generico (DESIGN.md 3.3: raio sm; 6.1: 16px evita zoom no iOS).
 * O campo de URL da landing e o `UrlInput`, nao este.
 */
function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-sm border border-line bg-surface px-3",
        "text-input text-ink-900 placeholder:text-ink-400",
        "transition-[border-color] duration-150 ease-out",
        "hover:border-line-strong focus-visible:border-line-strong",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-500",
        "aria-invalid:border-bad",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
