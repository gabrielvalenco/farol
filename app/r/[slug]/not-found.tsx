import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { REPORT_COPY } from "@/lib/copy";

export default function ReportNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex flex-col items-center py-20 text-center sm:py-30">
        <FileQuestion aria-hidden size={32} strokeWidth={1.75} className="text-ink-400" />
        <h1 className="mt-4 text-h2">{REPORT_COPY.notFound.title}</h1>
        <p className="mt-3 max-w-110 text-body text-ink-500">{REPORT_COPY.notFound.body}</p>
        <Button asChild className="mt-8">
          <Link href="/">{REPORT_COPY.notFound.action}</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
