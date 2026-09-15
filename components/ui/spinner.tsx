import { cn } from "@/lib/utils";

/**
 * Arco girando (DESIGN.md 5.2 e 6.7). 1s linear infinite, stroke 1.5.
 * Com prefers-reduced-motion o CSS para o giro e o arco fica parado.
 */
export function Spinner({
  size = 14,
  className,
  label,
}: {
  size?: 14 | 16;
  className?: string;
  /** Sem label o spinner e decorativo; quem usa anuncia o estado. */
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0 animate-spin", className)}
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path
        d="M8 1.75A6.25 6.25 0 0 1 14.25 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
