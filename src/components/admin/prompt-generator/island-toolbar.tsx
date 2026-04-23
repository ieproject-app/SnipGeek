import { usePrompt } from "./index";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, Calendar, Star, Hash, Search, PenLine, Layers, BookOpen, Sparkles, FileText, Check, AlertTriangle, ImageIcon, Download, Grid3X3, GalleryHorizontal, Settings2, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SnipTooltip } from "@/components/ui/snip-tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FeaturePill } from "./use-prompt-logic";

export function IslandToolbar() {
  const {
    mode, setMode,
    contentType, setContentType,
    publishDate, setPublishDate,
    isPublished, setIsPublished,
    isFeatured, setIsFeatured,
    isHideFromHome, setIsHideFromHome,
    categoryHint, setCategoryHint,
    showImages, setShowImages,
    showDownloads, setShowDownloads,
    showGrids, setShowGrids,
    showGallery, setShowGallery,
    showSpecs, setShowSpecs,
    isIdOnly, setIsIdOnly,
    hasBlockingIssues, isCopied, handleCopy,
    resetPopoverOpen, setResetPopoverOpen, handleReset,
    promptStats, dictionary
  } = usePrompt();

  const focusRing = "focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/30 transition-all duration-300";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Island 1: Mode & Content Type */}
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex items-center gap-1.5 rounded-xl border border-primary/10 bg-card/50 p-1.5 shadow-sm backdrop-blur-lg"
      >
        <div className="relative flex items-center">
          <SnipTooltip label={dictionary.modes.create} side="bottom">
            <button
              type="button"
              aria-label={dictionary.modes.create}
              aria-pressed={mode === "create"}
              onClick={() => setMode("create")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", mode === "create" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <PenLine className="h-4 w-4" />
            </button>
          </SnipTooltip>

          <SnipTooltip label={dictionary.modes.modify} side="bottom">
            <button
              type="button"
              aria-label={dictionary.modes.modify}
              aria-pressed={mode === "modify"}
              onClick={() => setMode("modify")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", mode === "modify" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <Layers className="h-4 w-4" />
            </button>
          </SnipTooltip>
          <motion.div
            className="absolute inset-y-0 z-0 w-1/2 rounded-md border border-primary/5 bg-background shadow-sm"
            animate={{ x: mode === "modify" ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 520, damping: 38 }}
          />
        </div>

        <div className="h-5 w-px self-center bg-primary/10" />

        <div className="relative flex items-center">
          <SnipTooltip label={dictionary.contentTypeSeries} side="bottom">
            <button
              type="button"
              aria-label={dictionary.contentTypeSeries}
              onClick={() => setContentType("series")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", contentType === "series" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <BookOpen className="h-4 w-4" />
            </button>
          </SnipTooltip>

          <SnipTooltip label={dictionary.contentTypeNews} side="bottom">
            <button
              type="button"
              aria-label={dictionary.contentTypeNews}
              onClick={() => setContentType("news")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", contentType === "news" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <Search className="h-4 w-4" />
            </button>
          </SnipTooltip>

          <SnipTooltip label={dictionary.contentTypeTips} side="bottom">
            <button
              type="button"
              aria-label={dictionary.contentTypeTips}
              onClick={() => setContentType("tips")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", contentType === "tips" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </SnipTooltip>
          <SnipTooltip label={dictionary.contentTypeNotes} side="bottom">
            <button
              type="button"
              aria-label={dictionary.contentTypeNotes}
              onClick={() => setContentType("notes")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", contentType === "notes" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <FileText className="h-4 w-4" />
            </button>
          </SnipTooltip>
          <SnipTooltip label={dictionary.contentTypeApps} side="bottom">
            <button
              type="button"
              aria-label={dictionary.contentTypeApps}
              onClick={() => setContentType("apps")}
              className={cn("relative z-10 flex h-9 w-10 items-center justify-center rounded-md transition-colors duration-200", contentType === "apps" ? "text-primary" : "text-muted-foreground hover:text-primary/70")}
            >
              <Download className="h-4 w-4" />
            </button>
          </SnipTooltip>
          <motion.div
            className="absolute inset-y-0 z-0 w-1/5 rounded-md border border-primary/5 bg-background shadow-sm"
            animate={{
              x: contentType === "series" ? "0%" : contentType === "news" ? "100%" : contentType === "tips" ? "200%" : contentType === "notes" ? "300%" : "400%",
            }}
            transition={{ type: "spring", stiffness: 520, damping: 38 }}
          />
        </div>
      </motion.div>

      {/* Island 2: Date & Status */}
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card/50 p-1.5 shadow-sm backdrop-blur-lg"
      >
        <div className="flex h-10 items-center gap-2.5 rounded-lg border border-primary/10 bg-primary/5 px-3.5">
          <div className="flex items-center gap-2 border-r border-primary/10 pr-3.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
            <Input
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              placeholder={mode === "modify" ? "DATE" : "YYYY-MM-DD"}
              className="h-8 w-32 border-none bg-transparent px-0 text-[11px] font-bold placeholder:opacity-50 focus-visible:ring-0"
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
                  className={cn("text-[9px] font-black uppercase tracking-tighter", isPublished ? "text-emerald-500" : "text-muted-foreground")}
                >
                  {isPublished ? "LIVE" : "DRAFT"}
                </motion.span>
              </AnimatePresence>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} className="scale-75 data-[state=checked]:bg-emerald-500" />
            </div>

            <AnimatePresence initial={false}>
              {mode === "create" && (
                <motion.div
                  key="featured-toggle"
                  initial={{ opacity: 0, x: 10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 10, width: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <motion.span animate={isFeatured ? { rotate: [0, 20, -12, 0], scale: [1, 1.4, 1] } : { rotate: 0, scale: 1 }} transition={{ duration: 0.4, ease: "backOut" }} className="flex">
                    <Star className={cn("h-3.5 w-3.5 transition-colors duration-300", isFeatured ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                  </motion.span>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75 data-[state=checked]:bg-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 overflow-hidden border-l border-primary/10 pl-2">
              <SnipTooltip label="Hide From Home" side="bottom">
                <motion.span animate={isHideFromHome ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={{ duration: 0.4, ease: "backOut" }} className="flex">
                  <EyeOff className={cn("h-3.5 w-3.5 transition-colors duration-300", isHideFromHome ? "text-rose-500" : "text-muted-foreground")} />
                </motion.span>
              </SnipTooltip>
              <Switch checked={isHideFromHome} onCheckedChange={setIsHideFromHome} className="scale-75 data-[state=checked]:bg-rose-500" />
            </div>

            <div className="hidden items-center gap-2 border-l border-primary/10 pl-2 xl:flex">
              <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
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
        className="flex items-center gap-1.5 rounded-xl border border-primary/10 bg-card/50 p-1.5 shadow-sm backdrop-blur-lg"
      >
        <FeaturePill active={showImages} onClick={() => setShowImages(!showImages)} icon={ImageIcon} label="Images" activeClass="bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
        <FeaturePill active={showDownloads} onClick={() => setShowDownloads(!showDownloads)} icon={Download} label="Downloads" activeClass="bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
        <FeaturePill active={showGrids} onClick={() => setShowGrids(!showGrids)} icon={Grid3X3} label="Grids" activeClass="bg-violet-500 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
        <FeaturePill active={showGallery} onClick={() => setShowGallery(!showGallery)} icon={GalleryHorizontal} label="Gallery" activeClass="bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]" />
        <FeaturePill active={showSpecs} onClick={() => setShowSpecs(!showSpecs)} icon={Settings2} label="Specs" activeClass="bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
        <FeaturePill active={isIdOnly} onClick={() => setIsIdOnly(!isIdOnly)} icon={Hash} label="ID-Only" activeClass="bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
      </motion.div>
    </div>
  );
}

export function StickyBottomBar() {
  const {
    hasBlockingIssues, isCopied, handleCopy,
    resetPopoverOpen, setResetPopoverOpen, handleReset,
    promptStats, dictionary
  } = usePrompt();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-primary/10 bg-card/90 p-2 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center px-3 pr-4 border-r border-primary/10">
         <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wide">
           {promptStats.words}w
         </span>
      </div>

      <button
        onClick={handleCopy}
        className={cn(
          "flex h-10 items-center justify-center gap-2 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm",
          hasBlockingIssues
            ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/20"
            : isCopied
            ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5",
        )}
      >
        {hasBlockingIssues ? (
          <AlertTriangle className="h-4 w-4" />
        ) : isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {hasBlockingIssues ? "Resolve Issues" : isCopied ? dictionary.copiedButton : "Copy Brief"}
      </button>
      
      <Popover open={resetPopoverOpen} onOpenChange={setResetPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" sideOffset={16} className="w-[300px] rounded-xl border border-primary/10 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 p-2 h-fit">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground">
                  Reset Session?
                </h4>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  This will clear all drafts, texts, and settings. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-primary/5 pt-3">
              <button
                onClick={() => setResetPopoverOpen(false)}
                className="rounded-md px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="rounded-md bg-destructive px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
