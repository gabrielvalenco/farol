"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { REPORT_COPY } from "@/lib/copy";

export function PrintButton() {
  return (
    <Button data-print="hide" variant="secondary" onClick={() => window.print()}>
      <Printer aria-hidden size={16} strokeWidth={1.75} />
      {REPORT_COPY.printNow}
    </Button>
  );
}
