import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileStack,
  Globe2,
  HelpCircle,
  MinusCircle,
  Send,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { IndexStatusValue } from "@/app/api/admin/index-status/route";

export type AdminIcon = ComponentType<SVGProps<SVGSVGElement>>;

/* ------------------------------------------------------------------
 * Single source of truth for admin status + stage visuals.
 * Both `dashboard-overview` and `content-table` read from here,
 * so any palette tweak happens in one place.
 * ------------------------------------------------------------------ */

export type StatusMeta = {
  value: IndexStatusValue;
  label: string;
  /** Pill className for filter chips / row badges (includes border + bg + text). */
  pill: string;
  /** Dot className (bg only) for compact indicators. */
  dot: string;
  icon: AdminIcon;
  order: number;
};

export const STATUS_META: Record<IndexStatusValue, StatusMeta> = {
  unknown: {
    value: "unknown",
    label: "Unknown",
    pill: "border-muted-foreground/20 bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground/40",
    icon: HelpCircle,
    order: 0,
  },
  not_submitted: {
    value: "not_submitted",
    label: "Belum submit",
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    icon: AlertTriangle,
    order: 1,
  },
  submitted: {
    value: "submitted",
    label: "Submitted",
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: Send,
    order: 2,
  },
  indexed: {
    value: "indexed",
    label: "Indexed",
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    order: 3,
  },
  excluded: {
    value: "excluded",
    label: "Excluded",
    pill: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
    dot: "bg-zinc-500",
    icon: MinusCircle,
    order: 4,
  },
};

export const STATUS_ORDER: IndexStatusValue[] = [
  "unknown",
  "not_submitted",
  "submitted",
  "indexed",
  "excluded",
];

export function getStatusMeta(value: IndexStatusValue | undefined): StatusMeta {
  return STATUS_META[value ?? "unknown"] ?? STATUS_META.unknown;
}

/* ------------------------------------------------------------------
 * Workflow stages — the "funnel" spine used across dashboard + monitor.
 * ------------------------------------------------------------------ */

export type StageKey = "total" | "public" | "submit" | "index" | "needs";

export type StageTone = "neutral" | "accent" | "warn" | "ok" | "danger";

export type StageMeta = {
  key: StageKey;
  /** Short eyebrow label, e.g. "Inventory" */
  eyebrow: string;
  /** Display title, e.g. "Total URL" */
  label: string;
  /** Helper description — one-line hint */
  hint: string;
  icon: AdminIcon;
  /** Default tone used when no count-based override applies. */
  tone: StageTone;
};

export const STAGE_META: Record<StageKey, StageMeta> = {
  total: {
    key: "total",
    eyebrow: "Inventory",
    label: "Total",
    hint: "Semua konten terdaftar",
    icon: FileStack,
    tone: "neutral",
  },
  public: {
    key: "public",
    eyebrow: "Public",
    label: "Indexable",
    hint: "Konten yang bisa masuk Google",
    icon: Globe2,
    tone: "neutral",
  },
  submit: {
    key: "submit",
    eyebrow: "Pipeline",
    label: "Submitted",
    hint: "Menunggu Google",
    icon: Send,
    tone: "warn",
  },
  index: {
    key: "index",
    eyebrow: "Live",
    label: "Indexed",
    hint: "Terindex di Google",
    icon: CheckCircle2,
    tone: "ok",
  },
  needs: {
    key: "needs",
    eyebrow: "Action",
    label: "Needs action",
    hint: "Belum submit / unknown",
    icon: AlertTriangle,
    tone: "danger",
  },
};

export const STAGE_ORDER: StageKey[] = [
  "total",
  "public",
  "submit",
  "index",
  "needs",
];

/** Stage tone → class map. Keep all utility classes in one spot. */
export const STAGE_TONE_CLASS: Record<
  StageTone,
  {
    /** Card surface (border + bg). */
    surface: string;
    /** Active / hover surface. */
    surfaceActive: string;
    /** Icon wrapper bg. */
    iconWrap: string;
    /** Solid dot color for compact indicators. */
    dot: string;
    /** Number / primary text. */
    number: string;
    /** Eyebrow + label color. */
    label: string;
    /** Small helper text. */
    hint: string;
  }
> = {
  neutral: {
    surface: "border-border bg-card",
    surfaceActive: "hover:border-foreground/30 hover:bg-card",
    iconWrap: "bg-muted/60 text-muted-foreground",
    dot: "bg-muted-foreground/60",
    number: "text-foreground",
    label: "text-foreground",
    hint: "text-muted-foreground",
  },
  accent: {
    surface: "border-accent/30 bg-accent/5",
    surfaceActive: "hover:border-accent/60 hover:bg-accent/10",
    iconWrap: "bg-accent/15 text-accent",
    dot: "bg-accent",
    number: "text-foreground",
    label: "text-foreground",
    hint: "text-muted-foreground",
  },
  warn: {
    surface: "border-amber-500/30 bg-amber-500/5",
    surfaceActive: "hover:border-amber-500/60 hover:bg-amber-500/10",
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    number: "text-amber-700 dark:text-amber-400",
    label: "text-foreground",
    hint: "text-muted-foreground",
  },
  ok: {
    surface: "border-emerald-500/30 bg-emerald-500/5",
    surfaceActive: "hover:border-emerald-500/60 hover:bg-emerald-500/10",
    iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    number: "text-emerald-700 dark:text-emerald-400",
    label: "text-foreground",
    hint: "text-muted-foreground",
  },
  danger: {
    surface: "border-destructive/30 bg-destructive/5",
    surfaceActive: "hover:border-destructive/60 hover:bg-destructive/10",
    iconWrap: "bg-destructive/15 text-destructive",
    dot: "bg-destructive",
    number: "text-destructive",
    label: "text-foreground",
    hint: "text-muted-foreground",
  },
};

/**
 * Optional override for a stage when count is 0 (e.g. "needs action = 0" should
 * feel like "all clear" instead of danger).
 */
export function resolveStageTone(
  meta: StageMeta,
  count: number,
): StageTone {
  if (meta.key === "needs" && count === 0) return "ok";
  return meta.tone;
}

/* ------------------------------------------------------------------
 * Metric tile tone — same palette, smaller surface area.
 * ------------------------------------------------------------------ */

export type MetricTone = StageTone;

export { Clock };
