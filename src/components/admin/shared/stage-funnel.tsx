"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  STAGE_META,
  STAGE_ORDER,
  STAGE_TONE_CLASS,
  resolveStageTone,
  type StageKey,
} from "./status-tones";

export type StageCount = {
  key: StageKey;
  count: number;
  href?: string;
};

type StageFunnelProps = {
  stages: StageCount[];
  /**
   * `full` — horizontal cards with icon + number + label (default, dashboard hero).
   * `compact` — 5 dot chips in a single row, fits in a header corner.
   * `vertical` — stacked list, used in sidebar pipeline block.
   */
  variant?: "full" | "compact" | "vertical";
  /** Optional key that is currently focused — adds accent ring. */
  activeKey?: StageKey | null;
  className?: string;
  /** Called when a stage chip is clicked (compact variant). */
  onStageSelect?: (key: StageKey) => void;
};

export function StageFunnel({
  stages,
  variant = "full",
  activeKey = null,
  className,
  onStageSelect,
}: StageFunnelProps) {
  const byKey = new Map(stages.map((s) => [s.key, s]));

  /* ── compact variant ─────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <div className={cn("pointer-events-auto flex flex-wrap items-center gap-1.5", className)}>
        {STAGE_ORDER.map((key) => {
          const entry = byKey.get(key);
          if (!entry) return null;
          const meta = STAGE_META[key];
          const tone = resolveStageTone(meta, entry.count);
          const palette = STAGE_TONE_CLASS[tone];
          const isActive = activeKey === key;

          const content = (
            <>
              <span className={cn("h-1.5 w-1.5 rounded-full", palette.dot)} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                {meta.label}
              </span>
              <span className={cn("font-display text-sm font-black tabular-nums", palette.number)}>
                {entry.count}
              </span>
            </>
          );

          const baseClass = cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            palette.surface,
            isActive ? "border-accent/60 bg-accent/10" : palette.surfaceActive,
          );

          if (entry.href) {
            return (
              <Link
                key={key}
                href={entry.href}
                onClick={() => onStageSelect?.(key)}
                className={baseClass}
                aria-current={isActive ? "page" : undefined}
                data-active={isActive ? "true" : undefined}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onStageSelect?.(key)}
              className={baseClass}
              aria-pressed={isActive}
              data-active={isActive ? "true" : undefined}
            >
              {content}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── vertical variant ────────────────────────────────────────── */
  if (variant === "vertical") {
    return (
      <div className={cn("space-y-1", className)}>
        {STAGE_ORDER.map((key) => {
          const entry = byKey.get(key);
          if (!entry) return null;
          const meta = STAGE_META[key];
          const tone = resolveStageTone(meta, entry.count);
          const palette = STAGE_TONE_CLASS[tone];
          const Icon = meta.icon;

          const content = (
            <>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  palette.iconWrap,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  {meta.eyebrow}
                </span>
                <span className="block text-xs font-semibold text-foreground">
                  {meta.label}
                </span>
              </span>
              <span
                className={cn(
                  "font-display text-base font-black tabular-nums",
                  palette.number,
                )}
              >
                {entry.count}
              </span>
            </>
          );

          const baseClass = cn(
            "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition-colors",
            palette.surface,
            palette.surfaceActive,
          );

          if (entry.href) {
            return (
              <Link key={key} href={entry.href} className={baseClass}>
                {content}
              </Link>
            );
          }
          return (
            <div key={key} className={baseClass}>
              {content}
            </div>
          );
        })}
      </div>
    );
  }

  /* ── full variant — dashboard hero funnel ───────────────────────
   *
   * Layout strategy:
   * - Mobile / tablet: flex-wrap so cards wrap naturally into 2 columns.
   * - XL+: flex-nowrap, all 5 cards in one row, borders join into a
   *   single pill-row (each card removes its left border except the first).
   * - No chevron overlays — the shared border IS the visual separator.
   *   This avoids all z-index / grid-cell clipping issues.
   * ─────────────────────────────────────────────────────────────── */
  const stageNodes: React.ReactNode[] = [];

  STAGE_ORDER.forEach((key, idx) => {
    const entry = byKey.get(key);
    if (!entry) return;
    const meta = STAGE_META[key];
    const tone = resolveStageTone(meta, entry.count);
    const palette = STAGE_TONE_CLASS[tone];
    const Icon = meta.icon;
    const urgent = meta.key === "needs" && entry.count > 0;
    const isFirst = idx === 0;
    const isLast = idx === STAGE_ORDER.length - 1;

    const cardContent = (
      <>
        {urgent ? (
          <span className="absolute right-3 top-3 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        ) : null}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              palette.iconWrap,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              {meta.eyebrow}
            </p>
            <p
              className={cn(
                "mt-0.5 font-display text-3xl font-black tracking-tighter tabular-nums leading-none",
                palette.number,
              )}
            >
              {entry.count}
            </p>
            <p className="mt-1.5 text-xs font-semibold tracking-tight text-foreground">
              {meta.label}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {meta.hint}
            </p>
          </div>
        </div>
      </>
    );

    const baseClass = cn(
      // base
      "relative border p-4 transition-all duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:shadow-md",
      // mobile: 2-per-row (gap-2 = 8px, so each takes half minus half the gap)
      "basis-[calc(50%-4px)] xl:basis-auto xl:flex-1 xl:min-w-0",
      palette.surface,
      entry.href ? palette.surfaceActive : "",
      // mobile: each card is its own pill; XL: they join into one strip
      "rounded-2xl xl:rounded-none",
      isFirst && "xl:rounded-l-2xl",
      isLast && "xl:rounded-r-2xl",
      // on XL: remove left border so cards share edges (joined strip effect)
      !isFirst && "xl:border-l-0",
    );

    stageNodes.push(
      entry.href ? (
        <Link
          key={key}
          href={entry.href}
          className={baseClass}
          aria-label={`${meta.label}: ${entry.count}`}
        >
          {cardContent}
        </Link>
      ) : (
        <div key={key} className={baseClass}>
          {cardContent}
        </div>
      ),
    );
  });

  return (
    <div className={cn("flex flex-wrap gap-2 xl:flex-nowrap xl:gap-0", className)}>
      {stageNodes}
    </div>
  );
}
