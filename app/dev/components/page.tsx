import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

/** Vitrine interna dos componentes base. So existe em desenvolvimento. */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
