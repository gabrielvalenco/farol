import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ReportView } from "@/components/report/report-view";
import { verdict } from "@/lib/copy";
import { getReport } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const loadReport = cache((slug: string) => getReport(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const report = await loadReport(slug);
  // notFound() aqui, antes do streaming comecar, garante status 404 de verdade.
  if (!report) notFound();

  const title = `${report.host}: nota ${report.score}`;
  const description = verdict(report.score);
  const image = { url: `/api/og?slug=${encodeURIComponent(slug)}`, width: 1200, height: 630, alt: title };

  return {
    title,
    description,
    // Relatorio e compartilhado por link, nao e conteudo pra busca.
    robots: { index: false, follow: false },
    openGraph: { title, description, images: [image], type: "article" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function ReportPage({ params }: Props) {
  const { slug } = await params;
  const report = await loadReport(slug);
  if (!report) notFound();
  return <ReportView report={report} />;
}
