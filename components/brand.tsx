import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Mark do Farol (DESIGN.md 2): circulo de 20px com dois arcos concentricos
 * abrindo pra direita, stroke 1.75, sem preenchimento.
 * Nunca aparece sozinho fora do favicon: use `Wordmark`.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" className={cn("shrink-0", className)}>
      <g stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round">
        <circle cx="6" cy="10" r="2" />
        <path d="M9.21 6.17A5 5 0 0 1 9.21 13.83" />
        <path d="M11.79 3.11A9 9 0 0 1 11.79 16.89" opacity="0.35" />
      </g>
    </svg>
  );
}

export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const content = (
    <>
      <Mark />
      <span className="text-h3 leading-none font-semibold tracking-[-0.03em] text-ink-900">Farol</span>
    </>
  );

  if (!href) return <span className={cn("inline-flex items-center gap-2", className)}>{content}</span>;

  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2 rounded-sm", className)} aria-label="Farol, página inicial">
      {content}
    </Link>
  );
}
