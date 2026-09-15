"use client";

import { Globe } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Favicon do site analisado, 16px. Se nao carregar, vira o globo neutro. */
export function SiteFavicon({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <Globe aria-hidden size={16} strokeWidth={1.75} className={cn("shrink-0 text-ink-400", className)} />;
  }

  return (
    // Imagem de terceiro, 16px: <img> simples, sem otimizacao do Next.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      className={cn("size-4 shrink-0", className)}
      onError={() => setFailed(true)}
    />
  );
}
