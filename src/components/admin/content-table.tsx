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
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchContentInventory,
  fetchIndexStatuses,
  updateIndexStatus,
  refreshFromGsc,
  type InventoryItem,
  type IndexStatusValue,
} from "@/components/admin/admin-api-client";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: {
  value: IndexStatusValue;
  label: string;
  pill: string;
  dot: string;
}[] = [
  {
    value: "unknown",
    label: "Unknown",
    pill: "border-muted-foreground/20 text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  {
    value: "not_submitted",
    label: "Belum Submit",
    pill: "border-destructive/30 text-destructive bg-destructive/5",
    dot: "bg-destructive",
  },
  {
    value: "submitted",
    label: "Submitted",
    pill: "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5",
    dot: "bg-amber-500",
  },
  {
    value: "indexed",
    label: "Indexed",
    pill: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5",
    dot: "bg-emerald-500",
  },
  {
    value: "excluded",
    label: "Excluded",
    pill: "border-zinc-500/30 text-zinc-600 bg-zinc-500/5",
    dot: "bg-zinc-500",
  },
];

function statusOpt(v: IndexStatusValue) {
  return STATUS_OPTIONS.find((s) => s.value === v) ?? STATUS_OPTIONS[0];
}

function typeIcon(type: InventoryItem["type"]) {
  if (type === "blog") return <FileText className="h-3.5 w-3.5" />;
  if (type === "note") return <StickyNote className="h-3.5 w-3.5" />;
  return <Wrench className="h-3.5 w-3.5" />;
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
  "border-border bg-popover text-popover-foreground shadow-2xl";
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [inv, st] = await Promise.all([
          fetchContentInventory(),
          fetchIndexStatuses(),
        ]);
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
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("type");
    if (t && ["blog", "note", "tool"].includes(t)) setFilterType(t);

    const s = sp.get("status");
    if (
      s &&
      ["unknown", "not_submitted", "submitted", "indexed", "excluded"].includes(
        s,
      )
    ) {
      setFilterStatus(s);
    }

    const gsc = sp.get("gsc");
    if (
      gsc &&
      ["needs_review", "unknown_google", "indexed_google"].includes(gsc)
    ) {
      setGscQuickFilter(gsc as GscQuickFilter);
    }

    const locale = sp.get("locale");
    if (locale && ["en", "id"].includes(locale)) setFilterLocale(locale);

    const visibility = sp.get("visibility");
    if (visibility && ["all", "public", "hidden"].includes(visibility)) {
      setFilterVisibility(visibility as "all" | "public" | "hidden");
    }

    const q = sp.get("q");
    if (q) setSearch(q);
  }, []);

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
      if (filterStatus !== "all" && s !== filterStatus) return false;
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
    filterStatus,
    filterVisibility,
    gscQuickFilter,
    search,
    rowState,
  ]);

  const statusCounts = useMemo(() => {
    if (!inventory) return null;
    const c: Record<string, number> = { all: inventory.length };
    for (const item of inventory) {
      const s = rowState[item.id]?.status ?? "unknown";
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [inventory, rowState]);

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
          <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tighter text-destructive">
            Gagal memuat
          </h2>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background px-4 py-4 md:px-8 lg:px-12">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              — Index Monitor / Ops List
            </p>
            <div className="mt-1 flex flex-col gap-1 xl:flex-row xl:items-end xl:gap-3">
              <h1 className="font-display text-2xl font-black tracking-[-0.04em] md:text-3xl">
                Index monitor
              </h1>
              <p className="text-sm text-muted-foreground">
                {inventory?.length ?? 0} URL · {actionableCount} actionable ·{" "}
                {waitingCount} awaiting · {freshCount} fresh · {publicCount}{" "}
                public · {hiddenCount} hidden
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-10 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-sm md:px-8 lg:px-12">
        <div className="grid gap-2.5">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="relative min-w-65 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari judul, slug, atau path…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  className={cn(
                    "h-9 w-36 font-mono text-[10px] font-bold uppercase tracking-widest",
                    ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                  )}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="all"
                  >
                    Semua status
                  </SelectItem>
                  {STATUS_OPTIONS.map((s) => {
                    const n = statusCounts?.[s.value] ?? 0;
                    return (
                      <SelectItem
                        className={ADMIN_SELECT_ITEM_CLASSNAME}
                        key={s.value}
                        value={s.value}
                      >
                        {s.label} · {n}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={gscQuickFilter}
                onValueChange={(v) => setGscQuickFilter(v as GscQuickFilter)}
              >
                <SelectTrigger
                  className={cn(
                    "h-9 w-32 font-mono text-[10px] font-bold uppercase tracking-widest",
                    ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                  )}
                >
                  <SelectValue placeholder="Google" />
                </SelectTrigger>
                <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="all"
                  >
                    All Google
                  </SelectItem>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="needs_review"
                  >
                    Review
                  </SelectItem>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="unknown_google"
                  >
                    Unknown
                  </SelectItem>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="indexed_google"
                  >
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
                More filters
              </Button>

              <Select value={batchSize} onValueChange={setBatchSize}>
                <SelectTrigger
                  className={cn(
                    "h-9 w-30 font-mono text-[10px] font-bold uppercase tracking-widest",
                    ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                  )}
                >
                  <SelectValue placeholder="Batch size" />
                </SelectTrigger>
                <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                  <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="5">
                    Batch 5
                  </SelectItem>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="10"
                  >
                    Batch 10
                  </SelectItem>
                  <SelectItem
                    className={ADMIN_SELECT_ITEM_CLASSNAME}
                    value="20"
                  >
                    Batch 20
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                disabled={batchRefresh.running}
                className="h-9 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                title="Refresh semua URL yang tampil di layar sekarang"
                onClick={() =>
                  runBatchRefresh(
                    filtered,
                    `Refresh visible ${Math.min(filtered.length, Number(batchSize))}`,
                  )
                }
              >
                {batchRefresh.running &&
                batchRefresh.label.startsWith("Refresh visible") ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Visible
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={batchRefresh.running}
                className="h-9 gap-2 border-accent/30 font-mono text-[10px] font-bold uppercase tracking-widest text-accent hover:border-accent hover:text-accent"
                title="Refresh URL prioritas yang belum indexed dan belum fresh"
                onClick={() =>
                  runBatchRefresh(
                    priorityCandidates,
                    `Refresh priority ${Math.min(priorityCandidates.length, Number(batchSize))}`,
                  )
                }
              >
                {batchRefresh.running &&
                batchRefresh.label.startsWith("Refresh priority") ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                Priority
              </Button>

              <div className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {batchRefresh.running
                  ? `${batchRefresh.done}/${batchRefresh.total}`
                  : `${filtered.length} results`}
              </div>
            </div>
          </div>

          {advancedFiltersOpen ? (
            <div className="rounded-2xl border border-border/70 bg-card/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <WorkspaceSectionLabel>Advanced filters</WorkspaceSectionLabel>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger
                    className={cn(
                      "h-9 w-35 font-mono text-[10px] font-bold uppercase tracking-widest",
                      ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                    )}
                  >
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="all"
                    >
                      Semua tipe
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="blog"
                    >
                      Blog
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="note"
                    >
                      Notes
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="tool"
                    >
                      Tools
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterLocale} onValueChange={setFilterLocale}>
                  <SelectTrigger
                    className={cn(
                      "h-9 w-27.5 font-mono text-[10px] font-bold uppercase tracking-widest",
                      ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                    )}
                  >
                    <SelectValue placeholder="Locale" />
                  </SelectTrigger>
                  <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="all"
                    >
                      All Locales
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="en"
                    >
                      EN
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="id"
                    >
                      ID
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterVisibility}
                  onValueChange={(v) =>
                    setFilterVisibility(v as "all" | "public" | "hidden")
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 w-32.5 font-mono text-[10px] font-bold uppercase tracking-widest",
                      ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                    )}
                  >
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="all"
                    >
                      Semua
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="public"
                    >
                      Public
                    </SelectItem>
                    <SelectItem
                      className={ADMIN_SELECT_ITEM_CLASSNAME}
                      value="hidden"
                    >
                      Hidden
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 px-4 py-4 md:px-8 lg:px-12">
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

          return (
            <div
              key={item.id}
              style={{ animationDelay: `${idx * 30}ms` }}
              className="group animate-[fadeSlideIn_0.25s_ease_both] rounded-2xl border border-border/70 bg-card/25 px-3.5 py-3 shadow-sm transition-colors hover:border-border"
            >
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_190px_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground">
                      {typeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                          {item.title}
                        </h3>
                        {fresh ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Fresh
                          </span>
                        ) : null}
                        {gscSummary ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
                              gscSummary.tone,
                            )}
                          >
                            {gscSummary.headline}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            No GSC
                          </span>
                        )}
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate font-mono text-[11px] text-muted-foreground hover:text-accent"
                      >
                        {item.path}
                      </a>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-foreground/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest">
                          {item.locale}
                        </span>
                        <span className="rounded-full border border-foreground/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest">
                          {item.type}
                        </span>
                        {item.draft && (
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                        {item.requiresAuth && (
                          <span className="rounded-full border border-zinc-500/40 bg-zinc-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                            Gated
                          </span>
                        )}
                        {isUnpairedBlog && (
                          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-destructive">
                            Missing {missingPairsLabel}
                          </span>
                        )}
                        {isOptOut && (
                          <span className="rounded-full border border-zinc-500/40 bg-zinc-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300">
                            Hidden from monitor
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {row.lastCheckedAt
                            ? relativeTimeLabel(row.lastCheckedAt)
                            : "Never checked"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
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

                <div className="flex flex-wrap items-center gap-1.5 xl:justify-end">
                  <Button
                    size="sm"
                    className="h-8 gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
                    title="Buka GSC Inspect URL + copy URL ke clipboard"
                    onClick={() => openGscAndCopy(item.url)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    GSC
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => refreshGsc(item)}
                    disabled={
                      Boolean(row.refreshing) ||
                      batchRefresh.running ||
                      isUnpairedBlog ||
                      isOptOut
                    }
                    title="Refresh from GSC API"
                  >
                    {row.refreshing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent"
                    title="Copy URL artikel"
                    onClick={() => copyUrl(item.url)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Buka URL publik"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>

                  <Button
                    size="sm"
                    variant={row.dirty ? "default" : "ghost"}
                    disabled={
                      !row.dirty || row.saving || row.refreshing || statusLocked
                    }
                    className={cn(
                      "h-8 gap-1 font-mono text-[10px] font-bold uppercase tracking-widest",
                      !row.dirty && "px-2 text-muted-foreground",
                    )}
                    onClick={() => save(item)}
                    title={row.dirty ? "Save" : "Saved"}
                  >
                    {row.saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : row.dirty ? (
                      <>
                        <Save className="h-3.5 w-3.5" /> Save
                      </>
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-black uppercase tracking-tight text-muted-foreground">
              No results
            </p>
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Try removing filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
