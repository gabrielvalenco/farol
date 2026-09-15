"use client";

import { CircleCheck, CircleX } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ReportCategory } from "@/lib/analysis/types";
import { CATEGORIES, REPORT_COPY, type CategoryKey } from "@/lib/copy";

const ORDER: CategoryKey[] = ["performance", "seo", "accessibility", "best-practices"];

/**
 * "Todas as verificacoes" (DESIGN.md 5.3 item 6): accordion por categoria,
 * fechado por padrao. Na impressao, tudo aberto (5.4).
 */
export function AllChecks({
  categories,
  print = false,
}: {
  categories: Record<CategoryKey, ReportCategory>;
  print?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-5">
      <Accordion type="multiple" {...(print ? { value: ORDER } : {})}>
        {ORDER.map((key) => {
          const category = categories[key];
          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger>
                <span>
                  {REPORT_COPY.checks.summary(CATEGORIES[key].label, category.passed, category.total)
                    .split(/(\d+)/)
                    .map((part, i) => (/^\d+$/.test(part) ? <span key={i} className="tnum">{part}</span> : part))}
                </span>
              </AccordionTrigger>
              <AccordionContent forceMount>
                <ul className="flex flex-col">
                  {category.checks.map((check) => (
                    <li
                      key={check.id}
                      className="flex items-start gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0"
                    >
                      {check.passed ? (
                        <CircleCheck aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-good-ink" />
                      ) : (
                        <CircleX aria-hidden size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bad-ink" />
                      )}
                      <span className="sr-only">{check.passed ? REPORT_COPY.checks.passed : REPORT_COPY.checks.failed}: </span>
                      <span className="min-w-0 flex-1 text-body-sm text-ink-700">{check.title}</span>
                      {check.displayValue ? (
                        <span className="shrink-0 font-mono text-mono text-ink-500 tnum">{check.displayValue}</span>
                      ) : null}
                      {check.source === "farol" ? (
                        <span className="inline-flex h-5.5 shrink-0 items-center rounded-sm bg-accent-soft px-2 text-badge text-accent">
                          {REPORT_COPY.checks.farol}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
