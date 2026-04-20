"use client";

import { useEffect, useMemo, useState } from "react";
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
  { value: "unknown",       label: "Unknown",      pill: "border-muted-foreground/20 text-muted-foreground",         dot: "bg-muted-foreground/40" },
  { value: "not_submitted", label: "Belum Submit", pill: "border-destructive/30 text-destructive bg-destructive/5",  dot: "bg-destructive" },
  { value: "submitted",     label: "Submitted",    pill: "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5", dot: "bg-amber-500" },
  { value: "indexed",       label: "Indexed",      pill: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5", dot: "bg-emerald-500" },
  { value: "excluded",      label: "Excluded",     pill: "border-zinc-500/30 text-zinc-600 bg-zinc-500/5",           dot: "bg-zinc-500" },
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

const ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME =
  "bg-background text-foreground hover:border-foreground/30 focus:border-accent";
const ADMIN_SELECT_CONTENT_CLASSNAME =
  "border-border bg-popover text-popover-foreground shadow-2xl";
const ADMIN_SELECT_ITEM_CLASSNAME =
  "text-popover-foreground data-[state=checked]:bg-accent/10 data-[state=checked]:text-foreground data-[highlighted]:bg-accent/18 data-[highlighted]:text-foreground dark:data-[state=checked]:bg-accent/16 dark:data-[highlighted]:bg-accent/24";

function gscPropertyUrl(property = GSC_PROPERTY_ID) {
  const params = new URLSearchParams({ resource_id: property });
  return `${GSC_PROPERTY_BASE}?${params.toString()}`;
}

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
    tone = "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  } else if (coverageLower.includes("unknown to google")) {
    headline = "Not known by Google yet";
    tone = "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
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
    indexingState && indexingState !== "Not specified" ? `Indexing: ${indexingState}` : null,
    fetchState && fetchState !== "Not specified" ? `Fetch: ${fetchState}` : null,
    robotsState && robotsState !== "Not specified" ? `Robots: ${robotsState}` : null,
    data.crawl ? `Last crawl: ${formatLastCheckedAt(data.crawl)}` : null,
  ].filter(Boolean) as string[];

  return {
    headline,
    tone,
    details,
  };
}

type GscQuickFilter = "all" | "needs_review" | "unknown_google" | "indexed_google";

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

type BatchRefreshState = {
  running: boolean;
  label: string;
  done: number;
  total: number;
};

type RefreshGscOptions = {
  silent?: boolean;
};

