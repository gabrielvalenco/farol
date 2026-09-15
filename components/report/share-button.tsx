"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { REPORT_COPY } from "@/lib/copy";

/**
 * Compartilhar (DESIGN.md 5.3 item 1). No celular abre o menu nativo
 * (WhatsApp incluso); no computador copia o link.
 */
export function ShareButton({ title, text, size = "default", iconOnly = false }: {
  title: string;
  text: string;
  size?: "default" | "sm";
  iconOnly?: boolean;
}) {
  async function share() {
    const url = window.location.href.replace(/\/print\/?$/, "");
    const canNativeShare = typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;

    if (canNativeShare) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(REPORT_COPY.linkCopied);
    } catch {
      toast.error(REPORT_COPY.linkCopyFailed, { description: REPORT_COPY.linkCopyFailedBody });
    }
  }

  if (iconOnly) {
    return (
      <Button size="icon-sm" variant="ghost" onClick={share} aria-label={REPORT_COPY.share}>
        <Share2 aria-hidden size={16} strokeWidth={1.75} />
      </Button>
    );
  }

  return (
    <Button size={size} onClick={share}>
      <Share2 aria-hidden size={16} strokeWidth={1.75} />
      {REPORT_COPY.share}
    </Button>
  );
}
