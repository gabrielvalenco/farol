import { ArrowRight, CircleCheck, CircleDashed, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CategoryCompare } from "@/components/case/category-compare";
import { MetricDeltas } from "@/components/case/metric-deltas";
import { WeightScale } from "@/components/case/weight-scale";
import { ImpactBadge } from "@/components/impact-badge";
import { ScoreRing } from "@/components/score-ring";
import { ScoreStatus } from "@/components/score-status";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/analysis/types";
import { caseSpeedup, caseWeightRatio } from "@/lib/case-metrics";
import { getCase } from "@/lib/cases";
import { CASE_COPY, CATEGORIES, COPY, formatDate, type CategoryKey } from "@/lib/copy";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const loadCase = cache((slug: string) => getCase(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCase(slug);
  if (!data) notFound();
  const { study } = data;
  const title = `${study.host}: de ${study.before.score} para ${study.after.score}`;
  const description = CASE_COPY.subtitle(study.host, caseSpeedup(study.before, study.after));
  const image = { url: `/api/og?case=${encodeURIComponent(slug)}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "article" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

function categoryScores(report: Report): Record<CategoryKey, number> {
  return Object.fromEntries(
    (Object.keys(CATEGORIES) as CategoryKey[]).map((key) => [key, report.categories[key].score]),
  ) as Record<CategoryKey, number>;
}

/** Antes e depois (DESIGN.md 5.6). */
export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const data = await loadCase(slug);
  if (!data) notFound();

  const { study, before, after } = data;
  const beforeSnap = { ...study.before, performance: before.categories.performance.score };
  const afterSnap = { ...study.after, performance: after.categories.performance.score };

  const remainingIds = new Set(after.issues.map((i) => i.id));
  const resolved = before.issues.filter((i) => !remainingIds.has(i.id));
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <>
      <SiteHeader />

      <main className="container-page flex flex-col gap-14 pt-10 pb-14 sm:gap-20 sm:pt-16 sm:pb-20">
        {/* Hero: as duas notas lado a lado */}
        <section className="flex animate-fade-up flex-col items-center text-center">
          <p className="text-label text-ink-500">
            {CASE_COPY.eyebrow} · <span className="font-mono font-normal text-ink-700">{study.host}</span>
          </p>
          <h1 className="mt-3 max-w-190 text-h1">{CASE_COPY.title(study.before.score, study.after.score)}</h1>
          <p className="mt-4 max-w-150 text-body text-ink-500">
            {CASE_COPY.subtitle(study.host, caseSpeedup(study.before, study.after))}
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 sm:gap-10">
            <RingColumn label={CASE_COPY.before} score={study.before.score} />
            <div className="flex flex-col items-center gap-2">
              <ArrowRight aria-hidden size={24} strokeWidth={1.75} className="text-ink-400" />
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-good-soft px-2 text-badge whitespace-nowrap text-good-ink">
                <TrendingUp aria-hidden size={12} strokeWidth={1.75} />
                {CASE_COPY.points(study.after.score - study.before.score)}
              </span>
            </div>
            <RingColumn label={CASE_COPY.after} score={study.after.score} delay={0.5} />
          </div>
        </section>

        {/* Numeros */}
        <section aria-labelledby="numbers" className="flex flex-col gap-6">
          <SectionTitle id="numbers" title={CASE_COPY.numbers.title} description={CASE_COPY.numbers.description} />
          <MetricDeltas before={beforeSnap} after={afterSnap} />
        </section>

        {/* Peso em escala */}
        <section aria-labelledby="weight" className="flex flex-col gap-6">
          <SectionTitle
            id="weight"
            title={CASE_COPY.weight.title}
            description={CASE_COPY.weight.description(caseWeightRatio(study.before, study.after))}
          />
          <WeightScale before={study.before.weightBytes} after={study.after.weightBytes} />
        </section>

        {/* Categorias */}
        <section aria-labelledby="categories" className="flex flex-col gap-6">
          <SectionTitle id="categories" title={CASE_COPY.categories.title} />
          <CategoryCompare before={categoryScores(before)} after={categoryScores(after)} />
        </section>

        {/* O que foi feito */}
        <section aria-labelledby="changes" className="flex flex-col gap-6">
          <SectionTitle id="changes" title={CASE_COPY.changes.title} description={CASE_COPY.changes.description} />
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {study.changes.map((change, i) => (
              <li key={change.title} className="flex gap-4 rounded-md border border-line bg-surface p-5">
                <span aria-hidden className="font-mono text-label font-normal text-ink-500 tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h3 className="text-h3">{change.title}</h3>
                  <p className="text-body-sm text-ink-700">{change.detail}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-label font-normal text-good-ink">
                    <TrendingUp aria-hidden size={14} strokeWidth={1.75} />
                    {change.effect}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Problemas resolvidos */}
        <section aria-labelledby="resolved" className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 id="resolved" className="text-h2">
              {CASE_COPY.resolved.title}
            </h2>
            <p className="text-body text-ink-500">
              {CASE_COPY.resolved.summary(resolved.length, before.issues.length)}.{" "}
              {CASE_COPY.resolved.remaining(after.issues.length)}
            </p>
            {/* Resolvidos primeiro: a regua le como uma barra de progresso. */}
            <div aria-hidden className="flex max-w-120 gap-1">
              {before.issues.map((issue, i) => (
                <span
                  key={issue.id}
                  className={cn("h-2 flex-1 rounded-full", i < resolved.length ? "bg-good" : "bg-line-strong")}
                />
              ))}
            </div>
          </div>

          <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface px-5">
            {resolved.map((issue) => (
              <li key={issue.id} className="flex items-center gap-3 py-3.5">
                <CircleCheck aria-hidden size={18} strokeWidth={1.75} className="shrink-0 text-good-ink" />
                <span className="min-w-0 flex-1 text-body text-ink-900">{issue.title}</span>
                <ImpactBadge impact={issue.impact} />
              </li>
            ))}
            {after.issues.map((issue) => (
              <li key={issue.id} className="flex items-center gap-3 py-3.5">
                <CircleDashed aria-hidden size={18} strokeWidth={1.75} className="shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 text-body text-ink-500">{issue.title}</span>
                <ImpactBadge impact={issue.impact} />
              </li>
            ))}
          </ul>
        </section>

        {/* Relatorios completos */}
        <section aria-labelledby="reports" className="flex flex-col gap-6">
          <SectionTitle id="reports" title={CASE_COPY.reports.title} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReportLink href={`/r/${study.before.report}`} label={CASE_COPY.reports.before} score={study.before.score} />
            <ReportLink href={`/r/${study.after.report}`} label={CASE_COPY.reports.after} score={study.after.score} />
          </div>
          <p className="text-body-sm text-ink-500">{CASE_COPY.method(study.method, formatDate(study.measuredAt))}</p>
        </section>

        {/* Conversao */}
        <section className="flex flex-col items-start justify-between gap-5 rounded-lg bg-muted p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-h3">{CASE_COPY.cta.title}</h2>
            <p className="text-body-sm text-ink-700">{CASE_COPY.cta.body}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild>
              <Link href="/">{CASE_COPY.cta.analyze}</Link>
            </Button>
            {whatsapp ? (
              <Button asChild variant="secondary">
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá! Vi o antes e depois do ${study.host} no Farol e quero algo assim no meu site.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {COPY.conversion.action}
                </a>
              </Button>
            ) : null}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function RingColumn({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <ScoreRing value={score} label={`Nota ${label.toLowerCase()}`} delay={delay} className="max-sm:[zoom:0.62]" />
      <figcaption className="flex flex-col items-center gap-1">
        <span className="text-label text-ink-500 uppercase">{label}</span>
        <ScoreStatus value={score} />
      </figcaption>
    </figure>
  );
}

function ReportLink({ href, label, score }: { href: string; label: string; score: number }) {
  return (
    <Link
      href={href}
      className="lift flex items-center gap-4 rounded-md border border-line bg-surface p-4 transition-[border-color,translate] duration-180 ease-out hover:border-line-strong"
    >
      <ScoreRing value={score} size={64} animate={false} />
      <span className="flex-1 text-body font-medium text-ink-900">{label}</span>
      <ArrowRight aria-hidden size={16} strokeWidth={1.75} className="text-ink-400" />
    </Link>
  );
}

function SectionTitle({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div className="max-w-180">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      {description ? <p className="mt-2 text-body text-ink-500">{description}</p> : null}
    </div>
  );
}