export function ContentTable() {
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gscQuickFilter, setGscQuickFilter] = useState<GscQuickFilter>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLocale, setFilterLocale] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
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
        const [inv, st] = await Promise.all([fetchContentInventory(), fetchIndexStatuses()]);
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
    if (s && ["unknown", "not_submitted", "submitted", "indexed", "excluded"].includes(s)) {
      setFilterStatus(s);
    }

    const gsc = sp.get("gsc");
    if (gsc && ["needs_review", "unknown_google", "indexed_google"].includes(gsc)) {
      setGscQuickFilter(gsc as GscQuickFilter);
    }

    const locale = sp.get("locale");
    if (locale && ["en", "id"].includes(locale)) setFilterLocale(locale);

    const q = sp.get("q");
    if (q) setSearch(q);
  }, []);

  const filtered = useMemo(() => {
    if (!inventory) return [];
    const q = search.trim().toLowerCase();
    return inventory.filter((item) => {
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
  }, [inventory, filterType, filterLocale, filterStatus, gscQuickFilter, search, rowState]);

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
    return filtered
      .filter((item) => !item.draft && !item.requiresAuth)
      .filter((item) => item.type !== "blog" || item.hasLocalePair !== false)
      .filter((item) => {
        const status = rowState[item.id]?.status ?? "unknown";
        return status === "unknown" || status === "not_submitted" || status === "submitted";
      })
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
      });
  }, [filtered, rowState]);

  const setRowField = (id: string, patch: Partial<RowState>) => {
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch, dirty: true } }));
  };

  const save = async (item: InventoryItem) => {
    const row = rowState[item.id];
    if (!row) return;

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
      setRowState((prev) => ({ ...prev, [item.id]: { ...prev[item.id], dirty: false, saving: false } }));
      toast({ title: "Saved", description: item.path });
    } catch (e) {
      setRowState((prev) => ({ ...prev, [item.id]: { ...prev[item.id], saving: false } }));
      toast({
        title: "Failed to save",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    }
  };

  const refreshGsc = async (item: InventoryItem, options: RefreshGscOptions = {}) => {
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
          description: e instanceof Error ? e.message : "Setup GSC_SERVICE_ACCOUNT_JSON untuk aktifkan.",
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
    <div className="min-h-screen">
      {/* Hero header */}
      <header className="border-b-2 border-foreground/90 bg-background px-8 pt-10 pb-8 md:px-12">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          — Index Monitor / Inventory
        </p>
        <h1 className="mt-2 font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] md:text-7xl">
          Content <span className="text-accent">Table.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          {inventory?.length ?? 0} URL terdeteksi. Update status manual per baris atau gunakan
          Quick Submit untuk membuka halaman Inspection Google Search Console di tab baru.
        </p>

        {/* Status chips row */}
        {statusCounts && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition",
                filterStatus === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/20 hover:border-foreground/50",
              )}
            >
              All · {statusCounts.all}
            </button>
            {STATUS_OPTIONS.map((s) => {
              const n = statusCounts[s.value] ?? 0;
              const active = filterStatus === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setFilterStatus(active ? "all" : s.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition",
                    active ? "border-foreground bg-foreground text-background" : s.pill,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                  {s.label} · {n}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Controls */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-8 py-4 md:px-12">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari judul, slug, atau path…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                className={cn(
                  "w-[140px] font-mono text-[10px] font-bold uppercase tracking-widest",
                  ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                )}
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="all">Semua tipe</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="blog">Blog</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="note">Notes</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="tool">Tools</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLocale} onValueChange={setFilterLocale}>
              <SelectTrigger
                className={cn(
                  "w-[110px] font-mono text-[10px] font-bold uppercase tracking-widest",
                  ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                )}
              >
                <SelectValue placeholder="Locale" />
              </SelectTrigger>
              <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="all">All Locales</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="en">EN</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="id">ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={batchSize} onValueChange={setBatchSize}>
              <SelectTrigger
                className={cn(
                  "w-[120px] font-mono text-[10px] font-bold uppercase tracking-widest",
                  ADMIN_FILTER_SELECT_TRIGGER_CLASSNAME,
                )}
              >
                <SelectValue placeholder="Batch size" />
              </SelectTrigger>
              <SelectContent className={ADMIN_SELECT_CONTENT_CLASSNAME}>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="5">Batch 5</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="10">Batch 10</SelectItem>
                <SelectItem className={ADMIN_SELECT_ITEM_CLASSNAME} value="20">Batch 20</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={batchRefresh.running}
              className="gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
              onClick={() => runBatchRefresh(filtered, `Refresh visible ${Math.min(filtered.length, Number(batchSize))}`)}
            >
              {batchRefresh.running && batchRefresh.label.startsWith("Refresh visible") ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Visible ({Math.min(filtered.length, Number(batchSize))})
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={batchRefresh.running}
              className="gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"
              onClick={() => runBatchRefresh(priorityCandidates, `Refresh priority ${Math.min(priorityCandidates.length, Number(batchSize))}`)}
            >
              {batchRefresh.running && batchRefresh.label.startsWith("Refresh priority") ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Priority ({Math.min(priorityCandidates.length, Number(batchSize))})
            </Button>
          </div>
          <div className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {batchRefresh.running
              ? `${batchRefresh.label} · ${batchRefresh.done}/${batchRefresh.total}`
              : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setGscQuickFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition",
              gscQuickFilter === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/20 text-muted-foreground hover:border-foreground/50 hover:text-foreground",
            )}
          >
            All GSC
          </button>
          <button
            onClick={() => setGscQuickFilter("needs_review")}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition",
              gscQuickFilter === "needs_review"
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border-destructive/30 bg-destructive/5 text-destructive hover:border-destructive/60",
            )}
          >
            Needs review
          </button>
          <button
            onClick={() => setGscQuickFilter("unknown_google")}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition",
              gscQuickFilter === "unknown_google"
                ? "border-amber-500 bg-amber-500 text-black"
                : "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:border-amber-500/70 dark:text-amber-400",
            )}
          >
            Unknown to Google
          </button>
          <button
            onClick={() => setGscQuickFilter("indexed_google")}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition",
              gscQuickFilter === "indexed_google"
                ? "border-emerald-500 bg-emerald-500 text-black"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/70 dark:text-emerald-400",
            )}
          >
            Indexed
          </button>
        </div>
      </div>

      {/* Row list — card-style, not a classic table */}
      <div className="divide-y px-8 md:px-12">
        {filtered.map((item) => {
          const row = rowState[item.id] ?? { status: "unknown" as IndexStatusValue, notes: "", dirty: false };
          const opt = statusOpt(row.status);
          const gscSummary = summarizeForHumans(row.lastGSCResult);
          const isUnpairedBlog = item.type === "blog" && item.hasLocalePair === false;
          const missingPairsLabel = item.missingPairLocales?.join(", ") || "locale";
          const statusLocked =
            isUnpairedBlog && (row.status === "submitted" || row.status === "indexed");
          return (
            <div
              key={item.id}
              className="group grid grid-cols-1 items-start gap-4 py-4 md:grid-cols-[minmax(0,1fr)_200px_200px_auto]"
            >
              {/* URL + meta */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{typeIcon(item.type)}</span>
                  <h3 className="truncate font-display text-base font-black tracking-tight">
                    {item.title}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-mono text-[11px] text-muted-foreground hover:text-accent"
                  >
                    {item.path}
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-sm border border-foreground/20 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest">
                    {item.locale}
                  </span>
                  <span className="rounded-sm border border-foreground/20 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest">
                    {item.type}
                  </span>
                  {item.draft && (
                    <span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                      Draft
                    </span>
                  )}
                  {item.requiresAuth && (
                    <span className="rounded-sm border border-zinc-500/40 bg-zinc-500/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      Gated
                    </span>
                  )}
                  {isUnpairedBlog && (
                    <span className="rounded-sm border border-destructive/40 bg-destructive/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-widest text-destructive">
                      Unpaired · Missing {missingPairsLabel}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Last check · {formatLastCheckedAt(row.lastCheckedAt)}
                  </p>
                  {isUnpairedBlog ? (
                    <p className="text-xs text-destructive">
                      Push ke Google ditahan sampai file pasangan locale tersedia.
                    </p>
                  ) : null}
                  {gscSummary ? (
                    <div className="space-y-2">
                      <span className={cn("inline-flex rounded-full border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest", gscSummary.tone)}>
                        {gscSummary.headline}
                      </span>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {gscSummary.details.slice(0, 3).map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Status + pill */}
              <div className="flex flex-col gap-1.5">
                <Select
                  value={row.status}
                  onValueChange={(v) => {
                    const nextStatus = v as IndexStatusValue;
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
                      "h-9 border font-mono text-[10px] font-bold uppercase tracking-widest",
                      opt.pill,
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", opt.dot)} />
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
                          item.type === "blog" &&
                          item.hasLocalePair === false &&
                          (s.value === "submitted" || s.value === "indexed")
                        }
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <Input
                placeholder="Notes…"
                value={row.notes}
                onChange={(e) => setRowField(item.id, { notes: e.target.value })}
                className="h-9 font-mono text-xs"
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent"
                  asChild
                  title="Buka property Google Search Console"
                >
                  <a href={gscPropertyUrl()} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-accent"
                  onClick={() => refreshGsc(item)}
                  disabled={Boolean(row.refreshing) || batchRefresh.running || isUnpairedBlog}
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
                  variant={row.dirty ? "default" : "ghost"}
                  disabled={!row.dirty || row.saving || row.refreshing || statusLocked}
                  className={cn(
                    "h-9 gap-1 font-mono text-[10px] font-bold uppercase tracking-widest",
                    !row.dirty && "w-9 p-0",
                  )}
                  onClick={() => save(item)}
                  title={row.dirty ? "Save" : "Saved"}
                >
                  {row.saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : row.dirty ? (
                    <><Save className="h-3.5 w-3.5" /> Save</>
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </Button>
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
