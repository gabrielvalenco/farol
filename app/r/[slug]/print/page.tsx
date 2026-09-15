import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportView } from "@/components/report/report-view";
import { getReport } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const report = await getReport(slug);
  return {
    title: report ? `${report.host}: relatório para impressão` : "Relatório não encontrado",
    robots: { index: false, follow: false },
  };
}

/** Versao de impressao (DESIGN.md 5.4): tudo aberto, sem animacao. O PDF sai do navegador. */
export default async function PrintPage({ params }: Props) {
  const { slug } = await params;
  const report = await getReport(slug);
  if (!report) notFound();
  return <ReportView report={report} print />;
}
