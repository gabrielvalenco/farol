/** Slug do caso a que um relatorio pertence: `caso-<slug>-antes|depois`. */
export function caseOfReport(reportSlug: string): { slug: string; version: "antes" | "depois" } | null {
  const match = reportSlug.match(/^caso-([a-z0-9-]+)-(antes|depois)$/);
  return match ? { slug: match[1], version: match[2] as "antes" | "depois" } : null;
}
