"use client";

import { Check, CircleX, Info, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { Spinner } from "@/components/ui/spinner";

/**
 * Toaster (DESIGN.md 3 e 6).
 *
 * Sucesso nao e verde: a secao 1 reserva verde para score. So o erro usa
 * a cor de texto `--bad-ink`, como a mensagem de erro do UrlInput (6.1).
 */
function Toaster(props: ToasterProps) {
  const iconProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;

  return (
    <Sonner
      position="bottom-center"
      gap={8}
      icons={{
        success: <Check {...iconProps} className="text-ink-900" />,
        info: <Info {...iconProps} className="text-ink-500" />,
        warning: <TriangleAlert {...iconProps} className="text-warn-ink" />,
        error: <CircleX {...iconProps} className="text-bad-ink" />,
        loading: <Spinner size={16} className="text-ink-500" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-(--width) items-start gap-3 rounded-md border border-line bg-surface p-4 shadow-md",
          icon: "mt-0.5 flex shrink-0",
          content: "flex min-w-0 flex-1 flex-col gap-0.5",
          title: "text-body-sm font-medium text-ink-900",
          description: "text-body-sm text-ink-500",
          actionButton:
            "h-9 shrink-0 rounded-control bg-accent px-3 text-body-sm font-medium text-white hover:bg-accent-hover",
          cancelButton:
            "h-9 shrink-0 rounded-control px-3 text-body-sm font-medium text-ink-500 hover:bg-muted hover:text-ink-900",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
