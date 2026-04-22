"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  FileText,
  StickyNote,
  Wrench,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchContentInventory,
  fetchIndexStatuses,
  refreshFromGsc,
  type InventoryItem,
  type IndexStatusRecord,
} from "@/components/admin/admin-api-client";
import {
  WeeklyTargetChart,
  WEEKLY_TARGET,
} from "@/components/admin/weekly-target-chart";
import { PostingHeatmap } from "@/components/admin/posting-heatmap";
import { useToast } from "@/hooks/use-toast";
import { getIsoWeek } from "@/lib/iso-week";
import { cn } from "@/lib/utils";

type GscQuickFilter = "needs_review" | "unknown_google" | "indexed_google";

const GSC_TAB_NAME = "snipgeek-gsc-console";
let gscWindowRef: Window | null = null;

type PriorityRefreshState = {
  running: boolean;
  done: number;
  total: number;
};

function getWeekUrgency(count: number): "ok" | "watch" | "late" {
  if (count >= WEEKLY_TARGET) return "ok";
  const dow = new Date().getDay();
  if (dow === 0) return "late";
  if (dow === 6) return "watch";
  return "ok";
}

/** Fat numeric ticker used for the hero stat. */
function HeroNumber({ value, suffix }: { value: number; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-1 leading-none">
      <span className="font-display text-5xl font-black tracking-[-0.06em] md:text-6xl">
        {value}
      </span>
      {suffix && (
        <span className="font-display text-lg font-black tracking-tighter text-muted-foreground/60 md:text-xl">
          {suffix}
        </span>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "flat";
  accent?: "emerald" | "amber" | "destructive" | "primary";
}) {
  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="h-3 w-3" />
    ) : trend === "down" ? (
      <TrendingDown className="h-3 w-3" />
    ) : trend === "flat" ? (
      <Minus className="h-3 w-3" />
    ) : null;

  const accentColor = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    destructive: "text-destructive",
    primary: "text-primary",
  }[accent ?? "primary"];

  return (
    <div className="group relative rounded-2xl border border-border/70 bg-card/40 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </p>
        {trendIcon && (
          <span className={cn("mt-0.5", accentColor)}>{trendIcon}</span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-3xl font-black tracking-tighter",
            accentColor,
          )}
        >
          {value}
        </span>
      </div>
      {sub && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          — {kicker}
        </p>
        <h2 className="mt-1 font-display text-xl font-black uppercase tracking-tighter md:text-2xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function typeLabel(type: InventoryItem["type"]) {
  if (type === "blog") return "Blog";
  if (type === "note") return "Note";
  return "Tool";
}

function statusLabel(status: string) {
  if (status === "indexed") return "Indexed";
  if (status === "submitted") return "Submitted";
  if (status === "excluded") return "Excluded";
  if (status === "not_submitted") return "Belum submit";
  return "Unknown";
}

function statusTone(status: string) {
  if (status === "indexed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  if (status === "submitted") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  if (status === "excluded") {
    return "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }

  return "border-destructive/30 bg-destructive/10 text-destructive";
}

function buildMonitorHref(params: {
  type?: string;
  status?: string;
  locale?: string;
  q?: string;
  gsc?: GscQuickFilter;
  visibility?: "public" | "hidden";
}) {
  const searchParams = new URLSearchParams();

  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);
  if (params.locale) searchParams.set("locale", params.locale);
  if (params.q) searchParams.set("q", params.q);
  if (params.gsc) searchParams.set("gsc", params.gsc);
  if (params.visibility) searchParams.set("visibility", params.visibility);

  const query = searchParams.toString();
  return query ? `/admin/index-monitor?${query}` : "/admin/index-monitor";
}

/** Opens the GSC property page (reliable, no deep-link 404) */
function gscPropertyUrl(property = "sc-domain:snipgeek.com") {
  const params = new URLSearchParams({ resource_id: property });
  return `https://search.google.com/u/0/search-console?${params.toString()}`;
}

export function DashboardOverview() {
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [statuses, setStatuses] = useState<IndexStatusRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityRefresh, setPriorityRefresh] = useState<PriorityRefreshState>({
    running: false,
    done: 0,
    total: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [inv, st] = await Promise.all([
          fetchContentInventory(),
          fetchIndexStatuses(),
        ]);
        if (cancelled) return;
        setInventory(inv.items);
        setStatuses(st.items);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusMap = useMemo(() => {
    const m = new Map<string, IndexStatusRecord>();
    for (const s of statuses ?? []) m.set(s.id, s);
    return m;
  }, [statuses]);

  const kpis = useMemo(() => {
    if (!inventory) return null;
    const total = inventory.length;
    let blog = 0,
      note = 0,
      tool = 0;
    let indexed = 0,
      submitted = 0,
      notSubmitted = 0,
      excluded = 0;
    for (const item of inventory) {
      if (item.type === "blog") blog++;
      else if (item.type === "note") note++;
      else tool++;
      const s = statusMap.get(item.id)?.status ?? "unknown";
      if (s === "indexed") indexed++;
      else if (s === "submitted") submitted++;
      else if (s === "excluded") excluded++;
      else notSubmitted++;
    }
    const indexedPct = total === 0 ? 0 : Math.round((indexed / total) * 100);
    return {
      total,
      blog,
      note,
      tool,
      indexed,
      submitted,
      notSubmitted,
      excluded,
      indexedPct,
    };
  }, [inventory, statusMap]);

  const articleDates = useMemo(() => {
    if (!inventory) return [];
    const seenPerWeek = new Set<string>();
    const dates: string[] = [];
    for (const item of inventory) {
      if (item.type === "tool" || item.draft || !item.date) continue;
      const w = getIsoWeek(new Date(item.date)).key;
      const key = `${w}::${item.slug}`;
      if (seenPerWeek.has(key)) continue;
      seenPerWeek.add(key);
      dates.push(item.date);
    }
    return dates;
  }, [inventory]);

  const weekStats = useMemo(() => {
    if (!articleDates.length)
      return { current: 0, previous: 0, urgency: "ok" as const };
    const currentKey = getIsoWeek(new Date()).key;
    const prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 7);
    const prevKey = getIsoWeek(prevDate).key;
    let current = 0,
      previous = 0;
    for (const d of articleDates) {
      const k = getIsoWeek(new Date(d)).key;
      if (k === currentKey) current++;
      else if (k === prevKey) previous++;
    }
    return { current, previous, urgency: getWeekUrgency(current) };
  }, [articleDates]);

  const weekTrend: "up" | "down" | "flat" =
    weekStats.current > weekStats.previous
      ? "up"
      : weekStats.current < weekStats.previous
        ? "down"
        : "flat";

  const actionableSummary = useMemo(() => {
    if (!inventory) {
      return {
        indexableTotal: 0,
        gatedOrDraft: 0,
        indexed: 0,
        submitted: 0,
        needsAction: 0,
      };
    }

    let indexableTotal = 0;
    let gatedOrDraft = 0;
    let indexed = 0;
    let submitted = 0;
    let needsAction = 0;

    for (const item of inventory) {
      const isNonIndexable = Boolean(
        item.draft ||
        item.requiresAuth ||
        item.excludeFromIndexMonitoring ||
        (item.type === "blog" && item.hasLocalePair === false),
      );

      if (isNonIndexable) {
        gatedOrDraft++;
        continue;
      }

      indexableTotal++;

      const status = statusMap.get(item.id)?.status ?? "unknown";

      if (status === "indexed") indexed++;
      else if (status === "submitted") submitted++;
      else needsAction++;
    }

    return {
      indexableTotal,
      gatedOrDraft,
      indexed,
      submitted,
      needsAction,
    };
  }, [inventory, statusMap]);

  const priorityItems = useMemo(() => {
    if (!inventory) return [];

    return inventory
      .filter((item) => {
        return (
          !item.draft &&
          !item.requiresAuth &&
          !item.excludeFromIndexMonitoring &&
          (item.type !== "blog" || item.hasLocalePair !== false)
        );
      })
      .map((item) => ({
        ...item,
        status: statusMap.get(item.id)?.status ?? "unknown",
      }))
      .filter((item) => item.status !== "indexed" && item.status !== "excluded")
      .sort((a, b) => {
        const priorityScore = (status: string) => {
          if (status === "not_submitted" || status === "unknown") return 0;
          if (status === "submitted") return 1;
          return 2;
        };

        const scoreDiff = priorityScore(a.status) - priorityScore(b.status);
        if (scoreDiff !== 0) return scoreDiff;

        if (a.type !== b.type) {
          const typeOrder = { blog: 0, note: 1, tool: 2 };
          return typeOrder[a.type] - typeOrder[b.type];
        }

        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 6);
  }, [inventory, statusMap]);

  const refreshPriorityUrls = async () => {
    const targets = priorityItems.slice(0, 6);

    if (targets.length === 0) {
      toast({
        title: "Tidak ada URL prioritas",
        description:
          "Semua URL prioritas saat ini sudah aman atau tidak perlu dicek.",
      });
      return;
    }

    setPriorityRefresh({ running: true, done: 0, total: targets.length });

    let success = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      const item = targets[index];
      try {
        const res = await refreshFromGsc({
          id: item.id,
          url: item.url,
          type: item.type,
          locale: item.locale,
          title: item.title,
        });

        setStatuses((prev) => {
          const next = [...(prev ?? [])];
          const existingIndex = next.findIndex((entry) => entry.id === item.id);
          if (existingIndex >= 0) next[existingIndex] = res.data;
          else next.push(res.data);
          return next;
        });

        success += 1;
      } catch {
        failed += 1;
      } finally {
        setPriorityRefresh((prev) => ({ ...prev, done: index + 1 }));
      }
    }

    setPriorityRefresh({ running: false, done: 0, total: 0 });

    toast({
      title: "Refresh priority selesai",
      description: `${success} berhasil${failed ? ` · ${failed} gagal` : ""}`,
      variant: failed ? "destructive" : undefined,
    });
  };

  const copyAndOpenGsc = useCallback(
    async (pageUrl: string) => {
      const copyWithExecCommand = (value: string) => {
        if (typeof document === "undefined") return false;

        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        let ok = false;
        try {
          ok = document.execCommand("copy");
        } catch {
          ok = false;
        }

        document.body.removeChild(textarea);
        return ok;
      };

      const copyWithClipboardApi = async (value: string) => {
        try {
          await navigator.clipboard.writeText(value);
          return true;
        } catch {
          return false;
        }
      };

      const gscUrl = gscPropertyUrl();

      let copied = copyWithExecCommand(pageUrl);

      if (!copied) {
        copied = await copyWithClipboardApi(pageUrl);
      }

      let gscWindow: Window | null = null;

      try {
        if (gscWindowRef && !gscWindowRef.closed) {
          gscWindowRef.location.href = gscUrl;
          gscWindow = gscWindowRef;
        }
      } catch {
        gscWindowRef = null;
      }

      if (!gscWindow) {
        gscWindow = window.open(gscUrl, GSC_TAB_NAME);
        gscWindowRef = gscWindow;
      }

      gscWindow?.focus();

      if (copied) {
        toast({
          title: "GSC dibuka · URL disalin",
          description: "Paste URL di kolom pencarian URL Inspection GSC.",
        });
        return;
      }

      const manualValue = window.prompt(
        "Browser memblokir clipboard otomatis. Copy URL ini lalu paste ke GSC:",
        pageUrl,
      );

      if (manualValue !== null) {
        toast({
          title: "GSC dibuka · Copy manual",
          description: "URL siap di-copy dari prompt browser.",
        });
        return;
      }

      toast({
        title: "GSC dibuka",
        description:
          "Clipboard diblokir browser. Copy URL secara manual dari baris ini.",
      });
    },
    [toast],
  );

  const copyUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "URL copied", description: url });
      } catch {
        toast({ title: "Copy gagal", variant: "destructive" });
      }
    },
    [toast],
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Loading inventory
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12">
        <div className="border-2 border-destructive/40 bg-destructive/5 p-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-destructive">
            — Error
          </p>
          <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tighter text-destructive">
            Gagal memuat data
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background xl:h-screen xl:max-h-screen xl:overflow-hidden">
      <header className="shrink-0 border-b border-border/70 bg-background/95 px-4 py-2 backdrop-blur md:px-5">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              — SnipGeek Control · Issue #{new Date().getFullYear()}·W
              {String(getIsoWeek(new Date()).week).padStart(2, "0")}
            </p>
            <div>
              <h1 className="font-display text-[26px] font-black uppercase tracking-[-0.05em] md:text-[30px]">
                Index <span className="text-accent">Monitor.</span>
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Satu layar untuk kondisi index, antrean prioritas, dan jalur
                tindakan cepat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 font-mono text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </div>
            <div className="rounded-full border border-border/70 bg-card/40 px-3 py-1 font-mono text-muted-foreground">
              Snapshot ·{" "}
              {new Date().toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-3 md:px-5 xl:min-h-0 xl:overflow-hidden">
        <div className="flex h-full min-h-0 flex-col gap-3">
          <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-12">
            <div className="rounded-2xl border border-border/70 bg-card/40 p-4 xl:col-span-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                    — Needs action today
                  </p>
                  <div className="mt-2">
                    <HeroNumber value={actionableSummary.needsAction} />
                  </div>
                </div>
                <div className="rounded-full border border-border/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {actionableSummary.indexableTotal} public URLs
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {actionableSummary.needsAction > 0 ? (
                  <>
                    <span className="font-bold text-foreground">
                      {kpis.notSubmitted}
                    </span>{" "}
                    belum submit ·{" "}
                    <span className="font-bold text-foreground">
                      {actionableSummary.submitted}
                    </span>{" "}
                    menunggu verifikasi.
                  </>
                ) : (
                  <>
                    Semua URL publik aman.{" "}
                    <span className="font-bold text-foreground">
                      {actionableSummary.indexed}
                    </span>{" "}
                    sudah indexed.
                  </>
                )}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Backlog
                  </p>
                  <p className="mt-1 font-display text-2xl font-black tracking-tighter text-destructive">
                    {actionableSummary.needsAction}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Awaiting
                  </p>
                  <p className="mt-1 font-display text-2xl font-black tracking-tighter text-amber-600 dark:text-amber-400">
                    {actionableSummary.submitted}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Indexed
                  </p>
                  <p className="mt-1 font-display text-2xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                    {actionableSummary.indexed}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:col-span-5 xl:grid-cols-4">
              <Link href={buildMonitorHref({ status: "not_submitted" })}>
                <StatBlock
                  label="Belum submit"
                  value={kpis.notSubmitted}
                  sub="Tindakan utama"
                  accent="destructive"
                />
              </Link>
              <Link href={buildMonitorHref({ status: "submitted" })}>
                <StatBlock
                  label="Submitted"
                  value={kpis.submitted}
                  sub="Menunggu verifikasi"
                  accent="amber"
                />
              </Link>
              <Link href={buildMonitorHref({ status: "indexed" })}>
                <StatBlock
                  label="Indexed"
                  value={actionableSummary.indexed}
                  sub={`${kpis.indexedPct}% coverage`}
                  accent="emerald"
                />
              </Link>
              <Link href={buildMonitorHref({ visibility: "hidden" })}>
                <StatBlock
                  label="Hidden"
                  value={actionableSummary.gatedOrDraft}
                  sub="Draft / gated"
                  accent="primary"
                />
              </Link>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/40 p-4 xl:col-span-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    Next action
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {actionableSummary.needsAction > 0
                      ? `${actionableSummary.needsAction} URL publik masih perlu submit atau review. Fokuskan refresh ke antrean prioritas dulu.`
                      : "Semua URL publik sudah aman. Panel ini sekarang bisa dipakai untuk jaga ritme publish mingguan."}
                  </p>
                </div>
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    actionableSummary.needsAction > 0
                      ? "text-destructive"
                      : "text-emerald-500",
                  )}
                />
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <Link
                  href={buildMonitorHref({ type: "blog" })}
                  className="rounded-xl border border-border/70 bg-background/30 px-2.5 py-2 transition-colors hover:border-accent/50"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]">
                      Blog
                    </span>
                    <FileText className="h-3 w-3" />
                  </div>
                  <p className="mt-1.5 font-display text-2xl font-black tracking-tighter text-foreground">
                    {kpis.blog}
                  </p>
                </Link>
                <Link
                  href={buildMonitorHref({ type: "note" })}
                  className="rounded-xl border border-border/70 bg-background/30 px-2.5 py-2 transition-colors hover:border-accent/50"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]">
                      Notes
                    </span>
                    <StickyNote className="h-3 w-3" />
                  </div>
                  <p className="mt-1.5 font-display text-2xl font-black tracking-tighter text-foreground">
                    {kpis.note}
                  </p>
                </Link>
                <Link
                  href={buildMonitorHref({ type: "tool" })}
                  className="rounded-xl border border-border/70 bg-background/30 px-2.5 py-2 transition-colors hover:border-accent/50"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]">
                      Tools
                    </span>
                    <Wrench className="h-3 w-3" />
                  </div>
                  <p className="mt-1.5 font-display text-2xl font-black tracking-tighter text-foreground">
                    {kpis.tool}
                  </p>
                </Link>
                <Link
                  href={buildMonitorHref({ status: "not_submitted" })}
                  className="rounded-xl border border-border/70 bg-background/30 px-2.5 py-2 transition-colors hover:border-accent/50"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]">
                      Week
                    </span>
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                  <p className="mt-1.5 font-display text-2xl font-black tracking-tighter text-foreground">
                    {weekStats.current}/{WEEKLY_TARGET}
                  </p>
                </Link>
              </div>
            </div>
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
            <div className="flex min-h-0 flex-col xl:col-span-7 xl:overflow-hidden">
              <SectionHeader
                kicker="Queue"
                title="Priority URLs"
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                      onClick={refreshPriorityUrls}
                      disabled={
                        priorityRefresh.running || priorityItems.length === 0
                      }
                    >
                      {priorityRefresh.running ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      {priorityRefresh.running
                        ? `Refreshing ${priorityRefresh.done}/${priorityRefresh.total}`
                        : `Refresh Priority (${priorityItems.length})`}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                    >
                      <Link
                        href={buildMonitorHref({ status: "not_submitted" })}
                      >
                        Open Monitor
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      <Link href={buildMonitorHref({ status: "submitted" })}>
                        Awaiting
                      </Link>
                    </Button>
                  </div>
                }
              />

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 p-3">
                <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <Link
                    href={buildMonitorHref({
                      status: "not_submitted",
                      gsc: "needs_review",
                    })}
                  >
                    <StatBlock
                      label="Need action"
                      value={actionableSummary.needsAction}
                      sub="Fokus utama hari ini"
                      accent={
                        actionableSummary.needsAction > 0
                          ? "destructive"
                          : "emerald"
                      }
                    />
                  </Link>
                  <Link href={buildMonitorHref({ status: "submitted" })}>
                    <StatBlock
                      label="Awaiting"
                      value={actionableSummary.submitted}
                      sub="Tunggu verifikasi Google"
                      accent="amber"
                    />
                  </Link>
                  <Link
                    href={buildMonitorHref({
                      status: "indexed",
                      gsc: "indexed_google",
                    })}
                  >
                    <StatBlock
                      label="Ready"
                      value={actionableSummary.indexed}
                      sub="Sudah aman"
                      accent="emerald"
                    />
                  </Link>
                  <Link href={buildMonitorHref({ visibility: "hidden" })}>
                    <StatBlock
                      label="Skipped"
                      value={actionableSummary.gatedOrDraft}
                      sub="Tidak dikejar"
                      accent="primary"
                    />
                  </Link>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-dashed pb-3">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive"
                  >
                    <Link href={buildMonitorHref({ gsc: "needs_review" })}>
                      Needs review
                      <span className="ml-1 opacity-60 font-normal normal-case tracking-normal">
                        (verdict fail)
                      </span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-400"
                  >
                    <Link href={buildMonitorHref({ gsc: "unknown_google" })}>
                      Unknown to Google
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400"
                  >
                    <Link href={buildMonitorHref({ gsc: "indexed_google" })}>
                      Indexed
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
                  {priorityItems.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-background/30 px-4 py-5 text-sm text-muted-foreground">
                      Tidak ada URL prioritas saat ini. Semua item publik sudah
                      aman atau sudah indexed.
                    </div>
                  ) : (
                    priorityItems.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className="flex animate-[fadeSlideIn_0.25s_ease_both] flex-col gap-3 rounded-2xl border border-border/60 bg-background/30 px-4 py-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/70 font-display text-lg font-black tracking-tighter text-foreground">
                          {idx + 1}
                        </div>

                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-border/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {typeLabel(item.type)}
                            </span>
                            <span className="rounded-full border border-border/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {item.locale.toUpperCase()}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest",
                                statusTone(item.status),
                              )}
                            >
                              {statusLabel(item.status)}
                            </span>
                          </div>
                          <div>
                            <p className="truncate text-sm font-semibold text-foreground md:text-base">
                              {item.title}
                            </p>
                            <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                              {item.path}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start md:justify-end">
                          <Button
                            size="sm"
                            className="gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                            title="Copy URL + buka GSC Inspect URL"
                            onClick={() => copyAndOpenGsc(item.url)}
                          >
                            Open GSC
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Link
                              href={buildMonitorHref({
                                type: item.type,
                                status: item.status,
                                locale: item.locale,
                                q: item.slug,
                              })}
                            >
                              Review
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Copy URL ke clipboard"
                            onClick={() => copyUrl(item.url)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                          >
                            <Link href={item.url} target="_blank">
                              Open URL
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid min-h-0 gap-3 xl:col-span-5 xl:grid-rows-2 xl:overflow-hidden">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-4">
                <SectionHeader
                  kicker="Cadence"
                  title="Weekly Target"
                  action={
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>
                        {weekStats.current}/{WEEKLY_TARGET}
                      </span>
                      {trendIconPlaceholder(weekTrend, weekStats.urgency)}
                    </div>
                  }
                />

                <p className="mb-3 text-sm text-muted-foreground">
                  {weekStats.current >= WEEKLY_TARGET
                    ? "Cadence aman minggu ini."
                    : `${Math.max(WEEKLY_TARGET - weekStats.current, 0)} publish lagi untuk capai target.`}
                </p>

                <WeeklyTargetChart
                  publishDates={articleDates}
                  heightClassName="h-28"
                />

                <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-dashed pt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-emerald-600" />
                    Target {WEEKLY_TARGET}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-red-500" />
                    Under target
                  </span>
                </div>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-4">
                <SectionHeader
                  kicker="Rhythm"
                  title="Posting Heatmap"
                  action={
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Flame className="h-3 w-3 text-accent" />
                      {articleDates.length} publish
                    </div>
                  }
                />

                <p className="mb-3 text-sm text-muted-foreground">
                  Gunakan heatmap untuk cek ritme, bukan sebagai fokus utama
                  tindakan.
                </p>

                <div className="overflow-x-auto">
                  <PostingHeatmap publishDates={articleDates} />
                </div>

                <div className="mt-2 flex items-center gap-3 border-t border-dashed pt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Less</span>
                  <span className="flex gap-1">
                    <span className="h-3 w-3 rounded-sm bg-muted" />
                    <span className="h-3 w-3 rounded-sm bg-emerald-300" />
                    <span className="h-3 w-3 rounded-sm bg-emerald-400" />
                    <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                    <span className="h-3 w-3 rounded-sm bg-emerald-600" />
                  </span>
                  <span>More</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    <Link href={buildMonitorHref({ type: "blog" })}>Blog</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    <Link href={buildMonitorHref({ type: "note" })}>Notes</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    <Link href={buildMonitorHref({ type: "tool" })}>Tools</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function trendIconPlaceholder(
  trend: "up" | "down" | "flat",
  urgency: "ok" | "watch" | "late",
) {
  if (trend === "up") {
    return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  }

  if (trend === "down") {
    return (
      <TrendingDown
        className={cn(
          "h-3 w-3",
          urgency === "late" ? "text-destructive" : "text-amber-500",
        )}
      />
    );
  }

  return <Minus className="h-3 w-3 text-muted-foreground" />;
}
