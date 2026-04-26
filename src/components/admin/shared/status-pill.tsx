import { cn } from "@/lib/utils";
import { getStatusMeta } from "./status-tones";
import type { IndexStatusValue } from "@/app/api/admin/index-status/route";

type StatusPillProps = {
  value: IndexStatusValue | undefined;
  /** Show the status icon before the label. */
  withIcon?: boolean;
  className?: string;
  /** Override label, e.g. for localisation. */
  label?: string;
};

/**
 * Unified status pill. Replaces ad-hoc `border ... bg-... text-...`
 * spans scattered across dashboard + monitor.
 */
export function StatusPill({
  value,
  withIcon = false,
  className,
  label,
}: StatusPillProps) {
  const meta = getStatusMeta(value);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
        meta.pill,
        className,
      )}
    >
      {withIcon ? <Icon className="h-2.5 w-2.5" /> : null}
      {label ?? meta.label}
    </span>
  );
}

/** Compact dot + label, for sidebar pipeline or row metadata. */
export function StatusDot({
  value,
  className,
}: {
  value: IndexStatusValue | undefined;
  className?: string;
}) {
  const meta = getStatusMeta(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {meta.label}
      </span>
    </span>
  );
}
