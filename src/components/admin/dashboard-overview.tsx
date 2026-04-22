"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Flame,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { StageFunnel, type StageCount } from "@/components/admin/shared/stage-funnel";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { SectionHeader } from "@/components/admin/shared/section-header";
import { useToast } from "@/hooks/use-toast";
import { getIsoWeek } from "@/lib/iso-week";
import { cn } from "@/lib/utils";
import type { IndexStatusValue } from "@/app/api/admin/index-status/route";

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

function typeLabel(type: InventoryItem["type"]) {
  if (type === "blog") return "Blog";
  if (type === "note") return "Note";
  return "Tool";
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

  /* -----------------------------------------------------------------
   * Funnel spine — 5 stages that map to monitor filters.
   * ----------------------------------------------------------------- */
  const funnelStages: StageCount[] = [
    {
      key: "total",
      count: kpis.total,
      href: buildMonitorHref({}),
    },
    {
      key: "public",
      count: actionableSummary.indexableTotal,
      href: buildMonitorHref({ visibility: "public" }),
    },
    {
      key: "submit",
      count: actionableSummary.submitted,
      href: buildMonitorHref({ status: "submitted" }),
    },
    {
      key: "index",
      count: actionableSummary.indexed,
      href: buildMonitorHref({ status: "indexed" }),
    },
    {
      key: "needs",
      count: actionableSummary.needsAction,
      href: buildMonitorHref({ status: "not_submitted" }),
    },
  ];

  const weekProgressHint =
    weekStats.current >= WEEKLY_TARGET
      ? "On track"
      : `${Math.max(WEEKLY_TARGET - weekStats.current, 0)} more needed`;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header: editorial title + live dot ─── */}
      <header className="border-b border-border/70 bg-background/95 px-4 py-5 backdrop-blur md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              — SnipGeek Control · W
              {String(getIsoWeek(new Date()).week).padStart(2, "0")}
            </p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-[-0.03em]">
              Dashboard
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Pipeline status, cadence, dan priority queue untuk minggu ini.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Live
            </span>
          </div>
        </div>
      </header>

      {/* ── Funnel: the workflow spine ─── */}
      <section className="border-b border-border/70 bg-background px-4 py-4 md:px-6">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          — Pipeline
        </p>
        <StageFunnel stages={funnelStages} variant="full" />
      </section>

      {/* ── Body: queue (left) + cadence (right) ─── */}
      <div className="flex flex-col gap-5 px-4 py-5 md:px-6 xl:flex-row">
        {/* ── Priority queue ─── */}
        <section className="min-w-0 flex-1">
          <SectionHeader
            eyebrow="Queue"
            title="Priority URLs"
            count={priorityItems.length}
            subtitle="URL publik yang belum indexed atau belum disubmit — urutan otomatis."
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                  onClick={refreshPriorityUrls}
                  disabled={
                    priorityRefresh.running || priorityItems.length === 0
                  }
                >
                  {priorityRefresh.running ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {priorityRefresh.running
                    ? `${priorityRefresh.done}/${priorityRefresh.total}`
                    : "Refresh top 6"}
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-8 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                >
                  <Link href={buildMonitorHref({ status: "not_submitted" })}>
                    Full monitor
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </>
            }
          />

          <div className="mt-4">
            {priorityItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                  <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Antrean kosong
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Semua URL publik sudah aman atau indexed.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {priorityItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${idx * 35}ms` }}
                    className="flex animate-[fadeSlideIn_0.25s_ease_both] items-start gap-3 rounded-2xl border border-border/70 bg-card/30 px-3.5 py-3 transition-colors hover:border-border"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 font-display text-sm font-black text-muted-foreground">
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          value={item.status as IndexStatusValue}
                        />
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {typeLabel(item.type)} · {item.locale.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold leading-snug text-foreground">
                        {item.title}
                      </p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {item.path}
                      </p>
                    </div>

                    {/* Actions: always right-aligned, never wrap below content */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        className="h-8 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                        onClick={() => copyAndOpenGsc(item.url)}
                      >
                        <span className="hidden sm:inline">Open GSC</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link
                              href={buildMonitorHref({
                                type: item.type,
                                status: item.status,
                                locale: item.locale,
                                q: item.slug,
                              })}
                              className="flex items-center gap-2"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              Review in monitor
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyUrl(item.url)}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open public URL
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Cadence panels ─── */}
        <aside className="flex flex-col gap-4 xl:w-96 xl:shrink-0">
          {/* Weekly target */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-4">
            <SectionHeader
              eyebrow="Cadence"
              title="Weekly target"
              actions={
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="tabular-nums">
                    {weekStats.current}/{WEEKLY_TARGET}
                  </span>
                  {trendIconPlaceholder(weekTrend, weekStats.urgency)}
                </div>
              }
            />
            <div className="mt-3">
              <WeeklyTargetChart
                publishDates={articleDates}
                heightClassName="h-44"
              />
            </div>
            <p className="mt-2 border-t border-dashed pt-2 text-[11px] text-muted-foreground">
              {weekProgressHint} · minggu lalu {weekStats.previous} artikel.
            </p>
          </div>

          {/* Posting heatmap */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-4">
            <SectionHeader
              eyebrow="Rhythm"
              title="Posting heatmap"
              actions={
                <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Flame className="h-3 w-3 text-accent" />
                  <span className="tabular-nums">{articleDates.length}</span>
                </div>
              }
            />
            <div className="mt-3 overflow-x-auto">
              <PostingHeatmap publishDates={articleDates} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-dashed pt-2 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="flex gap-0.5">
                  <span className="h-2 w-2 rounded-sm bg-muted" />
                  <span className="h-2 w-2 rounded-sm bg-emerald-300" />
                  <span className="h-2 w-2 rounded-sm bg-emerald-400" />
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                  <span className="h-2 w-2 rounded-sm bg-emerald-600" />
                </span>
                <span>More</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Filter
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href={buildMonitorHref({ type: "blog" })}>
                      Blog only
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={buildMonitorHref({ type: "note" })}>
                      Notes only
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={buildMonitorHref({ type: "tool" })}>
                      Tools only
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
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
