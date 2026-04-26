"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Loader2,
  ExternalLink,
  Search,
  FileText,
  StickyNote,
  Wrench,
  RefreshCw,
  CheckCircle2,
  Save,
  Filter,
  Copy,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronDown,
  Send,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  fetchContentInventory,
  fetchIndexStatuses,
  updateIndexStatus,
  refreshFromGsc,
  submitToIndexNow,
  type InventoryItem,
  type IndexStatusValue,
} from "@/components/admin/admin-api-client";
import {
  STATUS_META,
  STATUS_ORDER,
  getStatusMeta,
} from "@/components/admin/shared/status-tones";
import { StageFunnel, type StageCount } from "@/components/admin/shared/stage-funnel";
import { cn } from "@/lib/utils";

/**
 * Status options derived from the shared tone registry. The select trigger
 * classes differ slightly from the row pill (no left border accent), so we
 * build a thin adapter on top of STATUS_META instead of duplicating the table.
 */
const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: STATUS_META[value].label,
  pill: STATUS_META[value].pill,
  dot: STATUS_META[value].dot,
}));

function statusOpt(v: IndexStatusValue) {
  const meta = getStatusMeta(v);
  return { value: meta.value, label: meta.label, pill: meta.pill, dot: meta.dot };
}

function typeIcon(type: InventoryItem["type"]) {
  if (type === "blog") return <FileText className="h-3.5 w-3.5" />;
  if (type === "note") return <StickyNote className="h-3.5 w-3.5" />;
  return <Wrench className="h-3.5 w-3.5" />;
}

/* ------------------------------------------------------------------
 * Stage tabs — the primary filter UI, maps to existing status filter.
 * ------------------------------------------------------------------ */

type StageTab = "all" | "needs" | "submit" | "index" | "excluded";

const STAGE_TAB_ORDER: StageTab[] = [
  "all",
  "needs",
  "submit",
  "index",
  "excluded",
];

const STAGE_TAB_LABEL: Record<StageTab, { full: string; short: string }> = {
  all: { full: "All", short: "All" },
  needs: { full: "Needs action", short: "Needs" },
  submit: { full: "Submitted", short: "Submit" },
  index: { full: "Indexed", short: "Indexed" },
  excluded: { full: "Excluded", short: "Excl." },
};

function matchesStageTab(tab: StageTab, status: IndexStatusValue): boolean {
  switch (tab) {
    case "all":
      return true;
    case "needs":
      return status === "not_submitted" || status === "unknown";
    case "submit":
      return status === "submitted";
    case "index":
      return status === "indexed";
    case "excluded":
      return status === "excluded";
  }
}

/** Maps a legacy `?status=...` URL param → new stage tab. */
function stageTabFromStatusParam(value: string | null): StageTab | null {
  if (!value) return null;
  if (value === "not_submitted" || value === "unknown") return "needs";
  if (value === "submitted") return "submit";
  if (value === "indexed") return "index";
  if (value === "excluded") return "excluded";
  if (STAGE_TAB_ORDER.includes(value as StageTab)) return value as StageTab;
  return null;
}

 function stageTabToStatusParam(value: StageTab): string | null {
  if (value === "needs") return "not_submitted";
  if (value === "submit") return "submitted";
  if (value === "index") return "indexed";
  if (value === "excluded") return "excluded";
  return null;
 }

const GSC_PROPERTY_ID = "sc-domain:snipgeek.com";
const GSC_PROPERTY_BASE = "https://search.google.com/u/0/search-console";
const GSC_WINDOW_NAME = "snipgeek-gsc-console";

let gscWindowRef: Window | null = null;

