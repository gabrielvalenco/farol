"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Erro inesperado ao renderizar. Diz o que aconteceu e o que fazer (DESIGN.md 9). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center py-20 text-center">
      <TriangleAlert aria-hidden size={32} strokeWidth={1.75} className="text-ink-400" />
      <h1 className="mt-4 text-h2">Essa página não carregou</h1>
      <p className="mt-3 max-w-110 text-body text-ink-500">
        Aconteceu um erro do nosso lado ao montar a página. Tente carregar de novo; se continuar, volte pro início.
      </p>
      <div className="mt-8 flex gap-2">
        <Button onClick={reset}>Tentar de novo</Button>
        <Button asChild variant="secondary">
          <Link href="/">Voltar pro início</Link>
        </Button>
      </div>
    </main>
  );
}
