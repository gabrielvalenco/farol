import { Wordmark } from "@/components/brand";
import { COPY } from "@/lib/copy";

/** Footer de uma linha (DESIGN.md 5.1 item 5). */
export function SiteFooter() {
  return (
    <footer data-print="hide" className="border-t border-line">
      <div className="container-page flex flex-col items-start justify-between gap-2 py-6 sm:flex-row sm:items-center">
        <Wordmark />
        <p className="text-body-sm text-ink-500">{COPY.brand.tagline}</p>
      </div>
    </footer>
  );
}
