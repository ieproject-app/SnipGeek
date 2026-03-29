"use client";

import { useState, useEffect, useMemo, useRef, useCallback, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SnipTooltip } from "@/components/ui/snip-tooltip";
import {
  Copy,
  Check,
  X,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
  Download,
  Grid3X3,
  GalleryHorizontal,
  ImageIcon,
  Calendar,
  Zap,
  Search,
  Type,
  Star,
  Hash,
  AlignLeft,
  Sparkles,
  Layers,
  PenLine,
  Settings2,
  FileText,
  BookOpen,
  ChevronsUpDown,
  CheckCircle2,
} from "lucide-react";
import { downloadLinks } from "@/lib/data-downloads";
import { useNotification } from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Dictionary } from "@/lib/get-dictionary";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type DownloadItem = {
  id: string;
  type: "id" | "url";
  value: string;
};

type ArticleSummary = {
  slug: string;
  title: string;
  type: "blog" | "note";
  published: boolean;
  date: string;
};

type ToolPromptsDictionary = {
  title: string;
  description: string;
  copiedButton: string;
  modes: {
    create: string;
    modify: string;
  };
  contentTypeSeries: string;
  contentTypeNews: string;
  contentTypeTips: string;
  contentTypeNotes: string;
  seriesPhaseLabel: string;
  seriesArticleLabel: string;
  seriesTargetLabel: string;
  seriesToneLabel: string;
  newsSourceUrlsLabel: string;
  newsAngleLabel: string;
  tipsStandaloneLabel: string;
  notesIntentLabel: string;
  notesIntentFinding: string;
  notesIntentReference: string;
  notesIntentMiniFix: string;
  notesIntentObservation: string;
  selectArticleLabel: string;
  searchArticlePlaceholder: string;
  originalContentTitle: string;
  draftTitle: string;
  originalContentPlaceholder: string;
  draftPlaceholder: string;
  modInstructionsTitle: string;
  modInstructionsPlaceholder: string;
  imagesTitle: string;
  imagesPlaceholder: string;
  downloadLinks: {
    title: string;
    description: string;
    addDownload: string;
    selectId: string;
    urlPlaceholder: string;
    promptTitle: string;
    promptInstruction: string;
  };
  quickActions: {
    label?: string;
    narrative: string;
    images: string;
    metadata: string;
    polish: string;
  };
};

type QuickActionKey = "readability" | "narrative" | "images" | "metadata" | "polish";

type ValidationIssue = {
  id: string;
  severity: "error" | "warning";
  title: string;
  description: string;
};

const toTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

export const getDraftAgeDays = (value: string) => {
  const timestamp = toTimestamp(value);
  if (!Number.isFinite(timestamp)) return null;

  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - timestamp) / dayMs));
};

