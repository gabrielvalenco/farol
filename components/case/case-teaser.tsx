import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

import { ScoreRing } from "@/components/score-ring";
import { caseSpeedup, caseWeightRatio } from "@/lib/case-metrics";
import { getCaseStudy } from "@/lib/cases";
import { CASE_COPY } from "@/lib/copy";

/**
 * Destaque do caso real na landing (DESIGN.md 5.6).
 * O card inteiro e o link; os aneis ja chegam no valor final (sem animar
 * fora da hora, 4.3).
 */
export async function CaseTeaser({ slug }: { slug: string }) {
  const study = await getCaseStudy(slug);
  if (!study) return null;

  const highlights = [
    `${caseSpeedup(study.before, study.after)} mais rápido`,
    `${caseWeightRatio(study.before, study.after)} mais leve`,
    study.after.cls < 0.005 ? "Parou de pular" : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <Link
      href={`/casos/${slug}`}
      className="group lift press flex flex-col gap-6 rounded-lg border border-line bg-surface p-6 text-left transition-[border-color,translate,scale] duration-180 ease-out hover:border-line-strong sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-label text-ink-500">
          {CASE_COPY.teaser.eyebrow} · <span className="font-mono font-normal text-ink-700">{study.host}</span>
        </p>
        <h2 className="text-h2">{CASE_COPY.teaser.title(study.before.score, study.after.score)}</h2>
        <ul className="mt-1 flex flex-wrap gap-2">
          {highlights.map((item) => (
            <li
              key={item}
              className="inline-flex h-6 items-center gap-1 rounded-full bg-good-soft px-2 text-badge text-good-ink"
            >
              <TrendingUp aria-hidden size={12} strokeWidth={1.75} />
              {item}
            </li>
          ))}
        </ul>
        <span className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-accent group-hover:text-accent-hover">
          {CASE_COPY.teaser.action}
          <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
        </span>
      </div>

      <div aria-hidden className="flex shrink-0 items-center gap-3 self-center">
        <ScoreRing value={study.before.score} size={96} animate={false} />
        <ArrowRight size={20} strokeWidth={1.75} className="text-ink-400" />
        <ScoreRing value={study.after.score} size={96} animate={false} />
      </div>
    </Link>
  );
}
