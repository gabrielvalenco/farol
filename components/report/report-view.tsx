import { RotateCw } from "lucide-react";
import Link from "next/link";

import { MetricGauge } from "@/components/metric-gauge";
import { ScoreRing } from "@/components/score-ring";
import { ScoreIcon, ScoreStatus } from "@/components/score-status";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/analysis/types";
import { COPY, formatDate, REPORT_COPY, verdict, verdictDetails } from "@/lib/copy";
import { scoreMeta } from "@/lib/score";
import { cn } from "@/lib/utils";

import { AllChecks } from "./all-checks";
import { Conversion } from "./conversion";
import { IssueList } from "./issue-list";
import { PrintButton } from "./print-button";
import { ShareButton } from "./share-button";
import { SiteFavicon } from "./site-favicon";
import { SubScores } from "./sub-scores";

/**
 * Relatorio (DESIGN.md 5.3). A mesma arvore serve a tela e a impressao (5.4):
 * `print` desliga animacao, abre tudo e esconde o que e interacao.
 */
export function ReportView({ report, print = false }: { report: Report; print?: boolean }) {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const highImpact = report.issues.filter((issue) => issue.impact === "high").length;
  const details = verdictDetails(report.loadTimeMs, highImpact);
  const shareText = `${report.host}: nota ${report.score} de 100 no Farol. ${verdict(report.score)}`;
  const vitalsNote = report.metrics.every((m) => m.source === "field")
    ? REPORT_COPY.vitals.field
    : report.metrics.every((m) => m.source === "lab")
      ? REPORT_COPY.vitals.lab
      : REPORT_COPY.vitals.mixed;

  return (
    <>
      {print ? null : (
        <SiteHeader
          watchId="report-header"
          compact={
            <div className="flex min-w-0 items-center gap-2">
              <SiteFavicon src={report.site.favicon} />
              <span className="truncate text-body-sm font-medium text-ink-900">{report.host}</span>
              <span
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-muted px-2 text-label tnum"
                style={{ color: scoreMeta(report.score).ink }}
              >
                <ScoreIcon value={report.score} size={14} />
                {report.score}
              </span>
              <ShareButton title={report.host} text={shareText} iconOnly />
            </div>
          }
        />
      )}

      <main className={cn("container-page flex flex-col gap-14 pb-14 sm:gap-20 sm:pb-20", print ? "pt-8" : "pt-8 sm:pt-10")}>
        {/* 1. Header do relatorio */}
        <header id="report-header" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SiteFavicon src={report.site.favicon} />
              <h1 className="truncate text-h3">{report.host}</h1>
            </div>
            <p className="mt-1 text-label text-ink-500">{REPORT_COPY.analyzedAt(formatDate(report.createdAt))}</p>
          </div>
          {print ? (
            <PrintButton />
          ) : (
            <div data-print="hide" className="flex shrink-0 items-center gap-2">
              <Button asChild variant="secondary">
                <Link href={`/?url=${encodeURIComponent(report.url)}&force=1`}>
                  <RotateCw aria-hidden size={16} strokeWidth={1.75} />
                  {REPORT_COPY.reanalyze}
                </Link>
              </Button>
              <ShareButton title={report.host} text={shareText} />
            </div>
          )}
        </header>

        {/* 2. Veredito: sem card, respira direto no fundo */}
        <section aria-labelledby="verdict" className="-mt-4 flex flex-col items-center gap-6 text-center sm:-mt-8 md:flex-row md:items-center md:gap-10 md:text-left">
          <ScoreRing value={report.score} label="Nota geral" animate={!print} className="max-md:[zoom:0.7619]" />
          <div className="flex max-w-160 flex-col items-center gap-3 md:items-start">
            <ScoreStatus value={report.score} size="md" />
            <h2 id="verdict" className="text-h2">
              {verdict(report.score)}
            </h2>
            <div className="flex flex-col gap-1">
              {details.map((line) => (
                <p key={line} className="text-body text-ink-500">
                  {line}
                </p>
              ))}
              {report.scoreCap ? (
                <p className="text-body-sm text-ink-500">{REPORT_COPY.scoreCap(report.scoreCap.reason)}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* 3. Sub-scores */}
        <section aria-label="Notas por categoria">
          <SubScores categories={report.categories} animate={!print} />
        </section>

        {/* 4. Comece por aqui */}
        <section aria-labelledby="start-here" className="flex flex-col gap-6">
          <SectionTitle id="start-here" title={REPORT_COPY.startHere.title} description={REPORT_COPY.startHere.description} />
          <IssueList issues={report.issues} print={print} />
        </section>

        {/* 5. Core Web Vitals */}
        {report.metrics.length > 0 ? (
          <section aria-labelledby="vitals" className="flex flex-col gap-6">
            <SectionTitle
              id="vitals"
              title={REPORT_COPY.vitals.title}
              technical={REPORT_COPY.vitals.technical}
              description={vitalsNote}
            />
            <div className="grid grid-cols-1 gap-8 rounded-md border border-line bg-surface p-5 sm:grid-cols-3 sm:p-6">
              {report.metrics.map((metric) => (
                <MetricGauge key={metric.key} metric={metric.key} value={metric.value} animate={!print} />
              ))}
            </div>
          </section>
        ) : null}

        {/* 6. Todas as verificacoes */}
        <section aria-labelledby="all-checks" className="flex flex-col gap-6 print:break-before-page">
          <SectionTitle id="all-checks" title={REPORT_COPY.checks.title} description={REPORT_COPY.checks.description} />
          {report.categories.seo.partial ? (
            <p className="flex items-start gap-2 rounded-sm bg-warn-soft px-3 py-2.5 text-body-sm text-ink-700">
              <ScoreIcon band="warn" size={16} className="mt-0.5" />
              {REPORT_COPY.partialSeo}
            </p>
          ) : null}
          <AllChecks categories={report.categories} print={print} />
        </section>

        {/* 7. Conversao (configuravel por env) */}
        {whatsapp && !print ? <Conversion number={whatsapp} host={report.host} score={report.score} /> : null}

        {print ? null : (
          <p data-print="hide" className="-mt-6 text-center sm:-mt-10">
            <Link
              href={`/r/${report.slug}/print`}
              className="inline-flex min-h-11 items-center rounded-sm text-body-sm text-ink-500 underline decoration-line-strong underline-offset-4 transition-[color] duration-150 hover:text-ink-900"
            >
              {REPORT_COPY.print}
            </Link>
          </p>
        )}
      </main>

      {print ? (
        <p className="container-page pb-8 text-label text-ink-500">
          {COPY.brand.name}: {COPY.brand.tagline}
        </p>
      ) : (
        <SiteFooter />
      )}
    </>
  );
}

function SectionTitle({
  id,
  title,
  description,
  technical,
}: {
  id: string;
  title: string;
  description: string;
  technical?: string;
}) {
  return (
    <div className="max-w-180">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      {technical ? <p className="mt-1 font-mono text-label font-normal text-ink-500">{technical}</p> : null}
      <p className="mt-2 text-body text-ink-500">{description}</p>
    </div>
  );
}