/** Minimum gap (ms) before allowing a re-refresh — 24 hours */
const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Returns true if the last checked timestamp is within REFRESH_COOLDOWN_MS */
function isFreshlyChecked(lastCheckedAt?: string): boolean {
  if (!lastCheckedAt) return false;
  const t = new Date(lastCheckedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < REFRESH_COOLDOWN_MS;
}

/** Returns a short human-relative label like "2 h ago" */
function relativeTimeLabel(value?: string): string {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return "?";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME =
  "bg-background text-foreground hover:border-foreground/30 focus:border-accent";
const ADMIN_SELECT_CONTENT_CLASSNAME =
  "border-border bg-popover text-popover-foreground ";
const ADMIN_SELECT_ITEM_CLASSNAME =
  "text-popover-foreground data-[state=checked]:bg-accent/10 data-[state=checked]:text-foreground data-[highlighted]:bg-accent/18 data-[highlighted]:text-foreground dark:data-[state=checked]:bg-accent/16 dark:data-[highlighted]:bg-accent/24";

function formatLastCheckedAt(value?: string) {
  if (!value) return "Never checked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Check time unknown";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function parseGscSummary(raw?: string) {
  if (!raw) return {} as Record<string, string>;

  return raw
    .split("|")
    .map((part) => part.trim())
    .reduce<Record<string, string>>((acc, part) => {
      const index = part.indexOf("=");
      if (index === -1) return acc;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      if (key && value) acc[key] = value;
      return acc;
    }, {});
}

function humanizeGscEnum(value?: string) {
  if (!value) return null;

  const explicitMap: Record<string, string> = {
    PASS: "Pass",
    FAIL: "Fail",
    NEUTRAL: "Neutral",
    INDEXING_ALLOWED: "Allowed",
    SUCCESSFUL: "Successful",
    ALLOWED: "Allowed",
    INDEXING_STATE_UNSPECIFIED: "Not specified",
    PAGE_FETCH_STATE_UNSPECIFIED: "Not specified",
    ROBOTS_TXT_STATE_UNSPECIFIED: "Not specified",
  };

  if (explicitMap[value]) return explicitMap[value];

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function summarizeForHumans(raw?: string) {
  const data = parseGscSummary(raw);
  if (!Object.keys(data).length) return null;

  const coverage = data.coverage;
  const verdict = humanizeGscEnum(data.verdict);
  const fetchState = humanizeGscEnum(data.fetch);
  const indexingState = humanizeGscEnum(data.indexing);
  const robotsState = humanizeGscEnum(data.robots);

  let headline = "Inspection data available";
  let tone = "border-foreground/20 bg-background text-foreground";

  const coverageLower = coverage?.toLowerCase() ?? "";
  if (coverageLower.includes("indexed")) {
    headline = "Indexed in Google";
    tone =
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  } else if (coverageLower.includes("unknown to google")) {
    headline = "Not known by Google yet";
    tone =
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  } else if (coverageLower.includes("excluded")) {
    headline = "Excluded from Google index";
    tone = "border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
  } else if (verdict === "Fail") {
    headline = "Needs manual review";
    tone = "border-destructive/40 bg-destructive/10 text-destructive";
  } else if (verdict === "Pass") {
    headline = "Google can inspect this URL";
    tone = "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }

  const details = [
    coverage ? `Coverage: ${coverage}` : null,
    verdict ? `Verdict: ${verdict}` : null,
    indexingState && indexingState !== "Not specified"
      ? `Indexing: ${indexingState}`
      : null,
    fetchState && fetchState !== "Not specified"
      ? `Fetch: ${fetchState}`
      : null,
    robotsState && robotsState !== "Not specified"
      ? `Robots: ${robotsState}`
      : null,
    data.crawl ? `Last crawl: ${formatLastCheckedAt(data.crawl)}` : null,
  ].filter(Boolean) as string[];

  return {
    headline,
    tone,
    details,
  };
}

type GscQuickFilter =
  | "all"
  | "needs_review"
  | "unknown_google"
  | "indexed_google";

function matchesGscQuickFilter(filter: GscQuickFilter, row?: RowState) {
  if (filter === "all") return true;

  const summary = summarizeForHumans(row?.lastGSCResult);
  const headline = summary?.headline;

  if (filter === "needs_review") {
    return headline === "Needs manual review" || row?.status === "excluded";
  }

  if (filter === "unknown_google") {
    return headline === "Not known by Google yet";
  }

  if (filter === "indexed_google") {
    return headline === "Indexed in Google" || row?.status === "indexed";
  }

  return true;
}

type RowState = {
  status: IndexStatusValue;
  notes: string;
  dirty: boolean;
  saving?: boolean;
  refreshing?: boolean;
  pushing?: boolean;
  lastCheckedAt?: string;
  lastGSCResult?: string;
};

function isMonitoringOptOut(item: InventoryItem) {
  return item.excludeFromIndexMonitoring === true;
}

type BatchRefreshState = {
  running: boolean;
  label: string;
  done: number;
  total: number;
};

type RefreshGscOptions = {
  silent?: boolean;
  force?: boolean;
};

function WorkspaceSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
      {children}
    </span>
  );
}

export function ContentTable() {
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gscQuickFilter, setGscQuickFilter] = useState<GscQuickFilter>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [stageTab, setStageTab] = useState<StageTab>("all");
  const [filterLocale, setFilterLocale] = useState<string>("all");
  // visibility: "all" = show everything, "public" = only indexable, "hidden" = only draft/gated/unpaired
  const [filterVisibility, setFilterVisibility] = useState<
    "all" | "public" | "hidden"
  >("all");
  const [search, setSearch] = useState("");
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [batchSize, setBatchSize] = useState<string>("10");
  const [batchRefresh, setBatchRefresh] = useState<BatchRefreshState>({
    running: false,
    label: "",
    done: 0,
    total: 0,
  });
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        const initial: Record<string, RowState> = {};
        const stMap = new Map(st.items.map((s) => [s.id, s]));
        for (const item of inv.items) {
          const s = stMap.get(item.id);
          initial[item.id] = {
            status: (s?.status as IndexStatusValue) ?? "unknown",
            notes: s?.notes ?? "",
            dirty: false,
            lastCheckedAt: s?.lastCheckedAt,
            lastGSCResult: s?.lastGSCResult,
          };
        }
        setRowState(initial);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const t = sp.get("type");
    setFilterType(t && ["blog", "note", "tool"].includes(t) ? t : "all");

    const mappedTab = stageTabFromStatusParam(sp.get("status"));
    setStageTab(mappedTab ?? "all");

    const gsc = sp.get("gsc");
    setGscQuickFilter(
      gsc && ["needs_review", "unknown_google", "indexed_google"].includes(gsc)
        ? (gsc as GscQuickFilter)
        : "all",
    );

    const locale = sp.get("locale");
    setFilterLocale(locale && ["en", "id"].includes(locale) ? locale : "all");

    const visibility = sp.get("visibility");
    setFilterVisibility(
      visibility && ["all", "public", "hidden"].includes(visibility)
        ? (visibility as "all" | "public" | "hidden")
        : "all",
    );

    const q = sp.get("q");
    setSearch(q ?? "");
  }, [searchParams]);

  const buildMonitorSearchParams = useCallback(
    (next: { status?: string | null; visibility?: "all" | "public" | "hidden" | null }) => {
      const sp = new URLSearchParams(searchParams.toString());

      if (filterType === "all") sp.delete("type");
      else sp.set("type", filterType);

      if (filterLocale === "all") sp.delete("locale");
      else sp.set("locale", filterLocale);

      if (gscQuickFilter === "all") sp.delete("gsc");
      else sp.set("gsc", gscQuickFilter);

      if (search.trim()) sp.set("q", search.trim());
      else sp.delete("q");

      if (next.status === null || next.status === undefined) sp.delete("status");
      else sp.set("status", next.status);

      if (
        next.visibility === null ||
        next.visibility === undefined ||
        next.visibility === "all"
      ) {
        sp.delete("visibility");
      } else {
        sp.set("visibility", next.visibility);
      }

      return sp;
    },
    [filterLocale, filterType, gscQuickFilter, search, searchParams],
  );

  const buildMonitorHref = useCallback(
    (next: { status?: string | null; visibility?: "all" | "public" | "hidden" | null }) => {
      const query = buildMonitorSearchParams(next).toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [buildMonitorSearchParams, pathname],
  );

  const syncMonitorUrl = useCallback(
    (next: { status?: string | null; visibility?: "all" | "public" | "hidden" | null }) => {
      const query = buildMonitorSearchParams(next).toString();

      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [buildMonitorSearchParams, pathname, router],
  );

  const handleStageTabChange = useCallback(
    (nextTab: StageTab) => {
      setStageTab(nextTab);
      syncMonitorUrl({
        status: stageTabToStatusParam(nextTab),
        visibility: filterVisibility,
      });
    },
    [filterVisibility, syncMonitorUrl],
  );

  const handleVisibilityChange = useCallback(
    (nextVisibility: "all" | "public" | "hidden") => {
      setFilterVisibility(nextVisibility);
      syncMonitorUrl({
        status: stageTabToStatusParam(stageTab),
        visibility: nextVisibility,
      });
    },
    [stageTab, syncMonitorUrl],
  );

  const handleFunnelStageSelect = useCallback(
    (key: StageCount["key"]) => {
      if (key === "total") {
        setStageTab("all");
        setFilterVisibility("all");
        syncMonitorUrl({ status: null, visibility: "all" });
        return;
      }

      if (key === "public") {
        setStageTab("all");
        setFilterVisibility("public");
        syncMonitorUrl({ status: null, visibility: "public" });
        return;
      }

      const nextTab = key === "submit" ? "submit" : key === "index" ? "index" : "needs";
      setStageTab(nextTab);
      setFilterVisibility("public");
      syncMonitorUrl({
        status: stageTabToStatusParam(nextTab),
        visibility: "public",
      });
    },
    [syncMonitorUrl],
  );

  const filtered = useMemo(() => {
    if (!inventory) return [];
    const q = search.trim().toLowerCase();
    return inventory.filter((item) => {
      if (isMonitoringOptOut(item)) return false;

      // visibility filter: mirrors dashboard's isNonIndexable logic exactly
      const isHidden = Boolean(
        item.draft ||
        item.requiresAuth ||
        (item.type === "blog" && item.hasLocalePair === false),
      );
      if (filterVisibility === "hidden" && !isHidden) return false;
      if (filterVisibility === "public" && isHidden) return false;

      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterLocale !== "all" && item.locale !== filterLocale) return false;
      const row = rowState[item.id];
      const s = row?.status ?? "unknown";
      if (!matchesStageTab(stageTab, s)) return false;
      if (!matchesGscQuickFilter(gscQuickFilter, row)) return false;
      if (q) {
        const hay = `${item.title} ${item.path} ${item.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    inventory,
    filterType,
    filterLocale,
    stageTab,
    filterVisibility,
    gscQuickFilter,
    search,
    rowState,
  ]);

  /**
   * Count per stage tab, ignoring `stageTab` itself so each badge reflects
   * the full-inventory count for that stage (otherwise switching tabs would
   * change the badges). We still honour the other filters so the count
   * reflects what the user would actually see if they selected that tab.
   */
  const tabCounts = useMemo(() => {
    const empty: Record<StageTab, number> = {
      all: 0,
      needs: 0,
      submit: 0,
      index: 0,
      excluded: 0,
    };
    if (!inventory) return empty;
    const q = search.trim().toLowerCase();
    for (const item of inventory) {
      if (isMonitoringOptOut(item)) continue;
      const isHidden = Boolean(
        item.draft ||
        item.requiresAuth ||
        (item.type === "blog" && item.hasLocalePair === false),
      );
      if (filterVisibility === "hidden" && !isHidden) continue;
      if (filterVisibility === "public" && isHidden) continue;
      if (filterType !== "all" && item.type !== filterType) continue;
      if (filterLocale !== "all" && item.locale !== filterLocale) continue;
      const row = rowState[item.id];
      if (!matchesGscQuickFilter(gscQuickFilter, row)) continue;
      if (q) {
        const hay = `${item.title} ${item.path} ${item.slug}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const status = (row?.status ?? "unknown") as IndexStatusValue;
      empty.all++;
      if (status === "not_submitted" || status === "unknown") empty.needs++;
      else if (status === "submitted") empty.submit++;
      else if (status === "indexed") empty.index++;
      else if (status === "excluded") empty.excluded++;
    }
    return empty;
  }, [
    inventory,
    filterType,
    filterLocale,
    filterVisibility,
    gscQuickFilter,
    search,
    rowState,
  ]);

  const priorityCandidates = useMemo(() => {
    return (
      filtered
        .filter((item) => !item.draft && !item.requiresAuth)
        .filter((item) => item.type !== "blog" || item.hasLocalePair !== false)
        .filter((item) => {
          const status = rowState[item.id]?.status ?? "unknown";
          return (
            status === "unknown" ||
            status === "not_submitted" ||
            status === "submitted"
          );
        })
        // Priority batch skips items that were refreshed within 24 hours
        .filter((item) => !isFreshlyChecked(rowState[item.id]?.lastCheckedAt))
        .sort((a, b) => {
          const score = (item: InventoryItem) => {
            const status = rowState[item.id]?.status ?? "unknown";
            if (status === "unknown" || status === "not_submitted") return 0;
            if (status === "submitted") return 1;
            return 2;
          };

          const statusDiff = score(a) - score(b);
          if (statusDiff !== 0) return statusDiff;

          const aDate = a.date ? new Date(a.date).getTime() : 0;
          const bDate = b.date ? new Date(b.date).getTime() : 0;
          return bDate - aDate;
        })
    );
  }, [filtered, rowState]);

  const monitorInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) => !isMonitoringOptOut(item));
  }, [inventory]);

  const publicCount = useMemo(() => {
    return monitorInventory.filter(
      (item) =>
        !item.draft &&
        !item.requiresAuth &&
        (item.type !== "blog" || item.hasLocalePair !== false),
    ).length;
  }, [monitorInventory]);

  const hiddenCount = useMemo(() => {
    return monitorInventory.filter(
      (item) =>
        item.draft ||
        item.requiresAuth ||
        (item.type === "blog" && item.hasLocalePair === false),
    ).length;
  }, [monitorInventory]);

  const actionableCount = useMemo(() => {
    return monitorInventory.filter((item) => {
      const hidden = Boolean(
        item.draft ||
        item.requiresAuth ||
        (item.type === "blog" && item.hasLocalePair === false),
      );
      if (hidden) return false;
      const status = rowState[item.id]?.status ?? "unknown";
      return status === "unknown" || status === "not_submitted";
    }).length;
  }, [monitorInventory, rowState]);

  const waitingCount = useMemo(() => {
    return monitorInventory.filter((item) => {
      const hidden = Boolean(
        item.draft ||
        item.requiresAuth ||
        (item.type === "blog" && item.hasLocalePair === false),
      );
      if (hidden) return false;
      return (rowState[item.id]?.status ?? "unknown") === "submitted";
    }).length;
  }, [monitorInventory, rowState]);

  const freshCount = useMemo(() => {
    return monitorInventory.filter((item) =>
      isFreshlyChecked(rowState[item.id]?.lastCheckedAt),
    ).length;
  }, [monitorInventory, rowState]);

  const setRowField = (id: string, patch: Partial<RowState>) => {
    setRowState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch, dirty: true },
    }));
  };

  const save = async (item: InventoryItem) => {
    const row = rowState[item.id];
    if (!row) return;

    if (isMonitoringOptOut(item)) {
      toast({
        title: "Konten dikecualikan dari index monitoring",
        description:
          "Item ini tidak perlu diprioritaskan index dan tidak boleh disubmit dari monitor.",
        variant: "destructive",
      });
      return;
    }

    if (
      item.type === "blog" &&
      item.hasLocalePair === false &&
      (row.status === "submitted" || row.status === "indexed")
    ) {
      toast({
        title: "Pasangan locale belum lengkap",
        description: `Artikel ini belum punya pasangan ${item.missingPairLocales?.join(", ") || "locale"}, jadi belum bisa dipush.`,
        variant: "destructive",
      });
      return;
    }

    setRowState((prev) => ({ ...prev, [item.id]: { ...row, saving: true } }));
    try {
      await updateIndexStatus({
        id: item.id,
        url: item.url,
        type: item.type,
        locale: item.locale,
        title: item.title,
        status: row.status,
        notes: row.notes,
      });
      setRowState((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], dirty: false, saving: false },
      }));
      toast({ title: "Saved", description: item.path });
    } catch (e) {
      setRowState((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], saving: false },
      }));
      toast({
        title: "Failed to save",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    }
  };

  const copyUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "URL copied", description: url });
      } catch {
        toast({
          title: "Copy gagal",
          description: "Tidak bisa akses clipboard.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const openGscAndCopy = useCallback(
    async (url: string) => {
      const propertyUrl = `${GSC_PROPERTY_BASE}?${new URLSearchParams({ resource_id: GSC_PROPERTY_ID }).toString()}`;

      const copySynchronously = (value: string) => {
        try {
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
          const copied = document.execCommand("copy");
          document.body.removeChild(textarea);
          return copied;
        } catch {
          return false;
        }
      };

      let copied = copySynchronously(url);

      if (!copied) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch {
          copied = copySynchronously(url);
        }
      }

      try {
        if (gscWindowRef && !gscWindowRef.closed) {
          gscWindowRef.location.href = propertyUrl;
          gscWindowRef.focus();
        } else {
          gscWindowRef = window.open(propertyUrl, GSC_WINDOW_NAME);
          gscWindowRef?.focus();
        }
      } catch {
        gscWindowRef = window.open(propertyUrl, GSC_WINDOW_NAME);
        gscWindowRef?.focus();
      }

      if (copied) {
        toast({
          title: "GSC dibuka · URL disalin",
          description: "Paste URL di kolom pencarian URL Inspection GSC.",
        });
        return;
      }

      window.prompt(
        "Clipboard diblokir browser. Copy URL ini secara manual:",
        url,
      );
      toast({
        title: "GSC dibuka",
        description:
          "Clipboard diblokir browser. Gunakan prompt manual untuk copy URL target.",
      });
    },
    [toast],
  );

  const refreshGsc = async (
    item: InventoryItem,
    options: RefreshGscOptions = {},
  ) => {
    if (isMonitoringOptOut(item)) {
      if (!options.silent) {
        toast({
          title: "Konten dikecualikan dari index monitoring",
          description:
            "Item ini tidak perlu diprioritaskan index atau direfresh ke GSC dari monitor.",
          variant: "destructive",
        });
      }
      return false;
    }

    if (item.type === "blog" && item.hasLocalePair === false) {
      if (!options.silent) {
        toast({
          title: "Pasangan locale belum lengkap",
          description: `Artikel ini belum punya pasangan ${item.missingPairLocales?.join(", ") || "locale"}, jadi tidak bisa dipush ke GSC dulu.`,
          variant: "destructive",
        });
      }
      return false;
    }

    // Cooldown check: skip if refreshed within 24 hours (unless forced)
    const existingRow = rowState[item.id];
    if (
      !options.silent &&
      !options.force &&
      isFreshlyChecked(existingRow?.lastCheckedAt)
    ) {
      const when = relativeTimeLabel(existingRow?.lastCheckedAt);
      toast({
        title: "Refresh terlalu cepat",
        description: `URL ini baru saja di-refresh ${when}. Tunggu 24 jam sebelum refresh ulang.`,
      });
      return false;
    }

    setRowState((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] ?? { status: "unknown", notes: "", dirty: false }),
        refreshing: true,
      },
    }));

    try {
      const res = await refreshFromGsc({
        id: item.id,
        url: item.url,
        type: item.type,
        locale: item.locale,
        title: item.title,
      });

      setRowState((prev) => ({
        ...prev,
        [item.id]: {
          ...(prev[item.id] ?? { status: "unknown", notes: "", dirty: false }),
          status: res.data.status,
          dirty: false,
          saving: false,
          refreshing: false,
          lastCheckedAt: res.data.lastCheckedAt,
          lastGSCResult: res.data.lastGSCResult,
        },
      }));

      if (!options.silent) {
        toast({
          title: res.cached ? "GSC (cached)" : "GSC refreshed",
          description: `${res.data.status.toUpperCase()} · ${item.path}`,
        });
      }

      return true;
    } catch (e) {
      setRowState((prev) => ({
        ...prev,
        [item.id]: {
          ...(prev[item.id] ?? { status: "unknown", notes: "", dirty: false }),
          refreshing: false,
        },
      }));
      if (!options.silent) {
        toast({
          title: "GSC tidak aktif",
          description:
            e instanceof Error
              ? e.message
              : "Setup GSC_SERVICE_ACCOUNT_JSON untuk aktifkan.",
          variant: "destructive",
        });
      }

      return false;
    }
  };

  const pushToIndexNow = async (item: InventoryItem) => {
    if (isMonitoringOptOut(item)) {
      toast({
        title: "Konten dikecualikan",
        description: "Item ini tidak perlu disubmit ke IndexNow.",
        variant: "destructive",
      });
      return;
    }

    if (item.type === "blog" && item.hasLocalePair === false) {
      toast({
        title: "Pasangan locale belum lengkap",
        description: "Artikel belum punya pasangan locale, tidak bisa disubmit ke IndexNow.",
        variant: "destructive",
      });
      return;
    }

    setRowState((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] ?? { status: "unknown", notes: "", dirty: false }),
        pushing: true,
      },
    }));

    try {
      // Create urls: main url and paired locale url if any
      const urlList = [item.url];
      
      // If blog and has locale pair, we could submit both. 
      // But the table rows already have both rows if they exist.
      // So submitting just this item's url is fine. The user can submit the other manually or batch.
      
      await submitToIndexNow({ urlList });
      
      setRowState((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          pushing: false,
        },
      }));

      toast({
        title: "Terkirim ke IndexNow",
        description: `Berhasil mengirim ${item.path} ke Bing.`,
      });
    } catch (e) {
      setRowState((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          pushing: false,
        },
      }));
      
      toast({
        title: "Gagal mengirim ke IndexNow",
        description: e instanceof Error ? e.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const runBatchRefresh = async (items: InventoryItem[], label: string) => {
    const limit = Number(batchSize);
    const targets = items.slice(0, limit);

    if (targets.length === 0) {
      toast({
        title: "Tidak ada target",
        description: "Tidak ada URL yang cocok untuk batch refresh saat ini.",
      });
      return;
    }

    setBatchRefresh({ running: true, label, done: 0, total: targets.length });

    let success = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      const item = targets[index];
      try {
        const ok = await refreshGsc(item, { silent: true });
        if (ok) success += 1;
        else failed += 1;
      } finally {
        setBatchRefresh((prev) => ({ ...prev, done: index + 1 }));
      }
    }

    setBatchRefresh({ running: false, label: "", done: 0, total: 0 });

    toast({
      title: `${label} selesai`,
      description: `${success} berhasil${failed ? ` · ${failed} gagal` : ""}`,
      variant: failed ? "destructive" : undefined,
    });
  };

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
          <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tighter text-destructive">
            Gagal memuat
          </h2>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------------------------
   * Compact funnel — mirrors the dashboard pipeline so the user knows
   * where in the workflow they are standing while working the monitor.
   * ----------------------------------------------------------------- */
  const indexedCount = monitorInventory.filter((item) => {
    const hidden = Boolean(
      item.draft ||
      item.requiresAuth ||
      (item.type === "blog" && item.hasLocalePair === false),
    );
    if (hidden) return false;
    return (rowState[item.id]?.status ?? "unknown") === "indexed";
  }).length;

  const compactStages: StageCount[] = [
    {
      key: "total",
      count: monitorInventory.length,
      href: buildMonitorHref({ status: null, visibility: "all" }),
    },
    {
      key: "public",
      count: publicCount,
      href: buildMonitorHref({ status: null, visibility: "public" }),
    },
    {
      key: "submit",
      count: waitingCount,
      href: buildMonitorHref({ status: "submitted", visibility: "public" }),
    },
    {
      key: "index",
      count: indexedCount,
      href: buildMonitorHref({ status: "indexed", visibility: "public" }),
    },
    {
      key: "needs",
      count: actionableCount,
      href: buildMonitorHref({ status: "not_submitted", visibility: "public" }),
    },
  ];
  
  const activeFunnelKey =
    filterVisibility === "public" && stageTab === "all"
      ? "public"
      : filterVisibility === "all" && stageTab === "all"
        ? "total"
        : stageTab === "needs"
      ? "needs"
      : stageTab === "submit"
        ? "submit"
        : stageTab === "index"
          ? "index"
          : null;

  const batchLimit = Math.min(filtered.length, Number(batchSize));
  const priorityLimit = Math.min(priorityCandidates.length, Number(batchSize));

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header: eyebrow + title + compact funnel ─── */}
      <header className="border-b border-border bg-background px-4 py-5 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Workspace · Index Monitor
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.03em]">
              Index Monitor
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {monitorInventory.length} URL dalam monitor · {publicCount} public · {hiddenCount} hidden · {freshCount} fresh
            </p>
          </div>
          <div className="relative z-20 hidden shrink-0 sm:block">
            <StageFunnel
              stages={compactStages}
              variant="compact"
              activeKey={activeFunnelKey}
              onStageSelect={handleFunnelStageSelect}
            />
          </div>
        </div>
      </header>

      {/* ── Stage tabs (sticky) ─── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-1">
                {STAGE_TAB_ORDER.map((tab) => {
                  const active = stageTab === tab;
                  const count = tabCounts[tab];
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleStageTabChange(tab)}
                      className={cn(
                        "inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
                        active
                          ? "border-accent/50 bg-accent/10 text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                      )}
                    >
                      <span className="sm:hidden">{STAGE_TAB_LABEL[tab].short}</span>
                      <span className="hidden sm:inline">{STAGE_TAB_LABEL[tab].full}</span>
                      <span
                        className={cn(
                          "inline-flex min-w-[1.25rem] items-center justify-center rounded-full border px-1 text-[9px] tabular-nums",
                          active
                            ? "border-accent/30 bg-background text-foreground"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
        </div>
      </div>

      {/* ── Filter row ─── */}
      <div className="border-b border-border bg-background px-4 py-3 md:px-6 lg:px-8">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {/* search takes full width on mobile, inline on xl */}
            <div className="relative w-full xl:min-w-64 xl:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari judul, slug, atau path…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 font-mono text-xs"
              />
            </div>

            {/* filter controls: 2-col on mobile, inline on xl */}
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap xl:flex-nowrap">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                className={cn(
                  "h-9 w-32 font-mono text-[10px] font-bold uppercase tracking-widest",
                  ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                )}
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="all">
                  All types
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="blog">
                  Blog
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="note">
                  Notes
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="tool">
                  Tools
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLocale} onValueChange={setFilterLocale}>
              <SelectTrigger
                className={cn(
                  "h-9 w-24 font-mono text-[10px] font-bold uppercase tracking-widest",
                  ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                )}
              >
                <SelectValue placeholder="Locale" />
              </SelectTrigger>
              <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="all">
                  All locales
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="en">
                  EN
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="id">
                  ID
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={gscQuickFilter}
              onValueChange={(v) => setGscQuickFilter(v as GscQuickFilter)}
            >
              <SelectTrigger
                className={cn(
                  "h-9 w-28 font-mono text-[10px] font-bold uppercase tracking-widest",
                  ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                )}
              >
                <SelectValue placeholder="Google" />
              </SelectTrigger>
              <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="all">
                  All Google
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="needs_review">
                  Review
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="unknown_google">
                  Unknown
                </SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="indexed_google">
                  Indexed
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant={advancedFiltersOpen ? "default" : "outline"}
              className="h-9 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
              onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More
            </Button>

            {/* ── Batch actions dropdown (consolidated) ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={batchRefresh.running}
                  className="h-9 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                >
                  {batchRefresh.running ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {batchRefresh.running
                    ? `${batchRefresh.done}/${batchRefresh.total}`
                    : "Batch"}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Batch size
                </DropdownMenuLabel>
                <div className="flex gap-1 px-2 pb-2">
                  {["5", "10", "20"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBatchSize(n)}
                      className={cn(
                        "flex-1 border px-2 py-1 font-mono text-[10px] font-bold tabular-nums transition-colors",
                        batchSize === n
                          ? "border-accent/50 bg-accent/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Refresh
                </DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={batchRefresh.running || filtered.length === 0}
                  onSelect={() =>
                    runBatchRefresh(
                      filtered,
                      `Refresh visible ${batchLimit}`,
                    )
                  }
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh visible ({batchLimit})
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    batchRefresh.running || priorityCandidates.length === 0
                  }
                  onSelect={() =>
                    runBatchRefresh(
                      priorityCandidates,
                      `Refresh priority ${priorityLimit}`,
                    )
                  }
                  className="flex items-center gap-2"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Refresh priority ({priorityLimit})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {filtered.length} shown
            </div>
            </div>
          </div>
        </div>

        {advancedFiltersOpen ? (
          <div className="mt-2 border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <WorkspaceSectionLabel>Advanced filters</WorkspaceSectionLabel>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filterVisibility}
                onValueChange={(v) =>
                  handleVisibilityChange(v as "all" | "public" | "hidden")
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-9 w-36 font-mono text-[10px] font-bold uppercase tracking-widest",
                    ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                  )}
                >
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                  <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="all">
                    All visibility
                  </SelectItem>
                  <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="public">
                    Public
                  </SelectItem>
                  <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="hidden">
                    Hidden
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default menampilkan semua. Filter ke &ldquo;Public&rdquo; untuk fokus ke
                URL yang bisa masuk Google.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Row list ─── */}
      <div className="space-y-2 px-4 py-4 md:px-6 lg:px-8">
        {filtered.map((item, idx) => {
          const row = rowState[item.id] ?? {
            status: "unknown" as IndexStatusValue,
            notes: "",
            dirty: false,
          };
          const opt = statusOpt(row.status);
          const gscSummary = summarizeForHumans(row.lastGSCResult);
          const isUnpairedBlog =
            item.type === "blog" && item.hasLocalePair === false;
          const isOptOut = isMonitoringOptOut(item);
          const missingPairsLabel =
            item.missingPairLocales?.join(", ") || "locale";
          const statusLocked =
            isOptOut ||
            (isUnpairedBlog &&
              (row.status === "submitted" || row.status === "indexed"));
          const fresh = isFreshlyChecked(row.lastCheckedAt);
          const refreshDisabled =
            Boolean(row.refreshing) ||
            Boolean(row.pushing) ||
            batchRefresh.running ||
            isUnpairedBlog ||
            isOptOut;

          return (
            <div
              key={item.id}
              style={{ animationDelay: `${idx * 30}ms` }}
              className="group animate-[fadeSlideIn_0.25s_ease_both] border border-border bg-card px-3.5 py-3 transition-colors hover:border-border"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_170px_auto] xl:items-center">
                {/* ── Content column ─── */}
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-background/50 text-muted-foreground">
                      {typeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Title + GSC headline (primary info) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                          {item.title}
                        </h3>
                        {gscSummary ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
                              gscSummary.tone,
                            )}
                          >
                            {gscSummary.headline}
                          </span>
                        ) : null}
                      </div>

                      {/* Path */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate font-mono text-[11px] text-muted-foreground hover:text-accent"
                      >
                        {item.path}
                      </a>

                      {/* Meta chips line — secondary info */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-muted-foreground">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                          {item.locale} · {item.type}
                        </span>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                          <Clock className="h-2.5 w-2.5" />
                          {row.lastCheckedAt
                            ? relativeTimeLabel(row.lastCheckedAt)
                            : "Never checked"}
                        </span>
                        {fresh ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Fresh
                          </span>
                        ) : null}
                        {item.draft ? (
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                            Draft
                          </span>
                        ) : null}
                        {item.requiresAuth ? (
                          <span className="rounded-full border border-zinc-500/40 bg-zinc-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                            Gated
                          </span>
                        ) : null}
                        {isUnpairedBlog ? (
                          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-destructive">
                            Missing {missingPairsLabel}
                          </span>
                        ) : null}
                        {isOptOut ? (
                          <span className="rounded-full border border-zinc-500/40 bg-zinc-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300">
                            Hidden
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Status + Actions row (inline on mobile) ─── */}
                <div className="flex items-start gap-2 md:contents">
                  {/* Status select column */}
                  <div className="flex-1 space-y-1.5 xl:space-y-1.5">
                  <Select
                    value={row.status}
                    onValueChange={(v) => {
                      const nextStatus = v as IndexStatusValue;
                      if (
                        isOptOut &&
                        (nextStatus === "submitted" || nextStatus === "indexed")
                      ) {
                        toast({
                          title: "Konten dikecualikan dari index monitoring",
                          description:
                            "Item ini tidak boleh dipindah ke status submitted atau indexed dari monitor.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (
                        item.type === "blog" &&
                        item.hasLocalePair === false &&
                        (nextStatus === "submitted" || nextStatus === "indexed")
                      ) {
                        toast({
                          title: "Pasangan locale belum lengkap",
                          description: `Artikel ini belum punya pasangan ${missingPairsLabel}, jadi status push tidak bisa dipilih.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      setRowField(item.id, { status: nextStatus });
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 border font-mono text-[10px] font-bold uppercase tracking-widest",
                        opt.pill,
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", opt.dot)}
                        />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem
                          className={ADMIN_SELECT_ITEM_CLASSNAME}
                          key={s.value}
                          value={s.value}
                          disabled={
                            ((item.type === "blog" &&
                              item.hasLocalePair === false) ||
                              isOptOut) &&
                            (s.value === "submitted" || s.value === "indexed")
                          }
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full", s.dot)}
                            />
                            {s.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {row.notes ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                  </div>

                  {/* ── Actions column ─── */}
                  <div className="flex shrink-0 items-center gap-1.5 xl:justify-end">
                  <Button
                    size="sm"
                    className="h-8 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                    title="Buka GSC Inspect URL + copy URL ke clipboard"
                    onClick={() => openGscAndCopy(item.url)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    GSC
                  </Button>

                  {row.dirty ? (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={row.saving || row.refreshing || statusLocked}
                      className="h-8 gap-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => save(item)}
                      title="Save"
                    >
                      {row.saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </>
                      )}
                    </Button>
                  ) : null}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onSelect={() => refreshGsc(item)}
                        disabled={refreshDisabled}
                        className="flex items-center gap-2"
                      >
                        {row.refreshing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Refresh from GSC
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => pushToIndexNow(item)}
                        disabled={refreshDisabled}
                        className="flex items-center gap-2"
                      >
                        {row.pushing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Push to IndexNow
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => copyUrl(item.url)}
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
                      {!row.dirty ? (
                        <DropdownMenuItem
                          disabled
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Saved
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-bold uppercase tracking-tight text-muted-foreground">
              No results
            </p>
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Coba kurangi filter atau ganti stage tab di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
