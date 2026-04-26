import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  /** Count appended next to title, e.g. `Priority URLs (6)`. */
  count?: number;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Size variant. `lg` = page section, `md` = card header (default). */
  size?: "md" | "lg";
};

/**
 * Editorial-style section header: em-dash eyebrow + display title + optional
 * action slot on the right. Uses the refined type scale from the redesign plan.
 */
export function SectionHeader({
  eyebrow,
  title,
  count,
  subtitle,
  actions,
  className,
  size = "md",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "mt-1 font-display font-bold tracking-tight text-foreground",
            size === "lg"
              ? "text-2xl font-bold tracking-[-0.02em]"
              : "text-base",
          )}
        >
          {title}
          {typeof count === "number" ? (
            <span className="ml-2 font-mono text-sm font-bold tracking-normal text-muted-foreground">
              ({count})
            </span>
          ) : null}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
