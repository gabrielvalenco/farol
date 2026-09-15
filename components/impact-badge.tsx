import { impactMeta, type Impact } from "@/lib/score";
import { cn } from "@/lib/utils";

/**
 * Chip de impacto (DESIGN.md 6.4). 22px, raio full, 11px weight 500, sem borda.
 * O texto usa as cores `-ink`, que passam 4.5:1 sobre o fundo soft.
 */
export function ImpactBadge({ impact, className }: { impact: Impact; className?: string }) {
  const meta = impactMeta(impact);
  return (
    <span
      className={cn(
        "inline-flex h-5.5 shrink-0 items-center whitespace-nowrap rounded-full px-2 text-badge",
        className,
      )}
      style={{ color: meta.color, backgroundColor: meta.background }}
    >
      {meta.label}
    </span>
  );
}
