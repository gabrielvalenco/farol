"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { Wordmark } from "@/components/brand";
import { FEATURED_CASE, FEATURED_EXAMPLE } from "@/lib/examples";
import { cn } from "@/lib/utils";

/**
 * Header slim (DESIGN.md 3.4 e 5.1).
 * 56px, sticky, blur, e a borda inferior so aparece depois de 8px de scroll.
 *
 * `compact` (relatorio, 5.3 item 1): quando o elemento `watchId` sai da tela,
 * o conteudo compacto entra no lugar dos links.
 */
export function SiteHeader({ compact, watchId }: { compact?: ReactNode; watchId?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [showCompact, setShowCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!watchId) return;
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShowCompact(!entry.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <header
      data-print="hide"
      className={cn(
        "sticky top-0 z-40 h-14 border-b bg-surface/92 backdrop-blur-md transition-[border-color] duration-200 ease-out",
        scrolled ? "border-line" : "border-transparent",
      )}
    >
      <div className="container-page flex h-full items-center justify-between gap-4">
        <Wordmark />

        <div className="relative flex min-w-0 flex-1 items-center justify-end">
          <nav
            aria-label="Principal"
            className={cn(
              "flex items-center gap-1 transition-[opacity,translate] duration-200 ease-out",
              compact && showCompact && "pointer-events-none -translate-y-1 opacity-0",
            )}
            aria-hidden={compact && showCompact ? true : undefined}
          >
            <HeaderLink href="/#como-funciona" className="max-sm:hidden">
              Como funciona
            </HeaderLink>
            <HeaderLink href={`/casos/${FEATURED_CASE}`}>Antes e depois</HeaderLink>
            <HeaderLink href={`/r/${FEATURED_EXAMPLE.slug}`}>Ver exemplo</HeaderLink>
          </nav>

          {compact ? (
            <div
              className={cn(
                "absolute inset-0 flex min-w-0 items-center justify-end transition-[opacity,translate] duration-200 ease-out",
                showCompact ? "opacity-100" : "pointer-events-none translate-y-1 opacity-0",
              )}
              aria-hidden={showCompact ? undefined : true}
              inert={!showCompact}
            >
              {compact}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center rounded-sm px-2 text-body-sm whitespace-nowrap text-ink-500 transition-[color] duration-150 hover:text-ink-900 sm:px-2.5",
        className,
      )}
    >
      {children}
    </Link>
  );
}
