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
  Terminal,
  Type,
  Star,
  Hash,
  AlignLeft,
  Sparkles,
  Layers,
  PenLine,
  Settings2,
  FileText,
  StickyNote,
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
  contentTypeBlog: string;
  contentTypeNote: string;
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

type QuickActionKey = "narrative" | "images" | "metadata" | "polish";

const toTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const getDraftAgeDays = (value: string) => {
  const timestamp = toTimestamp(value);
  if (!Number.isFinite(timestamp)) return null;

  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - timestamp) / dayMs));
};

// ──────────────────────────────────────────────────────────────────────────────
// Utility: Parse natural date strings (id/en) into YYYY-MM-DD
// Examples to handle: "07 Maret 2026", "2 Jan 25", "2024/05/12", etc.
// ──────────────────────────────────────────────────────────────────────────────
const parseNaturalDate = (input: string): string => {
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

interface ToolPromptsProps {
  dictionary: ToolPromptsDictionary;
  existingArticles: ArticleSummary[];
  fullDictionary: Dictionary;
  locale: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Feature flag pill — reusable toggle button
// ──────────────────────────────────────────────────────────────────────────────
function FeaturePill({
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
    <SnipTooltip label={label} side="top">
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
function DownloadIdPicker({
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
export function ToolPrompts({
  dictionary,
  existingArticles,
  fullDictionary,
  locale,
}: ToolPromptsProps) {
  const [mounted, setMounted] = useState(false);
  const originalContentRef = useRef<HTMLTextAreaElement>(null);
  const modInstructionsRef = useRef<HTMLTextAreaElement>(null);
  const blockComposerRef = useRef<HTMLDivElement>(null);

  // ── Mode & content type ──
  const [mode, setMode] = useState<"create" | "modify">("create");
  const [contentType, setContentType] = useState<"blog" | "note">("blog");

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

  // ── Status flags ──
  const [publishDate, setPublishDate] = useState<string>("");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOutputVisible, setIsOutputVisible] = useState(true);

  // ── Category hint (optional — AI is free to create a new one) ──
  const [categoryHint, setCategoryHint] = useState("");

  // ── Media / technical ──
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(true);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [imageGridMappings, setImageGridMappings] = useState("");
  const [galleryMappings, setGalleryMappings] = useState("");
  const [specsMappings, setSpecsMappings] = useState("");
  const [images, setImages] = useState("");

  // ── Output ──
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isOriginalLoading, setIsOriginalLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedBlockLine, setSelectedBlockLine] = useState<number | null>(
    null,
  );
  const [selectedBlockComment, setSelectedBlockComment] = useState("");

  const { notify } = useNotification();
  const downloadIds = useMemo(() => Object.keys(downloadLinks).sort(), []);

  // ── Filtered article list ──
  const articlesForType = useMemo(
    () => existingArticles.filter((article) => article.type === contentType),
    [contentType, existingArticles],
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
      specsMappings
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter((block) => block.length > 0),
    [specsMappings],
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
          article.slug === selectedSlug && article.type === contentType,
      ),
    [contentType, existingArticles, selectedSlug],
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
      (article) => article.slug === selectedSlug && article.type === contentType,
    );

    if (!stillMatchesType) {
      setSelectedSlug("");
    }
  }, [contentType, existingArticles, selectedSlug]);

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
    const text = mode === "modify" ? originalContent : draft;
    const nonEmpty = text.trim();
    return {
      chars: text.length,
      words: nonEmpty === "" ? 0 : nonEmpty.split(/\s+/).length,
      lines: text.split("\n").filter((l) => l.trim() !== "").length,
    };
  }, [draft, originalContent, mode]);

  // ── Prompt char count ──
  const promptStats = useMemo(() => {
    const nonEmpty = generatedPrompt.trim();
    return {
      chars: generatedPrompt.length,
      words: nonEmpty === "" ? 0 : nonEmpty.split(/\s+/).length,
    };
  }, [generatedPrompt]);

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
        setIsOutputVisible(p.isOutputVisible !== undefined ? !!p.isOutputVisible : true);
        setCategoryHint(typeof p.categoryHint === "string" ? p.categoryHint : "");
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
        isOutputVisible,
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
    isOutputVisible,
    categoryHint,
    mounted,
  ]);

  // ── Build prompt ──
  useEffect(() => {
    const isBlog = contentType === "blog";
    const isModify = mode === "modify";

    let prompt = `**INTERNAL CONTENT BRIEF FOR SNIPGEEK AGENT**\n`;
    const activeSkills = isBlog ? ["content-generator", "snipgeek-blog-tone"] : ["content-generator"];
    prompt += `**FOLLOWING SKILLS:** \`${activeSkills.join("`, `")}\`\n\n`;

    prompt += `**1. MODE & TYPE**\n`;
    prompt += `- Action: ${isModify ? "MODIFY EXISTING" : "CREATE NEW"}\n`;
    prompt += `- Format: ${isBlog ? "BLOG POST" : "TECHNICAL NOTE"}\n`;
    prompt += `- Language: ${isIdOnly ? "INDONESIAN ONLY" : "BILINGUAL (ID/EN)"}\n\n`;

    prompt += `**2. METADATA BRIEF**\n`;
    if (isModify && selectedSlug) {
      prompt += `- Target Slug: \`${selectedSlug}\`\n`;
      if (selectedArticle) {
        prompt += `- Current Status: ${selectedArticle.published ? "PUBLISHED" : "DRAFT"}\n`;
      }
    }

    const finalDate = publishDate
      ? parseNaturalDate(publishDate)
      : (isModify ? "[KEEP OR UPDATE]" : new Date().toISOString().split("T")[0]);

    prompt += `- Date: ${finalDate}\n`;
    if (isModify) {
      prompt += `- Updated: ${new Date().toISOString().split("T")[0]}\n`;
    }
    prompt += `- Status: ${isPublished ? "PUBLISHED" : "DRAFT"}${isFeatured && isBlog ? " | FEATURED" : ""}\n`;
    prompt += `- Category Hint: ${categoryHint || "[AI: AUTOMATIC]"}\n\n`;

    const imageLines = images.split("\n").filter((l) => l.trim() !== "");
    if (showImages && imageLines.length > 0) {
      prompt += `**3. ASSETS & MEDIA**\n`;
      imageLines.forEach((line, i) => {
        const [imgPath, imgAlt] = line.split("|").map(s => s?.trim() || "");
        const normalizedPath = normalizeImagePath(imgPath);
        prompt += `- Image ${i + 1}: "${normalizedPath}" ${imgAlt ? `| Label: "${imgAlt}"` : ""}\n`;
      });
    }

    if (showDownloads && downloadItems.length > 0) {
      prompt += `\n**4. DOWNLOAD LINKS**\n`;
      downloadItems.forEach((item, i) => {
        prompt += `- Link ${i + 1}: ${item.type.toUpperCase()} -> "${item.value}" (use {{Link ${i + 1}}} in draft)\n`;
      });
    }

    if (showGrids && imageGridMappings) {
      prompt += `\n**5. IMAGE GRIDS**\n`;
      imageGridMappings.split("\n").filter(l => l.trim()).forEach((line, i) => {
        const [config, pathPart] = line.split("|").map(s => s.trim());
        if (config && pathPart) {
          const normalizedPaths = pathPart.split(",").map(p => normalizeImagePath(p.trim())).join(", ");
          prompt += `- Group ${i + 1}: ${config} | ${normalizedPaths} (use {{Grid ${i + 1}}} in draft)\n`;
        } else {
          prompt += `- Group ${i + 1}: ${line} (use {{Grid ${i + 1}}} in draft)\n`;
        }
      });
    }

    if (showGallery && galleryMappings) {
      prompt += `\n**6. HERO GALLERIES**\n`;
      galleryMappings.split("\n").filter(l => l.trim()).forEach((line, i) => {
        const [caption, pathPart] = line.split("|").map(s => s.trim());
        if (caption && pathPart) {
          const normalizedPaths = pathPart.split(",").map(p => normalizeImagePath(p.trim())).join(", ");
          prompt += `- Gallery ${i + 1}: ${caption} | ${normalizedPaths} (use {{Gallery ${i + 1}}} in draft)\n`;
        } else {
          // If no | separator, assume it's just paths
          const normalizedPaths = line.split(",").map(p => normalizeImagePath(p.trim())).join(", ");
          prompt += `- Gallery ${i + 1}: ${normalizedPaths} (use {{Gallery ${i + 1}}} in draft)\n`;
        }
      });
    }

    if (showSpecs && specsMappings.trim()) {
      prompt += `\n**7. SYSTEM REQUIREMENTS (RAW DATA)**\n`;
      prompt += `Parse the following raw text into <SpecList> and <SpecItem> blocks. Each line or block represents a spec group.\n`;
      prompt += `${specsMappings}\n`;
      prompt += `(Use {{Specs 1}}, {{Specs 2}}, etc. placeholders from the draft to place these spec sheets)\n`;
    }

    prompt += `\n---\n\n`;
    if (isModify) {
      prompt += `**ORIGINAL CONTENT:**\n${originalContent || "[MISSING]"}\n\n`;
      prompt += `**MODIFICATION INSTRUCTIONS:**\n${modInstructions || "Follow instructions exactly."}\n`;
    } else {
      prompt += `**DRAFT/CONTENT SOURCE:**\n${draft || "[MISSING]"}\n`;
    }

    prompt += `\n---\n**FINAL INSTRUCTION:** Generate the full MDX following the SnipGeek skills assigned above. `;
    if (isBlog) {
      prompt += `Use \`snipgeek-blog-tone\` for narrative depth, personal voice, and bilingual storytelling, while ensuring \`content-generator\` technical standards are strictly met. `;
    }
    if (isModify) {
      prompt += `Treat **MODIFICATION INSTRUCTIONS** as the single source of truth. When instructions include "Target block (line X)", apply edits to those referenced blocks only. For all untouched sections, preserve the original wording, structure, language, and tone exactly as-is. Do not perform global rewrites unless explicitly requested in the instructions. The same rule applies for both English and Indonesian source content. `;
    }
    prompt += `For procedural or tutorial sections, use custom MDX components \`<Steps>\` and \`<Step>\` instead of plain numbered markdown lists. `;
    prompt += `Ensure all metadata (slugs, translation keys, alt texts) are generated automatically. Tags must never contain spaces and must never produce %20 in URLs. Any tag that would produce %20 is invalid and must be rewritten into lowercase kebab-case (e.g., windows-11, clean-install, ui-design, ubuntu-25-10). Always include 1 platform tag (windows/ubuntu/linux/android/hardware) and 1 versioned tag if the article targets a specific OS version (e.g., windows-11, ubuntu-25-10). Minimum 3 tags, maximum 6 tags per article.`;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeneratedPrompt(prompt);
  }, [
    mode,
    draft,
    originalContent,
    modInstructions,
    publishDate,
    isPublished,
    isFeatured,
    isIdOnly,
    images,
    contentType,
    downloadItems,
    imageGridMappings,
    galleryMappings,
    showDownloads,
    showGrids,
    showGallery,
    showImages,
    showSpecs,
    specsMappings,
    selectedSlug,
    categoryHint,
    selectedArticle,
  ]);

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
    const copied = await writeClipboard(generatedPrompt, dictionary.copiedButton);
    if (!copied) return;
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const addDownloadItem = () =>
    setDownloadItems([
      ...downloadItems,
      { id: generateUUID(), type: "id", value: "" },
    ]);
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

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <ToolWrapper
      title={dictionary.title}
      description={dictionary.description}
      dictionary={fullDictionary}
      isPublic={true}
    >

      <div className="max-w-full mx-auto space-y-6">
        {/* ── ISLAND-STYLE TOOLBAR ── */}
        <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Island 1: Mode & Content Type */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="bg-card/50 backdrop-blur-lg border border-primary/10 shadow-sm rounded-xl p-1.5 flex items-center gap-1.5"
            >
              {/* Mode group: no inner padding so w-1/2 = exactly w-10 */}
              <div className="relative flex items-center">
                <SnipTooltip label={dictionary.modes.create} side="top">
                  <button
                    type="button"
                    aria-label={dictionary.modes.create}
                    aria-pressed={mode === "create"}
                    onClick={() => setMode("create")}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-9 rounded-md transition-colors duration-200 z-10",
                      mode === "create" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                    )}
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                </SnipTooltip>

                <SnipTooltip label={dictionary.modes.modify} side="top">
                  <button
                    type="button"
                    aria-label={dictionary.modes.modify}
                    aria-pressed={mode === "modify"}
                    onClick={() => setMode("modify")}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-9 rounded-md transition-colors duration-200 z-10",
                      mode === "modify" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                    )}
                  >
                    <Layers className="h-4 w-4" />
                  </button>
                </SnipTooltip>
                <motion.div
                  className="absolute inset-y-0 w-1/2 bg-background border border-primary/5 rounded-md shadow-sm z-0"
                  animate={{ x: mode === "modify" ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              </div>

              <div className="w-px h-5 bg-primary/10 self-center" />

              {/* Content type group: same no-inner-padding approach */}
              <div className="relative flex items-center">
                <SnipTooltip label={dictionary.contentTypeBlog} side="top">
                  <button
                    type="button"
                    aria-label={dictionary.contentTypeBlog}
                    aria-pressed={contentType === "blog"}
                    onClick={() => setContentType("blog")}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-9 rounded-md transition-colors duration-200 z-10",
                      contentType === "blog" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </SnipTooltip>

                <SnipTooltip label={dictionary.contentTypeNote} side="top">
                  <button
                    type="button"
                    aria-label={dictionary.contentTypeNote}
                    aria-pressed={contentType === "note"}
                    onClick={() => setContentType("note")}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-9 rounded-md transition-colors duration-200 z-10",
                      contentType === "note" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                    )}
                  >
                    <StickyNote className="h-4 w-4" />
                  </button>
                </SnipTooltip>
                <motion.div
                  className="absolute inset-y-0 w-1/2 bg-background border border-primary/5 rounded-md shadow-sm z-0"
                  animate={{ x: contentType === "note" ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              </div>
            </motion.div>

            {/* Island 2: Date & Status */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="bg-card/50 backdrop-blur-lg border border-primary/10 shadow-sm rounded-xl p-1.5 flex items-center gap-3"
            >
              <div className="flex items-center gap-2.5 px-3.5 h-10 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 pr-3.5 border-r border-primary/10">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <Input
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    placeholder={mode === "modify" ? "DATE" : "YYYY-MM-DD"}
                    className="h-8 w-32 border-none bg-transparent text-[11px] font-bold px-0 focus-visible:ring-0 placeholder:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-3.5 pl-0.5">
                  <div className="flex items-center gap-2.5">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isPublished ? "live" : "draft"}
                        initial={{ opacity: 0, y: -7 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 7 }}
                        transition={{ duration: 0.14, ease: "easeOut" }}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-tighter",
                          isPublished ? "text-emerald-500" : "text-muted-foreground"
                        )}
                      >
                        {isPublished ? "LIVE" : "DRAFT"}
                      </motion.span>
                    </AnimatePresence>
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                      className="scale-75 data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {contentType === "blog" && (
                      <motion.div
                        key="featured-toggle"
                        initial={{ opacity: 0, x: 10, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "auto" }}
                        exit={{ opacity: 0, x: 10, width: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        <motion.span
                          animate={
                            isFeatured
                              ? { rotate: [0, 20, -12, 0], scale: [1, 1.4, 1] }
                              : { rotate: 0, scale: 1 }
                          }
                          transition={{ duration: 0.4, ease: "backOut" }}
                          className="flex"
                        >
                          <Star className={cn(
                            "h-3.5 w-3.5 transition-colors duration-300",
                            isFeatured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                          )} />
                        </motion.span>
                        <Switch
                          checked={isFeatured}
                          onCheckedChange={setIsFeatured}
                          className="scale-75 data-[state=checked]:bg-amber-500"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-primary/10">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <Input
                      value={categoryHint}
                      onChange={(e) => setCategoryHint(e.target.value)}
                      placeholder="Category hint"
                      className="h-8 w-32 border-none bg-transparent px-0 text-[10px] font-bold focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Island 3: Feature Toggles */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.16, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex items-center gap-1.5 p-1.5 rounded-xl border border-primary/10 bg-card/50 backdrop-blur-lg shadow-sm"
            >
              <FeaturePill
                active={showImages}
                onClick={() => setShowImages(!showImages)}
                icon={ImageIcon}
                label="Images"
                activeClass="bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              />
              <FeaturePill
                active={showDownloads}
                onClick={() => setShowDownloads(!showDownloads)}
                icon={Download}
                label="Downloads"
                activeClass="bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              />
              <FeaturePill
                active={showGrids}
                onClick={() => setShowGrids(!showGrids)}
                icon={Grid3X3}
                label="Grids"
                activeClass="bg-violet-500 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              />
              <FeaturePill
                active={showGallery}
                onClick={() => setShowGallery(!showGallery)}
                icon={GalleryHorizontal}
                label="Gallery"
                activeClass="bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
              />
              <FeaturePill
                active={showSpecs}
                onClick={() => setShowSpecs(!showSpecs)}
                icon={Settings2}
                label="Specs"
                activeClass="bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              />
              <FeaturePill
                active={isIdOnly}
                onClick={() => setIsIdOnly(!isIdOnly)}
                icon={Hash}
                label="ID-Only"
                activeClass="bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              />
              <div className="w-px h-5 bg-primary/10 mx-0.5" />
              <FeaturePill
                active={isOutputVisible}
                onClick={() => setIsOutputVisible(!isOutputVisible)}
                icon={Terminal}
                label={isOutputVisible ? "Hide Output" : "Show Output"}
                activeClass="bg-primary text-primary-foreground border-primary"
              />
            </motion.div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {/* ── LEFT COLUMN ── */}
            <motion.div
              layout
              transition={{
                layout: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }
              }}
              className={cn(
                "space-y-6 pb-32",
                isOutputVisible ? "lg:col-span-7" : "lg:col-span-12"
              )}
            >
              {/* Select article (modify mode) */}
              {mode === "modify" && (
                <ScrollReveal direction="left" delay={0.1}>
                  <Card className="bg-card/50 border-primary/10 shadow-sm overflow-hidden border-l-4 border-l-amber-400 rounded-xl">
                    <CardHeader className="py-3 px-5 border-b bg-muted/5 flex flex-row items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                        {dictionary.selectArticleLabel}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/10 bg-background/40 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                          {contentType} · {articleStats.total}
                        </span>
                        <button
                          onClick={() => setStatusFilter("all")}
                          className={cn(
                            "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors",
                            statusFilter === "all"
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-primary",
                          )}
                        >
                          All {articleStats.total}
                        </button>
                        <button
                          onClick={() => setStatusFilter("published")}
                          className={cn(
                            "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors",
                            statusFilter === "published"
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
                          )}
                        >
                          Live {articleStats.published}
                        </button>
                        <button
                          onClick={() => setStatusFilter("draft")}
                          className={cn(
                            "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors",
                            statusFilter === "draft"
                              ? "bg-amber-500 text-white"
                              : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
                          )}
                        >
                          Draft {articleStats.draft}
                        </button>
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
                            Draft Queue ({contentType})
                          </p>
                          <button
                            type="button"
                            onClick={() => setStatusFilter("draft")}
                            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
                          >
                            Show Draft Only
                          </button>
                        </div>

                        {articleStats.draft > 0 ? (
                          <>
                            <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                              Total {articleStats.draft} draft · {staleDraftCount} stale (&ge;30d)
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {urgentDrafts.map((article) => {
                                const ageDays = getDraftAgeDays(article.date);
                                const isStale = ageDays !== null && ageDays >= 30;

                                return (
                                  <button
                                    key={article.slug}
                                    type="button"
                                    onClick={() => setSelectedSlug(article.slug)}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide transition-colors",
                                      isStale
                                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                                        : "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300",
                                    )}
                                  >
                                    <span className="truncate max-w-30">{article.slug}</span>
                                    <span className="opacity-75">{parseNaturalDate(article.date)}</span>
                                    {ageDays !== null && <span>· {ageDays}d</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                            No draft in this content type. Queue is clear.
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder={dictionary.searchArticlePlaceholder}
                          value={articleSearch}
                          onChange={(e) => setArticleSearch(e.target.value)}
                          className={cn(
                            "pl-9 h-10 bg-background/50 rounded-lg text-xs",
                            focusRing,
                          )}
                        />
                      </div>
                      <ScrollArea className="h-50 rounded-lg border border-primary/5 bg-background/20 p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {filteredArticles.length === 0 && (
                            <p className="col-span-2 text-center py-8 text-[10px] text-muted-foreground">
                              No articles found.
                            </p>
                          )}
                          {filteredArticles.map((article) => (
                            <button
                              key={article.slug}
                              onClick={() => setSelectedSlug(article.slug)}
                              className={cn(
                                "text-left p-3 rounded-lg transition-all flex flex-col gap-1 border",
                                selectedSlug === article.slug
                                  ? "bg-amber-500 text-white border-amber-400 shadow-sm"
                                  : "hover:bg-background hover:border-primary/10 border-transparent",
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                {article.type === "blog" ? (
                                  <FileText className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                ) : (
                                  <StickyNote className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                )}
                                <span className="font-bold text-[11px] truncate leading-tight">
                                  {article.title}
                                </span>
                                <span
                                  className={cn(
                                    "ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider",
                                    article.published
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                                  )}
                                >
                                  {article.published ? "Live" : "Draft"}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono opacity-60 truncate pl-4">
                                {article.slug}
                              </span>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                      {selectedSlug && selectedArticle && (
                        <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 truncate block">
                              ✓ {selectedSlug}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                              {selectedArticle.published ? "Published article" : "Draft article"}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedSlug("")}
                            className="text-[9px] font-black uppercase text-muted-foreground hover:text-destructive ml-2 shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}

              {/* Draft / Original content */}
              <ScrollReveal
                direction="left"
                delay={mode === "modify" ? 0.2 : 0.1}
              >
                <Card
                  className={cn(
                    "bg-card/50 border-primary/10 flex flex-col overflow-hidden shadow-lg border-l-4 transition-all duration-300 rounded-xl",
                    mode === "modify" ? "border-l-sky-400" : "border-l-primary",
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 px-5 py-3">
                    <div className="flex items-center gap-2">
                      {mode === "modify" ? (
                        <Layers className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      ) : (
                        <PenLine className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                        {mode === "modify"
                          ? dictionary.originalContentTitle
                          : dictionary.draftTitle}
                      </CardTitle>
                    </div>
                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground uppercase">
                      <span className="flex items-center gap-1">
                        <AlignLeft className="h-3 w-3" />
                        {counters.lines}L
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {counters.words}W
                      </span>
                      <span className="flex items-center gap-1 opacity-50">
                        <Type className="h-3 w-3" />
                        {counters.chars}C
                      </span>
                    </div>
                  </CardHeader>
                  <Textarea
                    ref={originalContentRef}
                    placeholder={
                      mode === "modify"
                        ? dictionary.originalContentPlaceholder
                        : dictionary.draftPlaceholder
                    }
                    value={mode === "modify" ? originalContent : draft}
                    onChange={(e) =>
                      mode === "modify"
                        ? setOriginalContent(e.target.value)
                        : setDraft(e.target.value)
                    }
                    onSelect={handleOriginalSelection}
                    className="w-full border-none rounded-none bg-transparent font-mono text-xs p-6 resize-none focus-visible:ring-0 leading-relaxed min-h-120"
                  />
                  {/* Footer hint */}
                  <div className="px-5 py-2 border-t bg-muted/5 flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/40 font-mono">
                      {mode === "modify"
                        ? "Paste the existing MDX content above"
                        : "Write your draft in MDX or plain text above"}
                    </span>
                    {mode === "modify" && selectedArticle && (
                      <span className="ml-auto text-[9px] font-mono text-muted-foreground/55">
                        {isOriginalLoading
                          ? `Loading ${selectedArticle.slug}...`
                          : `Loaded ${selectedArticle.slug}`}
                      </span>
                    )}
                  </div>

                  {mode === "modify" && (
                    <div ref={blockComposerRef} className="border-t border-primary/10 bg-sky-500/[0.06] px-5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-600 dark:text-sky-400">
                          Block Comment Composer
                        </p>
                        {selectedBlockLine !== null && (
                          <span className="rounded-full border border-sky-500/30 bg-background/80 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                            Line {selectedBlockLine}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Select a block from the original content, write the intended change, then insert it into modification instructions.
                      </p>
                      <div className="mt-3 space-y-2">
                        <Textarea
                          rows={selectedBlockRows}
                          value={selectedBlock}
                          onChange={(e) => setSelectedBlock(e.target.value)}
                          placeholder="Selected block preview will appear here"
                          className="bg-background/60 font-mono text-[11px]"
                        />
                        <Textarea
                          value={selectedBlockComment}
                          onChange={(e) => setSelectedBlockComment(e.target.value)}
                          placeholder="Comment the exact change you want for this selected block"
                          className="min-h-16 bg-background/60 text-[11px]"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={addSelectedBlockToInstructions}
                            disabled={!selectedBlock.trim()}
                            className="rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-sky-700 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
                          >
                            Insert To Instructions
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </ScrollReveal>

              {/* Modify instructions */}
              {mode === "modify" && (
                <ScrollReveal direction="left" delay={0.3}>
                  <Card className="bg-card/50 border-primary/10 shadow-md border-l-4 border-l-accent rounded-xl">
                    <CardHeader className="border-b bg-muted/5 px-5 py-3 flex flex-row items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-accent shrink-0" />
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                        {dictionary.modInstructionsTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {/* Quick actions */}
                      <div className="flex flex-wrap gap-1.5">
                        {(["narrative", "images", "metadata", "polish"] as const).map(
                          (action) => (
                            <button
                              key={action}
                              onClick={() => applyQuickAction(action)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 h-7 rounded-full text-[9px] font-black uppercase tracking-wide transition-all",
                                action === "polish"
                                  ? "bg-fuchsia-500/10 text-fuchsia-500 hover:bg-fuchsia-500/20 border border-fuchsia-500/20"
                                  : action === "images"
                                  ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border border-violet-500/20"
                                  : "bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20"
                              )}
                            >
                              <Sparkles className="h-3 w-3" />
                              {getQuickActionLabel(action)}
                            </button>
                          ),
                        )}
                      </div>
                      <Textarea
                        ref={modInstructionsRef}
                        placeholder={dictionary.modInstructionsPlaceholder}
                        value={modInstructions}
                        onChange={(e) => setModInstructions(e.target.value)}
                        className={cn(
                          "min-h-32.5 bg-background/30 rounded-lg font-mono text-xs p-4",
                          focusRing,
                        )}
                      />
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}

              {/* Technical details accordion */}
              <ScrollReveal direction="up" delay={0.2}>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
                    className="w-full flex items-center justify-between px-1 py-3 group"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">
                        Technical Details & Media
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border border-primary/10 flex items-center justify-center transition-transform duration-300",
                        isTechnicalExpanded ? "rotate-180" : "",
                      )}
                    >
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </button>

                  {isTechnicalExpanded && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Images card */}
                      {showImages && (
                        <Card className="bg-card/50 border-primary/10 overflow-hidden shadow-sm border-l-4 border-l-emerald-400 rounded-xl">
                          <CardHeader className="bg-muted/5 py-3 border-b px-5 flex flex-row items-center gap-2">
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                              {dictionary.imagesTitle}
                            </CardTitle>
                            <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono">
                              path/to/img.webp | Alt text
                            </span>
                          </CardHeader>
                          <CardContent className="p-5">
                            <Textarea
                              placeholder={dictionary.imagesPlaceholder}
                              value={images}
                              onChange={(e) => setImages(e.target.value)}
                              className={cn(
                                "font-mono text-[11px] bg-background/50 rounded-lg p-4 min-h-22.5",
                                focusRing,
                              )}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {/* Downloads, Grids & Galleries */}
                      {(showDownloads || showGrids || showGallery) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {showDownloads && (
                            <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-blue-400 rounded-xl">
                              <CardHeader className="border-b bg-muted/5 py-3 px-5 flex flex-row items-center gap-2">
                                <Download className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                                  Downloads
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-5 space-y-3">
                                {downloadItems.map((item, index) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 p-2 border border-primary/5 rounded-lg bg-background/30"
                                  >
                                    <Select
                                      value={item.type}
                                      onValueChange={(val) =>
                                        updateDownloadItem(item.id, {
                                          type: val as "id" | "url",
                                          value: "",
                                        })
                                      }
                                    >
                                      <SelectTrigger className="w-15 h-7 text-[9px] border-primary/10">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="id">ID</SelectItem>
                                        <SelectItem value="url">URL</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {item.type === "id" ? (
                                      <DownloadIdPicker
                                        value={item.value}
                                        onSelect={(next) =>
                                          updateDownloadItem(item.id, {
                                            value: next,
                                          })
                                        }
                                        downloadIds={downloadIds}
                                      />
                                    ) : (
                                      <Input
                                        value={item.value}
                                        onChange={(e) =>
                                          updateDownloadItem(item.id, {
                                            value: e.target.value,
                                          })
                                        }
                                        placeholder={
                                          dictionary.downloadLinks.urlPlaceholder
                                        }
                                        className="flex-1 h-7 text-[10px] border-primary/10"
                                      />
                                    )}
                                    <button
                                      type="button"
                                      aria-label={`Remove download item ${index + 1}`}
                                      onClick={() => removeDownloadItem(item.id)}
                                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                    <SnipTooltip label={`Copy {{Link ${index + 1}}}`} side="top">
                                      <button
                                        type="button"
                                        aria-label={`Copy link caller ${index + 1}`}
                                        onClick={() => copyLinkCaller(index)}
                                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </SnipTooltip>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={addDownloadItem}
                                  className="w-full h-9 rounded-lg border border-dashed border-primary/20 text-[10px] font-black uppercase tracking-wide text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Plus className="h-3 w-3" />
                                  {dictionary.downloadLinks.addDownload}
                                </button>
                              </CardContent>
                            </Card>
                          )}

                          {showGrids && (
                            <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-violet-400 rounded-xl">
                              <CardHeader className="border-b bg-muted/5 py-3 px-5 flex flex-row items-center gap-2">
                                <Grid3X3 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                                  Grids
                                </CardTitle>
                                <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono">
                                  cols | img1, img2, ...
                                </span>
                              </CardHeader>
                              <CardContent className="p-5 space-y-3">
                                <Textarea
                                  placeholder={"2 | path1.webp, path2.webp\n3 | img1.webp, img2.webp, img3.webp"}
                                  value={imageGridMappings}
                                  onChange={(e) =>
                                    setImageGridMappings(e.target.value)
                                  }
                                  className={cn(
                                    "min-h-22.5 font-mono text-[11px] bg-background/50 p-4",
                                    focusRing,
                                  )}
                                />
                                {/* Grid caller references */}
                                {imageGridMappings.trim() && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Callers</span>
                                    <div className="flex flex-wrap gap-1">
                                      {imageGridMappings.split("\n").filter(l => l.trim()).map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() => copyGridCaller(i)}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border border-violet-500/20 transition-colors"
                                        >
                                          <Copy className="h-2.5 w-2.5" />
                                          {`{{Grid ${i + 1}}}`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {showGallery && (
                            <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-fuchsia-400 rounded-xl">
                              <CardHeader className="border-b bg-muted/5 py-3 px-5 flex flex-row items-center gap-2">
                                <GalleryHorizontal className="h-3.5 w-3.5 text-fuchsia-500 shrink-0" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                                  Galleries
                                </CardTitle>
                                <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono">
                                  caption | img1, img2, img3
                                </span>
                              </CardHeader>
                              <CardContent className="p-5 space-y-3">
                                <Textarea
                                  placeholder={"Optional caption | path1.webp, path2.webp, path3.webp"}
                                  value={galleryMappings}
                                  onChange={(e) =>
                                    setGalleryMappings(e.target.value)
                                  }
                                  className={cn(
                                    "min-h-22.5 font-mono text-[11px] bg-background/50 p-4",
                                    focusRing,
                                  )}
                                />
                                {/* Gallery caller references */}
                                {galleryMappings.trim() && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Callers</span>
                                    <div className="flex flex-wrap gap-1">
                                      {galleryMappings.split("\n").filter(l => l.trim()).map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() => copyGalleryCaller(i)}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono bg-fuchsia-500/10 text-fuchsia-500 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 transition-colors"
                                        >
                                          <Copy className="h-2.5 w-2.5" />
                                          {`{{Gallery ${i + 1}}}`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {showSpecs && (
                            <Card className="bg-card/50 border-primary/10 shadow-sm border-l-4 border-l-orange-400 rounded-xl">
                              <CardHeader className="border-b bg-muted/5 py-3 px-5 flex flex-row items-center gap-2">
                                <Settings2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                                  System Specs
                                </CardTitle>
                                <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono">
                                  JSON or Raw Text
                                </span>
                              </CardHeader>
                              <CardContent className="p-5 space-y-3">
                                <Textarea
                                  placeholder={"Min specs: CPU i3, RAM 4GB...\nRec specs: CPU i5, RAM 8GB..."}
                                  value={specsMappings}
                                  onChange={(e) => setSpecsMappings(e.target.value)}
                                  className={cn(
                                    "min-h-30 font-mono text-[11px] bg-background/50 p-4",
                                    focusRing,
                                  )}
                                />
                                {/* Specs caller references */}
                                {specsMappings.trim() && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Callers</span>
                                    <div className="flex flex-wrap gap-1">
                                      {specsGroups.map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() => copySpecCaller(i)}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                                        >
                                          <Copy className="h-2.5 w-2.5" />
                                          {`{{Specs ${i + 1}}}`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* Empty state when all features are off */}
                      {!showImages && !showDownloads && !showGrids && !showGallery && !showSpecs && (
                        <div className="py-8 flex flex-col items-center gap-3 text-center border border-dashed border-primary/10 rounded-xl bg-muted/2">
                          <Settings2 className="h-6 w-6 text-muted-foreground/20" />
                          <p className="text-[10px] text-muted-foreground/40 font-medium">
                            Enable features above to show media inputs here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </motion.div>

            {/* ── RIGHT COLUMN — Generated Prompt ── */}
            {isOutputVisible && (
              <motion.div
                key="output-brief"
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98, transition: { duration: 0.2 } }}
                transition={{
                  duration: 0.4,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
                className="lg:col-span-5 h-full z-10"
              >
                <ScrollReveal direction="right" delay={0.15} distance={0}>
                  <div className="sticky top-28">
                    {/* Terminal card */}
                    <Card className="border-0 shadow-2xl overflow-hidden ring-1 ring-white/6 rounded-xl bg-[#0d0e11]">
                      {/* macOS-style title bar */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                          <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="flex-1 mx-3 h-5 bg-white/4 rounded-md flex items-center px-3 gap-1.5">
                          <Terminal className="h-2.5 w-2.5 text-white/20" />
                          <span className="text-[9px] text-white/25 font-mono">
                            content-brief.md
                          </span>
                        </div>
                      </div>

                      {/* Prompt stats bar */}
                      <div className="px-5 py-2 border-b border-white/4 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                          Content Brief
                        </span>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-white/20">
                          <span>{promptStats.words}w</span>
                          <span>{promptStats.chars}c</span>
                        </div>
                      </div>

                      {/* Prompt textarea */}
                      <ScrollArea className="h-[calc(100vh-260px)] min-h-100">
                        <Textarea
                          readOnly
                          value={generatedPrompt}
                          className="min-h-150 border-none bg-transparent font-mono text-[11.5px] p-6 resize-none focus-visible:ring-0 leading-relaxed text-slate-300/80 selection:bg-accent/30"
                        />
                      </ScrollArea>

                      {/* Bottom action bar */}
                      <div className="px-5 py-3 border-t border-white/5 bg-white/1 flex items-center justify-between gap-3">
                        <span className="text-[9px] text-white/20 font-mono">
                          {mode === "create"
                            ? `✦ ${contentType} · ${isPublished ? "published" : "draft"}${isFeatured && contentType === "blog" ? " · featured" : ""}`
                            : `✦ modify · ${selectedSlug || "no article selected"}${selectedArticle ? ` · ${selectedArticle.published ? "live" : "draft"}` : ""}`}
                        </span>
                        <button
                          onClick={handleCopy}
                          className={cn(
                            "flex items-center gap-1.5 px-5 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200",
                            isCopied
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20",
                          )}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {isCopied ? dictionary.copiedButton : "Copy Brief"}
                        </button>
                      </div>
                    </Card>
                  </div>
                </ScrollReveal>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ToolWrapper>
  );
}
