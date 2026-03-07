"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Copy,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  Download,
  Grid3X3,
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
  Tag,
} from "lucide-react";
import { downloadLinks } from "@/lib/data-downloads";
import { useNotification } from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InternalToolWrapper } from "@/components/tools/internal-tool-wrapper";
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

interface PromptGeneratorClientProps {
  dictionary: any;
  existingArticles: ArticleSummary[];
  fullDictionary: Dictionary;
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
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 h-7 rounded-full text-[9px] font-black uppercase tracking-wide border transition-all duration-200",
        active
          ? activeClass
          : "bg-muted/30 text-muted-foreground border-transparent hover:border-primary/10 hover:text-primary",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </button>
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
            "hover:border-primary/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
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
      <PopoverContent align="start" className="w-[460px] p-2">
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
export function PromptGeneratorClient({
  dictionary,
  existingArticles,
  fullDictionary,
}: PromptGeneratorClientProps) {
  const [mounted, setMounted] = useState(false);

  // ── Mode & content type ──
  const [mode, setMode] = useState<"create" | "modify">("create");
  const [contentType, setContentType] = useState<"blog" | "note">("blog");

  // ── Article selector (modify mode) ──
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [articleSearch, setArticleSearch] = useState("");

  // ── Content areas ──
  const [draft, setDraft] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [modInstructions, setModInstructions] = useState("");

  // ── Feature flags (persisted) ──
  const [showImages, setShowImages] = useState(true);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showGrids, setShowGrids] = useState(false);
  const [useMdxRules, setUseMdxRules] = useState(true);
  const [isIdOnly, setIsIdOnly] = useState(false);

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
  const [images, setImages] = useState("");

  // ── Output ──
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const { notify } = useNotification();
  const downloadIds = useMemo(() => Object.keys(downloadLinks).sort(), []);

