"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { IssueCard } from "@/components/issue-card";
import type { ReportIssue } from "@/lib/analysis/types";
import { REPORT_COPY } from "@/lib/copy";
import { viewportOnce } from "@/lib/motion";
import { useVariants } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

/** Quantos problemas aparecem em "Comece por aqui" (5.3 item 4: de 3 a 5). */
const TOP = 5;

/**
 * "Comece por aqui": os de maior impacto em coluna unica, stagger so nos cards.
 * O resto fica atras de "Ver mais", pra nao soterrar a leitura do publico leigo.
 */
export function IssueList({ issues, print = false }: { issues: ReportIssue[]; print?: boolean }) {
  const v = useVariants();
  const [expanded, setExpanded] = useState(false);
  const restId = useId();

  if (issues.length === 0) {
    return <p className="rounded-md border border-line bg-surface p-5 text-body text-ink-700">{REPORT_COPY.startHere.empty}</p>;
  }

  const top = issues.slice(0, TOP);
  const rest = issues.slice(TOP);

  if (print) {
    return (
      <div className="flex flex-col gap-3">
        {issues.map((issue, i) => (
          <IssueCard key={issue.id} issue={issue} emphasized={i === 0} defaultOpen />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.ul
        className="flex flex-col gap-3"
        variants={v.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {top.map((issue, i) => (
          <motion.li key={issue.id} variants={v.fadeUp}>
            <IssueCard issue={issue} emphasized={i === 0} />
          </motion.li>
        ))}
      </motion.ul>

      {rest.length > 0 ? (
        <>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.ul
                id={restId}
                key="rest"
                variants={v.collapse}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex flex-col gap-3 overflow-hidden"
              >
                {rest.map((issue) => (
                  <li key={issue.id}>
                    <IssueCard issue={issue} />
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={restId}
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-sm text-body-sm font-medium text-accent transition-[color] duration-150 hover:text-accent-hover"
          >
            {expanded ? REPORT_COPY.startHere.less : REPORT_COPY.startHere.more(rest.length)}
            <ChevronDown
              aria-hidden
              size={16}
              strokeWidth={1.75}
              className={cn("transition-transform duration-200 ease-out", expanded && "rotate-180")}
            />
          </button>
        </>
      ) : null}
    </div>
  );
}
