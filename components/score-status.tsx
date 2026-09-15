import { CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";

import { bandMeta, scoreMeta, type ScoreBand, type ScoreIcon as ScoreIconKey } from "@/lib/score";
import { cn } from "@/lib/utils";

/**
 * Resolve a chave de icone de `lib/score.ts` para o componente Lucide.
 * Os nomes da spec (check-circle-2, alert-triangle, alert-octagon) foram
 * renomeados no Lucide; estes sao os equivalentes atuais.
 */
const ICONS: Record<ScoreIconKey, LucideIcon> = {
  "check-circle-2": CircleCheck,
  "alert-triangle": TriangleAlert,
  "alert-octagon": OctagonAlert,
};

type BandInput = { band: ScoreBand; value?: never } | { value: number; band?: never };

function resolve(input: BandInput) {
  return input.band !== undefined ? bandMeta(input.band) : scoreMeta(input.value);
}

/** Icone da faixa, decorativo. Sempre acompanhado de texto em algum lugar. */
export function ScoreIcon({
  size = 16,
  className,
  ...input
}: BandInput & { size?: 14 | 16 | 18 | 20 | 24; className?: string }) {
  const meta = resolve(input);
  const Icon = ICONS[meta.icon];
  return (
    <Icon
      aria-hidden
      size={size}
      strokeWidth={1.75}
      className={cn("shrink-0", className)}
      style={{ color: meta.ink }}
    />
  );
}

/**
 * Icone + rotulo da faixa (DESIGN.md 3.1: cor nunca e o unico canal).
 * Usa a cor de texto da faixa, que passa 4.5:1.
 */
export function ScoreStatus({
  size = "sm",
  className,
  ...input
}: BandInput & { size?: "sm" | "md"; className?: string }) {
  const meta = resolve(input);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        size === "sm" ? "text-label" : "text-body-sm font-medium",
        className,
      )}
      style={{ color: meta.ink }}
    >
      <ScoreIcon band={meta.band} size={size === "sm" ? 14 : 16} />
      {meta.label}
    </span>
  );
}