  // ── Filtered article list ──
  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return existingArticles;
    const q = articleSearch.toLowerCase();
    return existingArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q),
    );
  }, [existingArticles, articleSearch]);

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
    setMounted(true);
    const saved = localStorage.getItem("snipgeek-prompt-features");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setShowImages(p.showImages !== undefined ? !!p.showImages : true);
        setShowDownloads(!!p.showDownloads);
        setShowGrids(!!p.showGrids);
        setUseMdxRules(p.useMdxRules !== undefined ? !!p.useMdxRules : true);
        setIsIdOnly(!!p.isIdOnly);
      } catch (_) { }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      "snipgeek-prompt-features",
      JSON.stringify({ showImages, showDownloads, showGrids, useMdxRules, isIdOnly }),
    );
  }, [showImages, showDownloads, showGrids, useMdxRules, isIdOnly, mounted]);

  // ── Build prompt ──
  useEffect(() => {
    const isBlog = contentType === "blog";
    const isModify = mode === "modify";

    let prompt = "";

    if (isModify) {
      prompt = `${dictionary.modifyPromptBase}\n\n`;
      if (selectedSlug) {
        prompt += `**TARGET ARTICLE SLUG:** \`${selectedSlug}\`\n\n`;
      }
    } else {
      const base = isBlog
        ? isIdOnly
          ? dictionary.promptBaseBlogIdOnly
          : dictionary.promptBaseBlog
        : isIdOnly
          ? dictionary.promptBaseNoteIdOnly
          : dictionary.promptBaseNote;
      prompt = `${base}\n\n`;
    }

    prompt += `**${dictionary.frontmatterDetails}:**\n`;
    prompt += `- ${dictionary.contentTypeLabel}: ${isBlog ? dictionary.contentTypeBlog : dictionary.contentTypeNote}\n`;
    prompt += `- ${dictionary.titleLabel}: ${isModify ? "[KEEP ORIGINAL UNLESS CHANGED]" : "[AI: generate SEO-optimized title 50-60 chars]"}\n`;

    if (!isModify) {
      prompt += `- slug: [AI: Generate unique kebab-case English slug]\n`;
      prompt += `- translationKey: [AI: Generate unique kebab-case key]\n`;
    }

    prompt += `- ${dictionary.dateLabel}: ${publishDate || (isModify ? "[KEEP ORIGINAL]" : new Date().toISOString().split("T")[0])}\n`;
    if (isModify)
      prompt += `- updated: ${new Date().toISOString().split("T")[0]}\n`;

    let frontmatterStatus = `published: ${isPublished}`;
    if (isBlog) frontmatterStatus += `, featured: ${isFeatured}`;
    prompt += `- ${dictionary.statusLabel}: ${frontmatterStatus}\n`;

    const imageLines = images.split("\n").filter((l) => l.trim() !== "");

    if (isBlog && !isModify) {
      const heroLine = showImages && imageLines.length > 0 ? imageLines[0] : "";
      const [heroPath, heroAlt] = heroLine
        .split("|")
        .map((s) => (s ? s.trim() : ""));
      prompt += `- heroImage: "${heroPath || "/images/blank/blank.webp"}"\n`;
      prompt += `- imageAlt: "${heroAlt || "[AI: GENERATE DESCRIPTIVE ALT]"}"\n`;
    }

    if (isModify) {
      const catModifyInstruction = categoryHint.trim()
        ? `"${categoryHint.trim()}" (override original)`
        : `[KEEP ORIGINAL]`;
      prompt += `- category: ${catModifyInstruction}\n`;
    } else {
      const catInstruction = categoryHint.trim()
        ? `"${categoryHint.trim()}" — [AI: use this as a hint, or invent a better category name if more appropriate]`
        : `[AI: FREELY CREATE a new category name. You are NOT limited to existing ones. Current examples: Tutorial, Windows, Hardware, Linux, Software Updates — but feel absolutely free to invent something more fitting for this content]`;
      prompt += `- tags: [AI: Generate 3-5 relevant tags]\n`;
      prompt += `- category: ${catInstruction}\n\n`;
    }

    const sliceIndex = isBlog && !isModify ? 1 : 0;
    if (showImages && imageLines.length > sliceIndex) {
      prompt += `**${isBlog ? dictionary.supportingImagesLabel : dictionary.supportingImagesLabelNote}:**\n`;
      imageLines.slice(sliceIndex).forEach((line, i) => {
        const [imgPath, imgAlt] = line
          .split("|")
          .map((s) => (s ? s.trim() : ""));
        prompt += `- Image ${i + 1} Path: "${imgPath}" | Alt: "${imgAlt || "[AI: GENERATE ALT]"}"\n`;
      });
      prompt += "\n";
    }

    if (showDownloads && downloadItems.length > 0) {
      prompt += `\n**${dictionary.downloadLinks.promptTitle}:**\n`;
      downloadItems.forEach((item, i) => {
        prompt += `- [DOWNLOAD_${i + 1}] -> ${item.type === "id" ? `ID: "${item.value}"` : `URL: "${item.value}"`}\n`;
      });
    }

    if (showGrids && imageGridMappings) {
      prompt += `\n**${dictionary.imageGrid.promptTitle}:**\n`;
      imageGridMappings
        .split("\n")
        .filter((l) => l.trim() !== "")
        .forEach((line, i) => {
          prompt += `- [GRID_${i + 1}] -> Paths: ${line}\n`;
        });
    }

    if (useMdxRules) {
      prompt += `\n**AVAILABLE CUSTOM MDX COMPONENTS:**\n`;
      prompt += `Use these React components natively instead of standard markdown when the context perfectly fits. DO NOT force them into every paragraph; use them naturally to enhance the article's readability.\n`;
      prompt += `\n1. Alerts/Callouts:\n`;
      prompt += `   Usage: For tips, warnings, or important developer notes.\n`;
      prompt += `   Syntax: <Callout variant="info|tip|warning|danger" title="Custom Heading">Your message here</Callout>\n`;
      prompt += `\n2. Numbered Tutorial Steps:\n`;
      prompt += `   Usage: When explaining a sequential process or step-by-step tutorial.\n`;
      prompt += `   Syntax:\n`;
      prompt += `   <Steps>\n`;
      prompt += `     <Step>First do this...</Step>\n`;
      prompt += `     <Step>Then do this...</Step>\n`;
      prompt += `   </Steps>\n`;
      prompt += `\n3. Keyboard Shortcuts:\n`;
      prompt += `   Usage: When mentioning hotkeys or key bindings.\n`;
      prompt += `   Syntax: <kbd>Ctrl</kbd> + <kbd>C</kbd>\n`;
    }

    if (isModify) {
      prompt += `---\n\n**${dictionary.originalContentLabel}:**\n\n${originalContent || "[PASTE CONTENT]"}\n\n**${dictionary.modInstructionsLabel}:**\n\n${modInstructions || "[INSTRUCTIONS]"}`;
    } else {
      prompt += `---\n\n**${dictionary.draftContentLabel}:**\n\n${draft}`;
    }

    prompt += `\n\n---\n**${dictionary.finalInstruction}**`;
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
    dictionary,
    contentType,
    downloadItems,
    imageGridMappings,
    showDownloads,
    showGrids,
    useMdxRules,
    showImages,
    selectedSlug,
    categoryHint,
  ]);

  // ── Handlers ──
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    notify(
      dictionary.copiedButton,
      <Check className="h-4 w-4 text-emerald-400" />,
    );
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

  const applyQuickAction = (action: string) => {
    const text =
      action === "narrative"
        ? dictionary.quickActions.narrative
        : action === "images"
          ? dictionary.quickActions.images
          : dictionary.quickActions.metadata;
    setModInstructions((prev) => (prev ? `${prev}\n- ${text}` : `- ${text}`));
  };

  const focusRing =
    "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <InternalToolWrapper
      title={dictionary.title}
      description={dictionary.description}
      dictionary={fullDictionary}
      isPublic={true}
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ── TOOLBAR ── */}
        <ScrollReveal direction="down" delay={0.05} duration={0.4}>
          <Card className="bg-background/80 backdrop-blur-xl border-primary/10 shadow-lg overflow-hidden rounded-xl">
            {/* Row 1 — mode / content-type / status */}
            <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-primary/5">
              {/* Left group */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Mode slider */}
                <div className="relative flex bg-muted/50 p-1 rounded-lg border border-primary/5">
                  <button
                    onClick={() => setMode("create")}
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 h-8 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors z-10",
                      mode === "create"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <PenLine className="h-3 w-3" />
                    {dictionary.modes.create}
                  </button>
                  <button
                    onClick={() => setMode("modify")}
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 h-8 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors z-10",
                      mode === "modify"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <Layers className="h-3 w-3" />
                    {dictionary.modes.modify}
                  </button>
                  {/* Sliding background */}
                  <div
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-md shadow-sm transition-all duration-300 z-0",
                      mode === "modify" ? "translate-x-full" : "translate-x-0",
                    )}
                  />
                </div>

                {/* Content type */}
                <div className="flex bg-muted/30 p-1 rounded-lg border border-primary/5">
                  <button
                    onClick={() => setContentType("blog")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 h-8 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                      contentType === "blog"
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    <FileText className="h-3 w-3" />
                    {dictionary.contentTypeBlog}
                  </button>
                  <button
                    onClick={() => setContentType("note")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 h-8 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                      contentType === "note"
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    <StickyNote className="h-3 w-3" />
                    {dictionary.contentTypeNote}
                  </button>
                </div>
              </div>

              {/* Right group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category hint */}
                <div className="flex items-center gap-2 bg-muted/20 px-3 h-9 rounded-lg border border-primary/5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    value={categoryHint}
                    onChange={(e) => setCategoryHint(e.target.value)}
                    placeholder={
                      dictionary.categoryHintPlaceholder ||
                      "AI creates category…"
                    }
                    className="h-7 w-36 border-none bg-transparent text-[10px] font-mono px-0 focus-visible:ring-0"
                  />
                </div>

                {/* Date input */}
                <div className="flex items-center gap-2 bg-muted/20 px-3 h-9 rounded-lg border border-primary/5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    placeholder={
                      mode === "modify" ? "ORIGINAL DATE" : "YYYY-MM-DD"
                    }
                    className="h-7 w-28 border-none bg-transparent text-[10px] font-mono px-0 focus-visible:ring-0"
                  />
                </div>

                {/* Published */}
                <div className="flex items-center gap-2 bg-muted/20 px-3 h-9 rounded-lg border border-primary/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Live
                  </span>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                    className="scale-75 origin-right"
                  />
                </div>

                {/* Featured (blog only) */}
                {contentType === "blog" && (
                  <div className="flex items-center gap-2 bg-muted/20 px-3 h-9 rounded-lg border border-primary/5">
                    <Star
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isFeatured
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Featured
                    </span>
                    <Switch
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                      className="scale-75 origin-right"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2 — feature flags */}
            <div className="px-4 py-2.5 flex flex-wrap items-center gap-2 bg-muted/[0.025]">
              <div className="flex items-center gap-1.5 pr-2 text-muted-foreground/40">
                <Settings2 className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                  Features:
                </span>
              </div>

              <FeaturePill
                active={showImages}
                onClick={() => setShowImages(!showImages)}
                icon={ImageIcon}
                label="Images"
                activeClass="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
              />
              <FeaturePill
                active={showDownloads}
                onClick={() => setShowDownloads(!showDownloads)}
                icon={Download}
                label="Downloads"
                activeClass="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
              />
              <FeaturePill
                active={showGrids}
                onClick={() => setShowGrids(!showGrids)}
                icon={Grid3X3}
                label="Grids"
                activeClass="bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400"
              />
              <FeaturePill
                active={isIdOnly}
                onClick={() => setIsIdOnly(!isIdOnly)}
                icon={Hash}
                label="ID-Only"
                activeClass="bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
              />
              <FeaturePill
                active={useMdxRules}
                onClick={() => setUseMdxRules(!useMdxRules)}
                icon={Sparkles}
                label="MDX Rules"
                activeClass="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
              />
            </div>
          </Card>
        </ScrollReveal>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-7 space-y-6 pb-32">
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
                    <ScrollArea className="h-[200px] rounded-lg border border-primary/5 bg-background/20 p-2">
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
                            </div>
                            <span className="text-[9px] font-mono opacity-60 truncate pl-4">
                              {article.slug}
                            </span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedSlug && (
                      <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 truncate">
                          ✓ {selectedSlug}
                        </span>
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
                  className="w-full border-none rounded-none bg-transparent font-mono text-xs p-6 resize-none focus-visible:ring-0 leading-relaxed min-h-[480px]"
                />
                {/* Footer hint */}
                <div className="px-5 py-2 border-t bg-muted/5 flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground/40 font-mono">
                    {mode === "modify"
                      ? "Paste the existing MDX content above"
                      : "Write your draft in MDX or plain text above"}
                  </span>
                </div>
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
                      {(["narrative", "images", "metadata"] as const).map(
                        (action) => (
                          <button
                            key={action}
                            onClick={() => applyQuickAction(action)}
                            className="flex items-center gap-1.5 px-3 h-7 rounded-full text-[9px] font-black uppercase tracking-wide bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all"
                          >
                            <Sparkles className="h-3 w-3" />
                            {action}
                          </button>
                        ),
                      )}
                    </div>
                    <Textarea
                      placeholder={dictionary.modInstructionsPlaceholder}
                      value={modInstructions}
                      onChange={(e) => setModInstructions(e.target.value)}
                      className={cn(
                        "min-h-[130px] bg-background/30 rounded-lg font-mono text-xs p-4",
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
                              "font-mono text-[11px] bg-background/50 rounded-lg p-4 min-h-[90px]",
                              focusRing,
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Downloads & Grids side by side */}
                    {(showDownloads || showGrids) && (
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
                              {downloadItems.map((item) => (
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
                                    <SelectTrigger className="w-[60px] h-7 text-[9px] border-primary/10">
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
                                    onClick={() => removeDownloadItem(item.id)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <button
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
                            </CardHeader>
                            <CardContent className="p-5">
                              <Textarea
                                placeholder="2 | path1.webp, path2.webp&#10;3 | img1.webp, img2.webp, img3.webp"
                                value={imageGridMappings}
                                onChange={(e) =>
                                  setImageGridMappings(e.target.value)
                                }
                                className={cn(
                                  "min-h-[90px] font-mono text-[11px] bg-background/50 p-4",
                                  focusRing,
                                )}
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Empty state when all features are off */}
                    {!showImages && !showDownloads && !showGrids && (
                      <div className="py-8 flex flex-col items-center gap-3 text-center border border-dashed border-primary/10 rounded-xl bg-muted/[0.02]">
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
          </div>

          {/* ── RIGHT COLUMN — Generated Prompt ── */}
          <div className="lg:col-span-5 h-full">
            <ScrollReveal direction="right" delay={0.15}>
              <div className="sticky top-28">
                {/* Terminal card */}
                <Card className="border-0 shadow-2xl overflow-hidden ring-1 ring-white/[0.06] rounded-xl bg-[#0d0e11]">
                  {/* macOS-style title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.015]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                      <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                      <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 mx-3 h-5 bg-white/[0.04] rounded-md flex items-center px-3 gap-1.5">
                      <Terminal className="h-2.5 w-2.5 text-white/20" />
                      <span className="text-[9px] text-white/25 font-mono">
                        prompt-output.md
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex items-center gap-1.5 px-4 h-7 rounded-full text-[9px] font-black uppercase tracking-wide transition-all duration-200",
                        isCopied
                          ? "bg-emerald-500 text-white"
                          : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
                      )}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Prompt stats bar */}
                  <div className="px-5 py-2 border-b border-white/[0.04] flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                      Generated Prompt
                    </span>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-white/20">
                      <span>{promptStats.words}w</span>
                      <span>{promptStats.chars}c</span>
                    </div>
                  </div>

                  {/* Prompt textarea */}
                  <ScrollArea className="h-[calc(100vh-260px)] min-h-[400px]">
                    <Textarea
                      readOnly
                      value={generatedPrompt}
                      className="min-h-[600px] border-none bg-transparent font-mono text-[11.5px] p-6 resize-none focus-visible:ring-0 leading-relaxed text-slate-300/80 selection:bg-accent/30"
                    />
                  </ScrollArea>

                  {/* Bottom action bar */}
                  <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between gap-3">
                    <span className="text-[9px] text-white/20 font-mono">
                      {mode === "create"
                        ? `✦ ${contentType} · ${isPublished ? "published" : "draft"}${isFeatured && contentType === "blog" ? " · featured" : ""}`
                        : `✦ modify · ${selectedSlug || "no article selected"}`}
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
                      {isCopied ? dictionary.copiedButton : "Copy Prompt"}
                    </button>
                  </div>
                </Card>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </InternalToolWrapper>
  );
}
