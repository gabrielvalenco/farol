import { Compass } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex flex-col items-center py-20 text-center sm:py-30">
        <Compass aria-hidden size={32} strokeWidth={1.75} className="text-ink-400" />
        <h1 className="mt-4 text-h2">Essa página não existe</h1>
        <p className="mt-3 max-w-110 text-body text-ink-500">
          O endereço pode estar digitado errado. Volte pro início e analise um site.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Voltar pro início</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
