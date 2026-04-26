import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  STAGE_TONE_CLASS,
  type AdminIcon,
  type MetricTone,
} from "./status-tones";
import type { ReactNode } from "react";

type MetricTileProps = {
  eyebrow?: string;
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  hint?: ReactNode;
  icon?: AdminIcon;
  tone?: MetricTone;
  href?: string;
  className?: string;
  /** When true, adds a subtle pulse dot on the corner. */
  urgent?: boolean;
};

/**
 * Uniform metric tile used across the dashboard + monitor header.
 * Replaces the ad-hoc `rounded-xl border ...` spans.
 */
export function MetricTile({
  eyebrow,
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
  className,
  urgent = false,
}: MetricTileProps) {
  const palette = STAGE_TONE_CLASS[tone];

  const body = (
    <>
      {urgent ? (
        <span className="absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        {Icon ? (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center",
              palette.iconWrap,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <p
            className={cn(
              "mt-0.5 font-display text-2xl font-black tracking-tighter tabular-nums",
              palette.number,
            )}
          >
            {value}
            {suffix ? (
              <span className="ml-1 font-mono text-xs font-bold text-muted-foreground">
                {suffix}
              </span>
            ) : null}
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-medium tracking-tight",
              palette.label,
            )}
          >
            {label}
          </p>
          {hint ? (
            <p className={cn("mt-0.5 text-[11px]", palette.hint)}>{hint}</p>
          ) : null}
        </div>
      </div>
    </>
  );

  const baseClass = cn(
    "relative block border p-3.5 transition-colors",
    palette.surface,
    href ? palette.surfaceActive : "",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {body}
      </Link>
    );
  }

  return <div className={baseClass}>{body}</div>;
}
