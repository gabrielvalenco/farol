"use client";

import { MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { COPY, whatsappMessage } from "@/lib/copy";
import { duration, ease } from "@/lib/motion";
import { useMotion } from "@/lib/use-motion";

/**
 * Rodape de conversao (DESIGN.md 5.3 item 7 e 8).
 * So existe com NEXT_PUBLIC_WHATSAPP_NUMBER configurado.
 * No mobile vira CTA fixo no fim da tela depois de 60% de scroll.
 */
export function Conversion({ number, host, score }: { number: string; host: string; score: number }) {
  const { reduced } = useMotion();
  const [href, setHref] = useState(() => whatsappUrl(number, host, score, ""));
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    setHref(whatsappUrl(number, host, score, window.location.href));
  }, [number, host, score]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShowSticky(max > 0 && window.scrollY / max >= 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const action = (
    <Button asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle aria-hidden size={16} strokeWidth={1.75} />
        {COPY.conversion.action}
      </a>
    </Button>
  );

  return (
    <>
      <section
        data-print="hide"
        className="flex flex-col items-start justify-between gap-4 rounded-lg bg-muted p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <h2 className="text-h3">{COPY.conversion.title}</h2>
        {action}
      </section>

      <AnimatePresence>
        {showSticky ? (
          <motion.div
            data-print="hide"
            key="sticky"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface sm:hidden"
            initial={{ y: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }}
            transition={reduced ? { duration: 0.15 } : { duration: duration.base, ease: ease.out }}
          >
            <div className="container-page flex items-center justify-between gap-3 py-3">
              <p className="text-body-sm font-medium text-ink-900">{COPY.conversion.title}</p>
              {action}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function whatsappUrl(number: string, host: string, score: number, reportUrl: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage(host, score, reportUrl))}`;
}