// ──────────────────────────────────────────────────────────────────────────────
// Utility: Parse natural date strings (id/en) into YYYY-MM-DD
// Examples to handle: "07 Maret 2026", "2 Jan 25", "2024/05/12", etc.
// ──────────────────────────────────────────────────────────────────────────────
export const parseNaturalDate = (input: string): string => {
  if (!input || input.trim() === "") return "";
  const cleaned = input.trim();

  // If it already looks like YYYY-MM-DD, keep it.
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // Replace Indonesian months with English ones to help the JS Date parser
  const idMonths: Record<string, string> = {
    januari: "January", jan: "Jan",
    februari: "February", pebruari: "February", feb: "Feb",
    maret: "March", mar: "Mar",
    april: "April", apr: "Apr",
    mei: "May",
    juni: "June", jun: "Jun",
    juli: "July", jul: "Jul",
    agustus: "August", agu: "Aug",
    september: "September", sep: "Sep",
    oktober: "October", okt: "Oct",
    november: "November", nopember: "November", nov: "Nov",
    desember: "December", des: "Dec"
  };

  let translated = cleaned.toLowerCase();
  for (const [id, en] of Object.entries(idMonths)) {
    // Replace word boundaries
    const regex = new RegExp(`\\b${id}\\b`, "g");
    translated = translated.replace(regex, en);
  }

  // Normalize 2-digit years to avoid browser-dependent interpretation.
  const normalize2DigitYear = (year: string) => {
    const yy = Number(year);
    return yy >= 70 ? `19${year}` : `20${year}`;
  };

  translated = translated.replace(
    /(\b\d{1,2}\s+[a-z]+\s+)(\d{2})(\b)/gi,
    (_match, prefix: string, yy: string, suffix: string) =>
      `${prefix}${normalize2DigitYear(yy)}${suffix}`,
  );
  translated = translated.replace(
    /(\b\d{1,2}[\/\-]\d{1,2}[\/\-])(\d{2})(\b)/g,
    (_match, prefix: string, yy: string, suffix: string) =>
      `${prefix}${normalize2DigitYear(yy)}${suffix}`,
  );

  const date = new Date(translated);

  // If invalid date, just return the raw user input
  if (isNaN(date.getTime())) {
    return cleaned;
  }

  // Format as YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// Utility: Normalize Image Paths (flip \ to /, strip 'public/', ensure leading /)
// ──────────────────────────────────────────────────────────────────────────────
const normalizeImagePath = (path: string): string => {
  if (!path) return "";
  return path
    .trim()
    .replace(/\\/g, "/")                // Flip \ to /
    .replace(/^public\//, "/")          // Remove 'public/' prefix
    .replace(/^\/+/, "/");              // Ensure single leading /
};

// Safe UUID v4 generator — works in HTTP, HTTPS, and all browsers
const generateUUID = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback: manual RFC 4122 UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

type AvailableTag = { name: string; count: number };

export interface ToolPromptsProps {
  dictionary: ToolPromptsDictionary;
  existingArticles: ArticleSummary[];
  fullDictionary: Dictionary;
  locale: string;
  availableTags: AvailableTag[];
}

type WorkflowContentType = "series" | "news" | "tips" | "notes";
type SeriesPhase = "phase-1" | "phase-2" | "phase-3" | "phase-4" | "phase-5";
type NoteIntent = "finding" | "reference" | "mini-fix" | "observation";

const seriesPhaseOptions: Array<{ value: SeriesPhase; label: string }> = [
  { value: "phase-1", label: "Phase 1" },
  { value: "phase-2", label: "Phase 2" },
  { value: "phase-3", label: "Phase 3" },
  { value: "phase-4", label: "Phase 4" },
  { value: "phase-5", label: "Phase 5" },
];

const seriesArticleOptions = Array.from({ length: 20 }, (_value, index) =>
  String(index + 1).padStart(2, "0"),
);

const noteIntentOptions: NoteIntent[] = [
  "finding",
  "reference",
  "mini-fix",
  "observation",
];

const seriesBlueprint: Record<
  SeriesPhase,
  {
    target: { en: string; id: string };
    tone: { en: string; id: string };
    context: { en: string; id: string };
  }
> = {
  "phase-1": {
    target: {
      en: "Beginner moving from single-OS setup to safe dual-boot",
      id: "Pemula yang berpindah dari single-OS ke dual-boot aman",
    },
    tone: {
      en: "Practical, reassuring, low-jargon",
      id: "Praktis, menenangkan, minim jargon",
    },
    context: {
      en: "Initial planning and risk prevention before changing partitions or boot setup.",
      id: "Perencanaan awal dan pencegahan risiko sebelum mengubah partisi atau boot setup.",
    },
  },
  "phase-2": {
    target: {
      en: "User preparing installation media and firmware settings",
      id: "Pengguna yang menyiapkan media instalasi dan pengaturan firmware",
    },
    tone: {
      en: "Checklist-first and step-by-step",
      id: "Checklist dulu lalu langkah bertahap",
    },
    context: {
      en: "Execution phase for install media, BIOS/UEFI prep, and first boot decisions.",
      id: "Fase eksekusi untuk media instalasi, persiapan BIOS/UEFI, dan keputusan boot awal.",
    },
  },
  "phase-3": {
    target: {
      en: "Daily dual-boot user optimizing stability and workflow",
      id: "Pengguna dual-boot harian yang mengoptimalkan stabilitas dan workflow",
    },
    tone: {
      en: "Direct with practical tradeoff notes",
      id: "Lugas dengan catatan kompromi praktis",
    },
    context: {
      en: "Post-install improvements for drivers, updates, and productivity setup.",
      id: "Peningkatan pasca-instalasi untuk driver, update, dan setup produktivitas.",
    },
  },
  "phase-4": {
    target: {
      en: "Intermediate user dealing with edge cases and breakage",
      id: "Pengguna menengah yang menangani kasus pinggiran dan kerusakan",
    },
    tone: {
      en: "Diagnostic and methodical",
      id: "Diagnostik dan metodis",
    },
    context: {
      en: "Troubleshooting phase focused on boot errors, update failures, and recovery paths.",
      id: "Fase troubleshooting yang fokus pada error boot, gagal update, dan jalur pemulihan.",
    },
  },
  "phase-5": {
    target: {
      en: "Power user maintaining long-term dual-boot reliability",
      id: "Power user yang menjaga keandalan dual-boot jangka panjang",
    },
    tone: {
      en: "Strategic and maintenance-oriented",
      id: "Strategis dan berorientasi maintenance",
    },
    context: {
      en: "Long-term maintenance, rollback strategy, and future-proofing decisions.",
      id: "Maintenance jangka panjang, strategi rollback, dan keputusan future-proofing.",
    },
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Feature flag pill — reusable toggle button
// ──────────────────────────────────────────────────────────────────────────────
export function FeaturePill({
  active,
  onClick,
  icon: Icon,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  activeClass: string;
}) {
  return (
    <SnipTooltip label={label} side="bottom">
      <motion.button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.91 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl border transition-colors duration-300",
          active
            ? activeClass
            : "bg-background/50 text-foreground/70 border-primary/10 hover:border-primary/30 hover:bg-accent/10 hover:text-foreground",
        )}
      >
        <motion.span
          animate={
            active
              ? { scale: [1, 1.35, 1], rotate: [0, -12, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.35, ease: "backOut" }}
          className="flex"
        >
          <Icon className="h-5 w-5 shrink-0" />
        </motion.span>
      </motion.button>
    </SnipTooltip>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Download ID picker — searchable dropdown tied to data-downloads
// ──────────────────────────────────────────────────────────────────────────────
export function DownloadIdPicker({
  value,
  onSelect,
  downloadIds,
}: {
  value: string;
  onSelect: (next: string) => void;
  downloadIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return downloadIds;
    return downloadIds.filter((id) => {
      const item = downloadLinks[id];
      if (!item) return false;
      return (
        id.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        (item.platform ?? "").toLowerCase().includes(q)
      );
    });
  }, [downloadIds, query]);

  const selected = value ? downloadLinks[value] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex-1 h-7 rounded-md border border-primary/10 bg-background px-2 text-left text-[10px] transition-colors",
            "hover:border-primary/35 hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
          )}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-foreground/90">
              {value || "Select download ID..."}
            </span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-115 p-2">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, filename, or platform..."
            className="h-8 text-[11px]"
          />
          <div className="max-h-56 overflow-auto rounded-md border border-primary/10">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-[11px] text-muted-foreground">
                No matching download ID.
              </div>
            ) : (
              filtered.map((id) => {
                const item = downloadLinks[id];
                const isSelected = value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onSelect(id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 border-b border-primary/5 last:border-b-0 transition-colors",
                      "hover:bg-muted/40",
                      isSelected && "bg-primary/10",
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <CheckCircle2
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          isSelected ? "text-primary" : "text-transparent",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[10px] font-black uppercase tracking-wide text-primary">
                          {id}
                        </span>
                        <span className="block truncate text-[11px] text-foreground/90">
                          {item?.fileName ?? "Unknown download item"}
                        </span>
                        {item?.fileSize && (
                          <span className="block text-[10px] text-muted-foreground">
                            Size: {item.fileSize}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
      {selected && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {selected.fileName}
          {selected.fileSize ? ` • ${selected.fileSize}` : ""}
        </p>
      )}
    </Popover>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
export function usePromptLogic({
  dictionary,
  existingArticles,
  fullDictionary,
  locale,
  availableTags,
}: ToolPromptsProps) {
  const [mounted, setMounted] = useState(false);
  const originalContentRef = useRef<HTMLTextAreaElement>(null);
  const modInstructionsRef = useRef<HTMLTextAreaElement>(null);
  const blockComposerRef = useRef<HTMLDivElement>(null);

  // ── Mode & content type ──
  const [mode, setMode] = useState<"create" | "modify">("create");
  const [contentType, setContentType] = useState<WorkflowContentType>("series");
  const [seriesPhase, setSeriesPhase] = useState<SeriesPhase>("phase-1");
  const [seriesArticleNumber, setSeriesArticleNumber] = useState("01");
  const [newsSourceUrls, setNewsSourceUrls] = useState<string[]>([""]);
  const [newsAngle, setNewsAngle] = useState("");
  const [tipsStandalone, setTipsStandalone] = useState(true);
  const [noteIntent, setNoteIntent] = useState<NoteIntent>("finding");

  // ── Article selector (modify mode) ──
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [articleSearch, setArticleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // ── Content areas ──
  const [draft, setDraft] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [modInstructions, setModInstructions] = useState("");

  // ── Feature flags (persisted) ──
  const [showImages, setShowImages] = useState(true);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [isIdOnly, setIsIdOnly] = useState(false);
  const [captionMode, setCaptionMode] = useState<"off" | "auto" | "manual">("auto");
  const [captionAlignment, setCaptionAlignment] = useState<"left" | "center" | "right">("center");
  const [captionCoverage, setCaptionCoverage] = useState<"selective" | "all">("selective");
  const [captionMaxCount, setCaptionMaxCount] = useState("4");

  // ── Status flags ──
  const [publishDate, setPublishDate] = useState<string>("");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // ── Category hint (optional — AI is free to create a new one) ──
  const [categoryHint, setCategoryHint] = useState("");

  // ── Media / technical ──
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(true);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState("");
  const [galleryMappings, setGalleryMappings] = useState("");
  const [specsMappings, setSpecsMappings] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState("");

  // Debounce frequently changing values to reduce prompt recompute frequency
  const debouncedDraft = useDebounce(draft, 500);
  const debouncedOriginalContent = useDebounce(originalContent, 500);
  const debouncedModInstructions = useDebounce(modInstructions, 500);
  const debouncedNewsAngle = useDebounce(newsAngle, 500);
  const debouncedNewsSourceUrls = useDebounce(newsSourceUrls, 500);
  const debouncedHeroImage = useDebounce(heroImage, 300);
  const debouncedImages = useDebounce(images, 300);
  const debouncedImageGridMappings = useDebounce(imageGridMappings, 300);
  const debouncedGalleryMappings = useDebounce(galleryMappings, 300);
  const debouncedSpecsMappings = useDebounce(specsMappings, 300);
  // Debounce free-text fields that feed directly into the prompt to reduce
  // unnecessary recomputes while the user is still typing.
  const debouncedPublishDate = useDebounce(publishDate, 400);
  const debouncedCategoryHint = useDebounce(categoryHint, 400);

  // ── Output ──
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [resetPopoverOpen, setResetPopoverOpen] = useState(false);
  const [isOriginalLoading, setIsOriginalLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedBlockLine, setSelectedBlockLine] = useState<number | null>(
    null,
  );
  const [selectedBlockComment, setSelectedBlockComment] = useState("");

  const { notify } = useNotification();
  const downloadIds = useMemo(() => Object.keys(downloadLinks).sort(), []);
  const isIndonesianLocale = locale === "id";
  const seriesProfile = seriesBlueprint[seriesPhase];
  const seriesTarget = isIndonesianLocale
    ? seriesProfile.target.id
    : seriesProfile.target.en;
  const seriesTone = isIndonesianLocale
    ? seriesProfile.tone.id
    : seriesProfile.tone.en;
  const seriesContext = isIndonesianLocale
    ? seriesProfile.context.id
    : seriesProfile.context.en;
  const selectedArticleType = contentType === "notes" ? "note" : "blog";
  const noteIntentLabelMap: Record<NoteIntent, string> = {
    finding: dictionary.notesIntentFinding,
    reference: dictionary.notesIntentReference,
    "mini-fix": dictionary.notesIntentMiniFix,
    observation: dictionary.notesIntentObservation,
  };

  // ── Filtered article list ──
  const articlesForType = useMemo(
    () =>
      existingArticles.filter((article) => article.type === selectedArticleType),
    [existingArticles, selectedArticleType],
  );

  const articleStats = useMemo(() => {
    const total = articlesForType.length;
    const draft = articlesForType.filter((article) => !article.published).length;
    const published = total - draft;

    return { total, published, draft };
  }, [articlesForType]);

  const urgentDrafts = useMemo(
    () =>
      articlesForType
        .filter((article) => !article.published)
        .sort((a, b) => {
          const ageA = getDraftAgeDays(a.date) ?? -1;
          const ageB = getDraftAgeDays(b.date) ?? -1;
          return ageB - ageA;
        })
        .slice(0, 3),
    [articlesForType],
  );

  const specsGroups = useMemo(
    () =>
      debouncedSpecsMappings
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter((block) => block.length > 0),
    [debouncedSpecsMappings],
  );

  const staleDraftCount = useMemo(
    () =>
      articlesForType.filter((article) => {
        if (article.published) return false;
        const age = getDraftAgeDays(article.date);
        return age !== null && age >= 30;
      }).length,
    [articlesForType],
  );

  const filteredArticles = useMemo(() => {
    const q = articleSearch.trim().toLowerCase();

    return articlesForType.filter((article) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && article.published) ||
        (statusFilter === "draft" && !article.published);

      const matchesQuery =
        q === "" ||
        article.title.toLowerCase().includes(q) ||
        article.slug.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [articleSearch, articlesForType, statusFilter]);

  const selectedArticle = useMemo(
    () =>
      existingArticles.find(
        (article) =>
          article.slug === selectedSlug && article.type === selectedArticleType,
      ),
    [existingArticles, selectedArticleType, selectedSlug],
  );

  const selectedBlockRows = useMemo(() => {
    if (!selectedBlock) return 4;
    const lineCount = selectedBlock.split("\n").length;
    return Math.min(22, Math.max(4, lineCount + 1));
  }, [selectedBlock]);

  const handleOriginalSelection = useCallback(
    (event: SyntheticEvent<HTMLTextAreaElement>) => {
      if (mode !== "modify") return;

      const target = event.currentTarget;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;

      if (end <= start) {
        setSelectedBlock("");
        setSelectedBlockLine(null);
        return;
      }

      const picked = target.value.slice(start, end).trim();
      if (!picked) {
        setSelectedBlock("");
        setSelectedBlockLine(null);
        return;
      }

      const lineNumber = target.value.slice(0, start).split("\n").length;
      setSelectedBlock(picked);
      setSelectedBlockLine(lineNumber);

      window.setTimeout(() => {
        blockComposerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 30);
    },
    [mode],
  );

  const addSelectedBlockToInstructions = useCallback(() => {
    if (!selectedBlock) return;

    const compact = selectedBlock.replace(/\s+/g, " ").trim();
    const snippet = compact.length > 220 ? `${compact.slice(0, 220)}...` : compact;
    const lineLabel = selectedBlockLine ?? "?";
    const note = selectedBlockComment.trim() || "[describe exact change]";
    const blockInstruction = `- Target block (line ${lineLabel}): "${snippet}"\n  Change request: ${note}`;

    setModInstructions((prev) => (prev ? `${prev}\n${blockInstruction}` : blockInstruction));
    setSelectedBlockComment("");
    notify(
      "Selected block inserted into instructions",
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    );
    window.setTimeout(() => {
      const el = modInstructionsRef.current;
      if (!el) return;
      el.focus();
      el.scrollTop = el.scrollHeight;
    }, 50);
  }, [notify, selectedBlock, selectedBlockComment, selectedBlockLine]);

  useEffect(() => {
    if (!selectedSlug) return;

    const stillMatchesType = existingArticles.some(
      (article) =>
        article.slug === selectedSlug && article.type === selectedArticleType,
    );

    if (!stillMatchesType) {
      setSelectedSlug("");
    }
  }, [existingArticles, selectedArticleType, selectedSlug]);

  useEffect(() => {
    if (mode !== "modify") {
      setSelectedBlock("");
      setSelectedBlockLine(null);
      setSelectedBlockComment("");
      return;
    }

    setSelectedBlock("");
    setSelectedBlockLine(null);
    setSelectedBlockComment("");
  }, [mode, selectedSlug]);

  useEffect(() => {
    if (mode !== "modify") return;

    if (!selectedArticle) {
      setOriginalContent("");
      return;
    }

    const controller = new AbortController();
    const loadOriginalContent = async () => {
      try {
        setIsOriginalLoading(true);
        const params = new URLSearchParams({
          type: selectedArticle.type,
          slug: selectedArticle.slug,
          locale,
        });

        const res = await fetch(`/api/dev/prompt-content?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to load original content");
        }

        const data = (await res.json()) as { content?: string };
        setOriginalContent(data.content || "");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setOriginalContent("");
        notify(
          "Failed to load original content",
          <X className="h-4 w-4 text-destructive" />,
        );
      } finally {
        setIsOriginalLoading(false);
      }
    };

    loadOriginalContent();

    return () => controller.abort();
  }, [locale, mode, notify, selectedArticle]);

  // ── Text stats ──
  const counters = useMemo(() => {
    const text = mode === "modify" ? debouncedOriginalContent : debouncedDraft;
    const nonEmpty = text.trim();
    return {
      chars: text.length,
      words: nonEmpty === "" ? 0 : nonEmpty.split(/\s+/).length,
    };
  }, [debouncedDraft, debouncedOriginalContent, mode]);

  // ── Prompt char count ──
  const promptStats = useMemo(() => {
    const nonEmpty = generatedPrompt.trim();
    return {
      chars: generatedPrompt.length,
      words: nonEmpty === "" ? 0 : nonEmpty.split(/\s+/).length,
    };
  }, [generatedPrompt]);



  const sourceContent = mode === "modify" ? debouncedOriginalContent : debouncedDraft;
  const imageLines = useMemo(
    () => debouncedImages.split("\n").filter((line) => line.trim() !== ""),
    [debouncedImages],
  );

  const parsedCaptionMaxCount = useMemo(() => {
    const parsed = Number.parseInt(captionMaxCount, 10);
    if (!Number.isFinite(parsed)) return 4;
    return Math.min(12, Math.max(1, parsed));
  }, [captionMaxCount]);

  const unresolvedMarkers = useMemo(() => {
    const matches = sourceContent.match(/\{\{[^}]+\}\}/g) ?? [];
    const uniqueMarkers = Array.from(new Set(matches.map((marker) => marker.trim())));

    // Treat numbered content markers as valid placeholders handled by mapping rules.
    return uniqueMarkers.filter(
      (marker) => !/\{\{\s*(Link|Grid|Gallery|Specs)\s+\d+\s*\}\}/i.test(marker),
    );
  }, [sourceContent]);

  const hasUnresolvedMarkers = unresolvedMarkers.length > 0;

  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    const markerConfigs = [
      {
        label: "Link",
        enabled: showDownloads,
        count: downloadItems.filter((item) => item.value.trim() !== "").length,
      },
      {
        label: "Grid",
        enabled: showGrids,
        count: debouncedImageGridMappings.split("\n").filter((line) => line.trim() !== "").length,
      },
      {
        label: "Gallery",
        enabled: showGallery,
        count: debouncedGalleryMappings.split("\n").filter((line) => line.trim() !== "").length,
      },
      {
        label: "Specs",
        enabled: showSpecs,
        count: specsGroups.length,
      },
    ] as const;

    for (const config of markerConfigs) {
      const markerRegex = new RegExp(`\\{\\{\\s*${config.label}\\s+(\\d+)\\s*\\}\\}`, "gi");
      const matches = Array.from(sourceContent.matchAll(markerRegex));
      if (matches.length === 0) continue;

      const requestedIndexes = Array.from(
        new Set(
          matches
            .map((match) => Number(match[1]))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      ).sort((a, b) => a - b);

      if (!config.enabled) {
        issues.push({
          id: `${config.label.toLowerCase()}-feature-disabled`,
          severity: "error",
          title: `${config.label} marker found while feature is disabled`,
          description: `Source content references ${config.label} markers, but the ${config.label.toLowerCase()} feature is currently off.`,
        });
        continue;
      }

      const missingIndexes = requestedIndexes.filter((index) => index > config.count);
      if (missingIndexes.length > 0) {
        issues.push({
          id: `${config.label.toLowerCase()}-mapping-missing`,
          severity: "error",
          title: `${config.label} marker has no matching mapping`,
          description: `Referenced ${config.label} markers ${missingIndexes.map((index) => `{{${config.label} ${index}}}`).join(", ")} exceed the configured ${config.label.toLowerCase()} entries.`,
        });
      }
    }

    const openMarkerCount = (sourceContent.match(/\{\{/g) ?? []).length;
    const closeMarkerCount = (sourceContent.match(/\}\}/g) ?? []).length;
    if (openMarkerCount !== closeMarkerCount) {
      issues.push({
        id: "marker-brace-mismatch",
        severity: "error",
        title: "Placeholder braces look incomplete",
        description: "The source content contains mismatched '{{' and '}}' counts, which usually means a placeholder marker is broken.",
      });
    }

    const pairedTags = ["Gallery", "Steps", "Step", "Callout", "SpecList", "SpecItem", "details", "summary"];
    for (const tag of pairedTags) {
      const openTags = sourceContent.match(new RegExp(`<${tag}(?=[\\s>])[^>]*>`, "g")) ?? [];
      const selfClosingTags = sourceContent.match(new RegExp(`<${tag}(?=[\\s>])[^>]*/>`, "g")) ?? [];
      const closeTags = sourceContent.match(new RegExp(`</${tag}>`, "g")) ?? [];
      const effectiveOpenCount = openTags.length - selfClosingTags.length;

      if (effectiveOpenCount !== closeTags.length) {
        issues.push({
          id: `tag-balance-${tag.toLowerCase()}`,
          severity: "error",
          title: `<${tag}> tag count looks unbalanced`,
          description: `Found ${effectiveOpenCount} opening <${tag}> tag(s) and ${closeTags.length} closing </${tag}> tag(s) in the source content.`,
        });
      }
    }

    if (showGallery && debouncedGalleryMappings.trim() !== "" && !/\{\{\s*Gallery\s+\d+\s*\}\}/i.test(sourceContent)) {
      issues.push({
        id: "gallery-unused",
        severity: "warning",
        title: "Gallery entries are configured but not referenced",
        description: "Gallery mappings exist, but the source content does not reference any {{Gallery n}} marker.",
      });
    }

    if (showDownloads && downloadItems.some((item) => item.value.trim() !== "") && !/\{\{\s*Link\s+\d+\s*\}\}/i.test(sourceContent)) {
      issues.push({
        id: "downloads-unused",
        severity: "warning",
        title: "Download links are configured but not referenced",
        description: "Download entries exist, but the source content does not reference any {{Link n}} marker.",
      });
    }

    if (showImages && debouncedHeroImage.trim() !== "") {
      const heroPath = normalizeImagePath((debouncedHeroImage.split("|")[0] ?? "").trim());
      if (heroPath && sourceContent.includes(heroPath)) {
        issues.push({
          id: "hero-image-duplicated",
          severity: "warning",
          title: "Hero image path appears in body content",
          description: "Hero image is reserved for frontmatter. Remove it from article body unless you intentionally want duplicate rendering.",
        });
      }
    }

    if (mode === "create" && contentType === "news") {
      const validUrls = debouncedNewsSourceUrls.filter((url) => url.trim() !== "");
      if (validUrls.length === 0) {
        issues.push({
          id: "news-source-missing",
          severity: "error",
          title: "News mode requires at least one source URL",
          description: "Add at least one source URL before generating or copying the brief.",
        });
      }

      if (debouncedNewsAngle.trim() === "") {
        issues.push({
          id: "news-angle-empty",
          severity: "warning",
          title: "News angle is empty",
          description: "AI can still generate the brief, but without a clear SnipGeek angle the output may feel generic.",
        });
      }
    }

    return issues;
  }, [
    contentType,
    downloadItems,
    debouncedDraft,
    debouncedGalleryMappings,
    debouncedHeroImage,
    debouncedImageGridMappings,
    mode,
    debouncedNewsAngle,
    debouncedNewsSourceUrls,
    debouncedOriginalContent,
    showDownloads,
    showGallery,
    showGrids,
    showImages,
    showSpecs,
    sourceContent,
    specsGroups,
  ]);

  const blockingValidationIssues = useMemo(
    () => validationIssues.filter((issue) => issue.severity === "error"),
    [validationIssues],
  );

  const hasBlockingIssues = hasUnresolvedMarkers || blockingValidationIssues.length > 0;

  // ── Persist feature flags ──
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem("snipgeek-prompt-features");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setShowImages(p.showImages !== undefined ? !!p.showImages : true);
        setShowDownloads(!!p.showDownloads);
        setShowGrids(!!p.showGrids);
        setShowGallery(!!p.showGallery);
        setShowSpecs(!!p.showSpecs);
        setIsIdOnly(!!p.isIdOnly);
        setCaptionMode(p.captionMode === "off" || p.captionMode === "manual" ? p.captionMode : "auto");
        setCaptionAlignment(
          p.captionAlignment === "left" || p.captionAlignment === "right"
            ? p.captionAlignment
            : "center",
        );
        setCaptionCoverage(p.captionCoverage === "all" ? "all" : "selective");
        setCaptionMaxCount(
          typeof p.captionMaxCount === "string" && p.captionMaxCount.trim() !== ""
            ? p.captionMaxCount
            : "4",
        );
        setCategoryHint(typeof p.categoryHint === "string" ? p.categoryHint : "");
      } catch { }
    }
    const savedDraft = localStorage.getItem("snipgeek-prompt-draft");
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft);
        if (d.mode === "create" || d.mode === "modify") setMode(d.mode);
        if (["series", "news", "tips", "notes"].includes(d.contentType)) setContentType(d.contentType);
        if (typeof d.draft === "string") setDraft(d.draft);
        if (typeof d.publishDate === "string" && d.publishDate.trim() !== "") setPublishDate(d.publishDate);
        if (typeof d.heroImage === "string") setHeroImage(d.heroImage);
        if (typeof d.images === "string") setImages(d.images);
        if (typeof d.newsAngle === "string") setNewsAngle(d.newsAngle);
        if (Array.isArray(d.newsSourceUrls) && d.newsSourceUrls.length > 0) setNewsSourceUrls(d.newsSourceUrls);
        if (typeof d.modInstructions === "string") setModInstructions(d.modInstructions);
        if (typeof d.seriesPhase === "string" && ["phase-1","phase-2","phase-3","phase-4","phase-5"].includes(d.seriesPhase)) setSeriesPhase(d.seriesPhase as SeriesPhase);
        if (typeof d.seriesArticleNumber === "string") setSeriesArticleNumber(d.seriesArticleNumber);
        if (typeof d.noteIntent === "string" && ["finding","reference","mini-fix","observation"].includes(d.noteIntent)) setNoteIntent(d.noteIntent as NoteIntent);
        if (typeof d.tipsStandalone === "boolean") setTipsStandalone(d.tipsStandalone);
        if (typeof d.isPublished === "boolean") setIsPublished(d.isPublished);
        if (typeof d.isFeatured === "boolean") setIsFeatured(d.isFeatured);
        if (typeof d.imageGridMappings === "string") setImageGridMappings(d.imageGridMappings);
        if (typeof d.galleryMappings === "string") setGalleryMappings(d.galleryMappings);
        if (typeof d.specsMappings === "string") setSpecsMappings(d.specsMappings);
        if (typeof d.selectedSlug === "string") setSelectedSlug(d.selectedSlug);
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      "snipgeek-prompt-features",
      JSON.stringify({
        showImages,
        showDownloads,
        showGrids,
        showGallery,
        showSpecs,
        isIdOnly,
        captionMode,
        captionAlignment,
        captionCoverage,
        captionMaxCount,
        categoryHint,
      }),
    );
  }, [
    showImages,
    showDownloads,
    showGrids,
    showGallery,
    showSpecs,
    isIdOnly,
    captionMode,
    captionAlignment,
    captionCoverage,
    captionMaxCount,
    categoryHint,
    mounted,
  ]);

  // ── Persist draft content (anti-loss) ──
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      "snipgeek-prompt-draft",
      JSON.stringify({
        mode,
        contentType,
        draft,
        publishDate,
        heroImage,
        images,
        newsAngle,
        newsSourceUrls,
        modInstructions,
        seriesPhase,
        seriesArticleNumber,
        noteIntent,
        tipsStandalone,
        isPublished,
        isFeatured,
        imageGridMappings,
        galleryMappings,
        specsMappings,
        selectedSlug,
      }),
    );
  }, [
    mode,
    contentType,
    draft,
    publishDate,
    heroImage,
    images,
    newsAngle,
    newsSourceUrls,
    modInstructions,
    seriesPhase,
    seriesArticleNumber,
    noteIntent,
    tipsStandalone,
    isPublished,
    isFeatured,
    imageGridMappings,
    galleryMappings,
    specsMappings,
    selectedSlug,
    mounted,
  ]);

  // ── Auto-fill publish date +2 hari untuk create mode ──
  useEffect(() => {
    if (mode !== "create") return;
    setPublishDate((prev) => {
      if (prev.trim() !== "") return prev;
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  }, [mode]);

  // ── Build prompt ──
  const prompt = useMemo(() => {
    const isModify = mode === "modify";
    const normalizedUrls = debouncedNewsSourceUrls
      .map((url) => url.trim())
      .filter((url) => url !== "");
    const contentTypeLabel =
      contentType === "series"
        ? "SERIES"
        : contentType === "news"
          ? "NEWS / UPDATE"
          : contentType === "tips"
            ? "TIPS & TRICKS"
            : "NOTES / CATATAN";
    const outputFormat = contentType === "notes" ? "TECHNICAL NOTE" : "BLOG POST";
    const captionAlignmentClass =
      captionAlignment === "left"
        ? "text-left"
        : captionAlignment === "right"
          ? "text-right"
          : "text-center";

    let prompt = `**INTERNAL CONTENT BRIEF FOR SNIPGEEK AGENT**\n`;
    const activeSkills = ["content-generator", "snipgeek-blog-tone"];
    prompt += `**FOLLOWING SKILLS:** \`${activeSkills.join("`, `")}\` \n\n`;
    prompt += `**IMPORTANT:** Before generating content, you MUST read and understand all referenced skills above. They contain critical standards for MDX formatting, frontmatter requirements, and SnipGeek-specific conventions.\n\n`;

    prompt += `**1. MODE & TYPE**\n`;
    prompt += `- Action: ${isModify ? "MODIFY EXISTING" : "CREATE NEW"}\n`;
    prompt += `- Format: ${outputFormat}\n`;
    prompt += `- Workflow Type: ${contentTypeLabel}\n`;
    prompt += `- Language: ${isIdOnly ? "INDONESIAN ONLY" : "BILINGUAL (ID/EN)"}\n\n`;

    prompt += `**2. METADATA BRIEF**\n`;
    if (isModify && selectedSlug) {
      prompt += `- Target Slug: \`${selectedSlug}\`\n`;
      if (selectedArticle) {
        prompt += `- Current Status: ${selectedArticle.published ? "PUBLISHED" : "DRAFT"}\n`;
      }
    }

    const finalDate = debouncedPublishDate
      ? parseNaturalDate(debouncedPublishDate)
      : (isModify ? "[KEEP OR UPDATE]" : new Date().toISOString().split("T")[0]);

    prompt += `- Date: ${finalDate}\n`;
    if (isModify) {
      prompt += `- Updated: ${new Date().toISOString().split("T")[0]}\n`;
    }
    prompt += `- Status: ${isPublished ? "PUBLISHED" : "DRAFT"}${isFeatured ? " | FEATURED" : ""}\n`;
    prompt += `- Category Hint: ${debouncedCategoryHint || "[AI: AUTOMATIC]"}\n\n`;

    // ── Tag Registry: inject live tag list so AI prefers existing tags ──
    if (availableTags && availableTags.length > 0) {
      const tagList = availableTags
        .filter(t => t.count > 0)
        .slice(0, 50)
        .map(t => `${t.name}(${t.count})`)
        .join(", ");
      prompt += `**2A. EXISTING TAG REGISTRY**\n`;
      prompt += `Before inventing new tags, prefer selecting from this live list of tags already used in SnipGeek:\n`;
      prompt += `${tagList}\n`;
      prompt += `Format: tag-name(article-count). Higher count = more established tag. Still follow tag rules: kebab-case, min 3, max 6, include 1 platform tag.\n\n`;
    }

    if (!isModify) {
      if (contentType === "series") {
        prompt += `**SERIES CONTEXT BLOCK**\n`;
        prompt += `- Phase: ${seriesPhase}\n`;
        prompt += `- Series Article: ${seriesArticleNumber}\n`;
        prompt += `- Target Reader: ${seriesTarget}\n`;
        prompt += `- Tone Hint: ${seriesTone}\n`;
        prompt += `- Context: ${seriesContext}\n\n`;
      }

      if (contentType === "news") {
        prompt += `**NEWS SOURCE BLOCK**\n`;
        if (normalizedUrls.length > 0) {
          normalizedUrls.forEach((url, index) => {
            prompt += `- Source URL ${index + 1}: ${url}\n`;
          });
        } else {
          prompt += `- Source URLs: [MISSING]\n`;
        }
        prompt += `- Angle: ${debouncedNewsAngle.trim() || "[NOT PROVIDED]"}\n\n`;
      }

      if (contentType === "tips") {
        prompt += `**TIPS CONTEXT BLOCK**\n`;
        prompt += `- Standalone: ${tipsStandalone ? "TRUE" : "FALSE"}\n`;
        prompt += `- Goal: Deliver direct, practical, quick-to-apply guidance.\n\n`;
      }

      if (contentType === "notes") {
        prompt += `**NOTES CONTEXT BLOCK**\n`;
        prompt += `- Note Intent: ${noteIntentLabelMap[noteIntent]}\n`;
        prompt += `- Goal: Produce a concise, referenceable note with practical value and minimal filler.\n`;
        prompt += `- Routing: Save under _notes/{locale}/{YYYY-H1 or YYYY-H2}/ based on the article date (not _posts/{locale}/). E.g. _notes/en/2026-H1/slug.mdx for Jan–Jun 2026.\n\n`;
      }
    }

    const hasHeroImage = showImages && debouncedHeroImage.trim() !== "";
    const hasBodyImages = showImages && imageLines.length > 0;

    if (hasHeroImage || hasBodyImages) {
      prompt += `**3. ASSETS & MEDIA**\n`;
      if (hasHeroImage) {
        const heroParts = debouncedHeroImage.split("|").map((s) => s?.trim() || "");
        const heroPath = normalizeImagePath(heroParts[0] ?? "");
        const heroAlt = heroParts[1] ?? "";
        prompt += `- Hero Image (HERO ONLY): "${heroPath}"${heroAlt ? ` | Label: "${heroAlt}"` : ""} | Use only as frontmatter heroImage/banner. Do not insert into article body unless explicitly requested.\n`;
      }
      if (hasBodyImages) {
        imageLines.forEach((line, i) => {
          const parts = line.split("|").map((s) => s?.trim() || "");
          const imgPath = parts[0] ?? "";
          const imgAlt = parts[1] ?? "";
          const imgCaptionHint = parts[2] ?? "";
          const normalizedPath = normalizeImagePath(imgPath);
          prompt += `- Image ${i + 1}: "${normalizedPath}"${imgAlt ? ` | Label: "${imgAlt}"` : ""}${imgCaptionHint ? ` | Caption Hint: "${imgCaptionHint}"` : ""}\n`;
        });
      }
    }

    if (!isModify && hasBodyImages && captionMode !== "off") {
      prompt += `\n**3A. IMAGE CAPTION POLICY**\n`;
      prompt += `- Caption Mode: ${captionMode.toUpperCase()}\n`;
      prompt += `- Alignment: ${captionAlignment.toUpperCase()} (${captionAlignmentClass})\n`;
      prompt += `- Coverage: ${captionCoverage.toUpperCase()}\n`;
      prompt += `- Maximum Captions: ${parsedCaptionMaxCount}\n`;
      prompt += `- Hero rule: Never render caption for Image 1 in article body.\n`;

      if (captionMode === "auto") {
        prompt += `- Auto logic: prioritize captions for evidence-heavy screenshots (settings panels, verification outputs, before/after state, error/fix proof).\n`;
      }

      if (captionCoverage === "selective") {
        prompt += `- Selective mode: do not caption every image; caption only images that add technical clarity or proof.\n`;
      } else {
        prompt += `- All mode: caption every non-hero body image until max count is reached.\n`;
      }

      prompt += `- Caption format: add a single caption block directly below the selected image with one concise sentence.\n`;
      prompt += `- Caption block syntax: <div className="-mt-3 mb-6 ${captionAlignmentClass} text-sm italic text-muted-foreground">...</div>\n`;
    }

    if (showDownloads && downloadItems.length > 0) {
      prompt += `\n**4. DOWNLOAD LINKS**\n`;
      downloadItems.forEach((item, i) => {
        if (item.type === "id") {
          prompt += `- Link ${i + 1}: ID -> "${item.value}" (source marker: {{Link ${i + 1}}})\n`;
        } else {
          prompt += `- Link ${i + 1}: URL -> "${item.value}" (source marker: {{Link ${i + 1}}})\n`;
        }
      });
      prompt += `\n**DOWNLOAD COMPONENT RULES (MANDATORY — must follow for every Link above):**\n`;
      prompt += `- NEVER render download links as plain markdown anchor links (e.g. [text](url)) or raw <a> tags.\n`;
      prompt += `- ALWAYS use the SnipGeek \`<DownloadButton id="..." />\` component — this renders a proper download card with filename, filesize, and platform icon.\n`;
      prompt += `- For ID-type links: use the ID directly → \`<DownloadButton id="the-given-id" />\`\n`;
      prompt += `- For URL-type links: you MUST first register a new entry in \`src/lib/data-downloads.ts\` with a descriptive kebab-case ID, fileName, fileSize (estimate if unknown), externalUrl, and platform. Then reference it in MDX as \`<DownloadButton id="your-new-id" />\`. Include the full \`data-downloads.ts\` entry in your output so the author can paste it.\n`;
      prompt += `- Place the \`<DownloadButton />\` component exactly where the {{Link n}} marker appears in the source content.\n`;
    }

    if (showGrids && debouncedImageGridMappings) {
      prompt += `\n**5. IMAGE GRIDS**\n`;
      debouncedImageGridMappings.split("\n").filter(l => l.trim()).forEach((line, i) => {
        const [config, pathPart] = line.split("|").map(s => s.trim());
        if (config && pathPart) {
          const normalizedPaths = pathPart.split(",").map(p => normalizeImagePath(p.trim())).join(", ");
          prompt += `- Group ${i + 1}: ${config} | ${normalizedPaths} (source marker: {{Grid ${i + 1}}})\n`;
        } else {
          prompt += `- Group ${i + 1}: ${line} (source marker: {{Grid ${i + 1}}})\n`;
        }
      });
    }

    if (showGallery && debouncedGalleryMappings) {
      prompt += `\n**6. HERO GALLERIES**\n`;
      debouncedGalleryMappings.split("\n").filter(l => l.trim()).forEach((line, i) => {
        const [caption, pathPart] = line.split("|").map(s => s.trim());
        if (caption && pathPart) {
          const normalizedPaths = pathPart.split(",").map(p => normalizeImagePath(p.trim())).join(", ");
          prompt += `- Gallery ${i + 1}: ${caption} | ${normalizedPaths} (source marker: {{Gallery ${i + 1}}})\n`;
        } else {
          // If no | separator, assume it's just paths
          const normalizedPaths = line.split(",").map(p => normalizeImagePath(p.trim())).join(", ");
          prompt += `- Gallery ${i + 1}: ${normalizedPaths} (source marker: {{Gallery ${i + 1}}})\n`;
        }
      });
    }

    if (showSpecs && debouncedSpecsMappings.trim()) {
      prompt += `\n**7. SYSTEM REQUIREMENTS (RAW DATA)**\n`;
      prompt += `Parse the following raw text into <SpecList> and <SpecItem> blocks. Each line or block represents a spec group.\n`;
      prompt += `${debouncedSpecsMappings}\n`;
      prompt += `(Source markers: {{Specs 1}}, {{Specs 2}}, etc.)\n`;
    }

    if (showDownloads || showGrids || showGallery || showSpecs) {
      prompt += `\n**8. PLACEHOLDER RESOLUTION RULES**\n`;
      prompt += `- Treat {{Link n}}, {{Grid n}}, {{Gallery n}}, and {{Specs n}} as source markers only.\n`;
      prompt += `- In FINAL MDX output, resolve every marker into actual content/components at the correct position.\n`;
      prompt += `- **{{Link n}} → ALWAYS resolves to \`<DownloadButton id="..." />\`** — never a markdown link, never a raw <a> tag. See Section 4 for full rules.\n`;
      prompt += `- **{{Grid n}} → resolves to \`<ImageGrid columns={N}>\` block** with the mapped images.\n`;
      prompt += `- **{{Gallery n}} → resolves to \`<Gallery caption="...">\` block** with the mapped images.\n`;
      prompt += `- **{{Specs n}} → resolves to \`<SpecList>\` / \`<SpecItem>\` blocks** parsed from the raw spec data.\n`;
      prompt += `- Never leave raw {{...}} markers in final output.\n`;
      prompt += `- Ensure output is MDX-parse-safe (no invalid JS expressions such as raw moustache tokens).\n`;
    }

    if (hasHeroImage) {
      prompt += `- Hero image rule: Hero Image is reserved for frontmatter heroImage/banner only and must not be repeated inside article body unless explicitly requested.\n`;
    }

    prompt += `\n**9. SEO & HELPFUL CONTENT REQUIREMENTS**\n`;
    prompt += `- Match the primary search intent directly; do not open with generic filler.\n`;
    prompt += `- In the first 120 words, include a concise direct answer/outcome before deep explanation.\n`;
    prompt += `- Generate a strong SEO title (target ~55-65 chars) and meta description (target ~140-160 chars) that align with user intent.\n`;
    prompt += `- Keep one clear H1 and build scannable H2/H3 sections with practical progression.\n`;
    prompt += `- For tutorial/procedural posts, include: prerequisites, step-by-step actions, verification/check results, and common error fixes.\n`;
    prompt += `- Add 2-4 internal links to relevant SnipGeek content clusters (windows/ubuntu/tutorial/troubleshooting) where naturally useful.\n`;
    prompt += `- For version-specific or factual claims, anchor to reliable/official sources and avoid unverifiable assertions.\n`;
    prompt += `- Prefer concrete examples, command/output evidence, and practical caveats over abstract wording.\n`;
    prompt += `- Word-count is not fixed; ensure coverage is complete and non-repetitive for the topic complexity.\n`;
    prompt += `- If the topic is likely to age quickly, include a short freshness note (version/date context) in the narrative.\n`;

    prompt += `\n**10. READABILITY & PARAGRAPH RHYTHM (MANDATORY)**\n`;
    prompt += `- Target desktop readability: keep most body paragraphs around 3-4 lines in standard article width.\n`;
    prompt += `- Paragraph length target: ideally 45-85 words (soft cap 90 words).\n`;
    prompt += `- Maximum 2-3 sentences per paragraph for normal explanatory sections.\n`;
    prompt += `- One paragraph should carry one core idea only; split mixed ideas into separate paragraphs.\n`;
    prompt += `- If listing 3+ items, prefer bullets or component blocks over one long paragraph.\n`;
    prompt += `- After dense technical explanation, insert a short transition paragraph (1 sentence) when helpful for pacing.\n`;

    prompt += `\n**11. HUMAN VOICE & PERSONALITY (MANDATORY)**\n`;
    prompt += `- Write in **first person** throughout: "I" in English, "saya" in Indonesian. Never use "we" or impersonal phrasing like "users can" or "one should".\n`;
    prompt += `- Address the reader as **"you"** in English and **"kamu"** in Indonesian. Never use "Anda" or overly formal address forms.\n`;
    prompt += `- **BANNED generic openers** — never start with or near: "In this article", "This post will cover", "We will discuss", "In artikel ini", "Pada artikel ini", "Artikel ini akan membahas".\n`;
    prompt += `- **BANNED robotic transitions** — never use: "Furthermore", "In conclusion", "Moreover", "In addition", "It is worth noting", "Selain itu" as a filler opener, "Kesimpulannya" as a standalone transition.\n`;
    prompt += `- Opening must start with **personal context** — why the author tried this, what problem they were solving — before introducing technical details.\n`;
    prompt += `- Weave in **honest personal reactions** (moments of doubt, surprise, relief) between technical facts. This is what separates a blog from documentation.\n`;
    prompt += `- For **narrative and explanatory sections**, prefer prose over bullet lists. Only use bullets for sequential steps, checklists, or 3+ parallel items with no narrative link.\n`;
    prompt += `- The Indonesian version must be **re-narrated** naturally in Indonesian — not a line-by-line translation of the English. Same meaning, completely native phrasing.\n`;
    prompt += `- Every sentence must earn its place. No padding. No restating the same point with different words just to fill space.\n`;
    prompt += `- Close the article with a **light, warm call to action** — invite a comment, mention an alternative, or express a simple hope. Keep it brief and human.\n`;

    prompt += `\n**12. FINAL QA CHECKLIST (MUST PASS BEFORE RETURNING OUTPUT)**\n`;
    prompt += `- No oversized paragraph that breaks desktop reading rhythm unless clearly justified.\n`;
    prompt += `- No unresolved source markers like {{...}} left in final MDX.\n`;
    prompt += `- No invalid MDX/HTML structure (unbalanced custom tags/components).\n`;
    prompt += `- Intro delivers direct answer/outcome early, then expands with practical context.\n`;
    prompt += `- Sections remain scannable, non-repetitive, and aligned with search intent.\n`;
    prompt += `- Opening is personal and specific — not generic or documentation-style.\n`;
    prompt += `- No banned openers or robotic transitions appear anywhere in the article.\n`;
    prompt += `- First person voice is consistent in both English and Indonesian versions.\n`;
    prompt += `- Indonesian version reads naturally as native Indonesian — not translated from English.\n`;
    prompt += `- At least one moment of personal reaction (doubt, surprise, realisation) is present in narrative sections.\n`;

    prompt += `\n---\n\n`;
    if (isModify) {
      prompt += `**ORIGINAL CONTENT:**\n${debouncedOriginalContent || "[MISSING]"}\n\n`;
      prompt += `**MODIFICATION INSTRUCTIONS:**\n${debouncedModInstructions || "Follow instructions exactly."}\n`;
    } else {
      if (contentType === "series") {
        prompt += `**SERIES KEY POINTS (INPUT):**\n${debouncedDraft || "[MISSING]"}\n`;
      } else if (contentType === "news") {
        prompt += `**NEWS ANALYSIS NOTES (INPUT):**\n${debouncedDraft || "[OPTIONAL]"}\n`;
      } else if (contentType === "notes") {
        prompt += `**NOTES INPUT (KEY POINTS / RAW FINDINGS):**\n${debouncedDraft || "[MISSING]"}\n`;
      } else {
        prompt += `**TIPS KEY POINTS (INPUT):**\n${debouncedDraft || "[MISSING]"}\n`;
      }
    }

    prompt += `\n---\n**FINAL INSTRUCTION:** Generate the full MDX following the SnipGeek skills assigned above. `;
    prompt += `Use \`snipgeek-blog-tone\` for narrative depth, personal voice, and bilingual storytelling, while ensuring \`content-generator\` technical standards are strictly met. `;
    prompt += `**Voice enforcement:** Write in first person ("I"/"saya"), address the reader as "you"/"kamu", never open with generic phrases like "In this article" or "Artikel ini akan membahas", and never use robotic transitions like "Furthermore" or "In conclusion". The Indonesian version must be fully re-narrated in native Indonesian — not translated sentence by sentence from English. Include at least one honest personal moment (doubt, surprise, or discovery) in the narrative to make it feel genuine, not polished. `;
    if (!isModify && contentType !== "notes") {
      prompt += `Opening paragraph must begin with personal context or a real situation the author experienced — pull the reader in before introducing any technical detail. `;
    }
    if (!isModify && contentType === "news") {
      prompt += `Fetch all listed source URLs, extract only relevant facts, then rewrite in original SnipGeek voice with a clear "SnipGeek's take" section based on the provided angle. `;
    }
    if (!isModify && (contentType === "series" || contentType === "tips")) {
      prompt += `Expand the provided key points into complete, practical sections with implementation details, warnings, and checks. `;
    }
    if (!isModify && contentType === "notes") {
      prompt += `Convert the input into a compact technical note: keep it concise, factual, and easy to scan, and avoid stretching it into long-form blog narrative. `;
    }
    if (isModify) {
      prompt += `Treat **MODIFICATION INSTRUCTIONS** as the single source of truth. When instructions include "Target block (line X)", apply edits to those referenced blocks only. For all untouched sections, preserve the original wording, structure, language, and tone exactly as-is. Do not perform global rewrites unless explicitly requested in the instructions. The same rule applies for both English and Indonesian source content. `;
      prompt += `For readability-only passes in modify mode, prioritize paragraph splits over sentence rewrites: keep claims, facts, and wording intact as much as possible, and only break dense paragraphs into shorter blocks that follow the paragraph rhythm rules. `;
      prompt += `When splitting paragraphs, do not remove factual details, do not soften key caveats, and do not change technical meaning. `;
    }
    prompt += `If source markers ({{Link n}}, {{Grid n}}, {{Gallery n}}, {{Specs n}}) are present, replace them with concrete MDX output and do not keep marker text in the final file. `;
    if (!isModify && hasBodyImages && captionMode !== "off") {
      prompt += `Apply the Image Caption Policy section deterministically. Avoid captioning decorative/redundant images in selective mode, keep each caption to one sentence, and place it directly under the image using the required class alignment. `;
    }
    prompt += `For procedural or tutorial sections, use custom MDX components \`<Steps>\` and \`<Step>\` instead of plain numbered markdown lists. `;
    if (hasHeroImage) {
      prompt += `Set the hero image as frontmatter heroImage/banner and do not render it again in article body unless explicitly requested. `;
    }
    prompt += `Ensure all metadata (slugs, translation keys, alt texts) are generated automatically. Tags must never contain spaces and must never produce %20 in URLs. Any tag that would produce %20 is invalid and must be rewritten into lowercase kebab-case (e.g., windows-11, clean-install, ui-design, ubuntu-25-10). Always include 1 platform tag (windows/ubuntu/linux/android/hardware) and 1 versioned tag if the article targets a specific OS version (e.g., windows-11, ubuntu-25-10). Minimum 3 tags, maximum 6 tags per article. `;
    prompt += `Run a final self-check against the readability rhythm rules and the QA checklist before returning final MDX. `;
    prompt += `Ensure the output is genuinely helpful, intent-focused, and clearly better than a generic rewrite.`;

    return prompt;
  }, [
    mode,
    debouncedDraft,
    debouncedOriginalContent,
    debouncedModInstructions,
    debouncedNewsAngle,
    debouncedNewsSourceUrls,
    debouncedPublishDate,
    isPublished,
    isFeatured,
    isIdOnly,
    debouncedHeroImage,
    debouncedImages,
    contentType,
    downloadItems,
    debouncedImageGridMappings,
    debouncedGalleryMappings,
    showDownloads,
    showGrids,
    showGallery,
    showImages,
    showSpecs,
    debouncedSpecsMappings,
    selectedSlug,
    seriesArticleNumber,
    seriesContext,
    seriesPhase,
    seriesTarget,
    seriesTone,
    debouncedCategoryHint,
    selectedArticle,
    tipsStandalone,
    noteIntent,
    noteIntentLabelMap,
    captionMode,
    captionAlignment,
    captionCoverage,
    parsedCaptionMaxCount,
    imageLines,
    availableTags,
  ]);

  // Update generatedPrompt when the memoized prompt changes
  useEffect(() => {
    setGeneratedPrompt(prompt);
  }, [prompt]);

  // ── Handlers ──
  const writeClipboard = useCallback(
    async (value: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(value);
        notify(successMessage, <Check className="h-4 w-4 text-emerald-400" />);
        return true;
      } catch {
        // Desktop fallback when Clipboard API is blocked by permissions.
        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        try {
          const ok = document.execCommand("copy");
          document.body.removeChild(area);
          if (ok) {
            notify(successMessage, <Check className="h-4 w-4 text-emerald-400" />);
            return true;
          }
        } catch {
          document.body.removeChild(area);
        }
        notify(
          "Clipboard blocked. Copy manually.",
          <X className="h-4 w-4 text-destructive" />,
        );
        return false;
      }
    },
    [notify],
  );

  const handleCopy = async () => {
    if (hasBlockingIssues) {
      const issueSummary = [
        ...(hasUnresolvedMarkers ? [`unresolved markers: ${unresolvedMarkers.join(", ")}`] : []),
        ...blockingValidationIssues.map((issue) => issue.title),
      ].slice(0, 3);

      notify(
        `Resolve issues before copying: ${issueSummary.join(" | ")}`,
        <AlertTriangle className="h-4 w-4 text-destructive" />,
      );
      return;
    }

    const copied = await writeClipboard(generatedPrompt, dictionary.copiedButton);
    if (!copied) return;
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = useCallback(() => {
    setDraft("");
    setOriginalContent("");
    setModInstructions("");
    setPublishDate("");
    setHeroImage("");
    setImages("");
    setNewsAngle("");
    setNewsSourceUrls([""]);
    setImageGridMappings("");
    setGalleryMappings("");
    setSpecsMappings("");
    setSelectedSlug("");
    setDownloadItems([]);
    setCategoryHint("");
    
    notify(
      "Session cleared. Ready for a new brief.",
      <Trash2 className="h-4 w-4 text-emerald-500" />
    );
    setResetPopoverOpen(false);
  }, [notify]);

  const addDownloadItem = () =>
    setDownloadItems([
      ...downloadItems,
      { id: generateUUID(), type: "id", value: "" },
    ]);

  const addNewsSourceUrl = () => {
    if (newsSourceUrls.length >= 3) return;
    setNewsSourceUrls((prev) => [...prev, ""]);
  };

  const removeNewsSourceUrl = (index: number) => {
    setNewsSourceUrls((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_item, currentIndex) => currentIndex !== index);
    });
  };

  const updateNewsSourceUrl = (index: number, value: string) => {
    setNewsSourceUrls((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? value : item,
      ),
    );
  };

  const removeDownloadItem = (id: string) =>
    setDownloadItems(downloadItems.filter((item) => item.id !== id));
  const updateDownloadItem = (id: string, updates: Partial<DownloadItem>) =>
    setDownloadItems(
      downloadItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    );

  const applyQuickAction = (action: QuickActionKey) => {
    let text = "";
    switch (action) {
      case "readability":
        text = "Readability-only pass: split dense paragraphs to maintain desktop rhythm (target 3-4 lines, ~45-85 words, max 2-3 sentences per paragraph). Preserve facts, claims, technical meaning, and tone. Prefer paragraph breaks over sentence rewrites.";
        break;
      case "narrative":
        text = dictionary.quickActions.narrative;
        break;
      case "images":
        text = dictionary.quickActions.images;
        break;
      case "metadata":
        text = dictionary.quickActions.metadata;
        break;
      case "polish":
        text = dictionary.quickActions.polish;
        break;
    }
    setModInstructions((prev) => (prev ? `${prev}\n- ${text}` : `- ${text}`));
    window.setTimeout(() => {
      const el = modInstructionsRef.current;
      if (!el) return;
      el.focus();
      el.scrollTop = el.scrollHeight;
    }, 20);
  };

  const getQuickActionLabel = useCallback(
    (action: QuickActionKey) => {
      switch (action) {
        case "readability":
          return "Readability pass";
        case "narrative":
          return dictionary.quickActions.narrative;
        case "images":
          return dictionary.quickActions.images;
        case "metadata":
          return dictionary.quickActions.metadata;
        case "polish":
          return dictionary.quickActions.polish;
      }
    },
    [dictionary.quickActions],
  );

  const copyLinkCaller = useCallback(async (index: number) => {
    await writeClipboard(`{{Link ${index + 1}}}`, `Link ${index + 1} caller copied`);
  }, [writeClipboard]);

  const copyGridCaller = useCallback(async (index: number) => {
    await writeClipboard(`{{Grid ${index + 1}}}`, `Grid ${index + 1} caller copied`);
  }, [writeClipboard]);

  const copyGalleryCaller = useCallback(async (index: number) => {
    await writeClipboard(`{{Gallery ${index + 1}}}`, `Gallery ${index + 1} caller copied`);
  }, [writeClipboard]);


  const copySpecCaller = useCallback(async (index: number) => {
    await writeClipboard(`{{Specs ${index + 1}}}`, `Specs ${index + 1} caller copied`);
  }, [writeClipboard]);

  const focusRing =
    "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";


  return {
    mode, setMode, contentType, setContentType,
    seriesPhase, setSeriesPhase,
    seriesArticleNumber, setSeriesArticleNumber,
    newsSourceUrls, setNewsSourceUrls, newsAngle, setNewsAngle,
    tipsStandalone, setTipsStandalone, noteIntent, setNoteIntent,
    selectedSlug, setSelectedSlug, articleSearch, setArticleSearch,
    statusFilter, setStatusFilter, draft, setDraft,
    originalContent, setOriginalContent, modInstructions, setModInstructions,
    showImages, setShowImages, showDownloads, setShowDownloads, showGrids, setShowGrids, showGallery, setShowGallery, showSpecs, setShowSpecs, isIdOnly, setIsIdOnly,
    captionMode, setCaptionMode, captionAlignment, setCaptionAlignment, captionCoverage, setCaptionCoverage, captionMaxCount, setCaptionMaxCount,
    publishDate, setPublishDate, isPublished, setIsPublished, isFeatured, setIsFeatured, categoryHint, setCategoryHint, isTechnicalExpanded, setIsTechnicalExpanded,
    downloadItems, setDownloadItems, imageGridMappings, setImageGridMappings, galleryMappings, setGalleryMappings, specsMappings, setSpecsMappings, heroImage, setHeroImage, images, setImages,
    generatedPrompt, setGeneratedPrompt, isCopied, setIsCopied, resetPopoverOpen, setResetPopoverOpen, isOriginalLoading, setIsOriginalLoading,
    selectedBlock, setSelectedBlock, selectedBlockLine, setSelectedBlockLine, selectedBlockComment, setSelectedBlockComment,
    originalContentRef, modInstructionsRef, blockComposerRef,
    dictionary, fullDictionary, existingArticles, locale, availableTags,
    articlesForType, articleStats, urgentDrafts, specsGroups, staleDraftCount, filteredArticles, selectedArticle, selectedBlockRows,
    handleOriginalSelection, addSelectedBlockToInstructions,
    counters, promptStats, imageLines, parsedCaptionMaxCount, unresolvedMarkers, hasUnresolvedMarkers, validationIssues, blockingValidationIssues, hasBlockingIssues,
    writeClipboard, handleCopy, handleReset, addDownloadItem, addNewsSourceUrl, removeNewsSourceUrl, updateNewsSourceUrl, removeDownloadItem, updateDownloadItem,
    applyQuickAction, getQuickActionLabel, copyLinkCaller, copyGridCaller, copyGalleryCaller, copySpecCaller,
    downloadIds, isIndonesianLocale, seriesProfile, seriesTarget, seriesTone, seriesContext, selectedArticleType, noteIntentLabelMap,
    seriesPhaseOptions, seriesArticleOptions, noteIntentOptions
  };
}
