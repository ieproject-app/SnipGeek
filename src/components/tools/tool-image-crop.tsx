"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Dictionary } from "@/lib/get-dictionary";
import {
  Upload,
  Download,
  Image as ImageIcon,
  AlignCenter,
  Crop,
  CheckCircle2,
  X,
  Loader2,
  RectangleHorizontal,
  Tags,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileImage,
  AlertCircle,
} from "lucide-react";
import { MAX_TARGET_SIZE_KB, ASPECT_RATIO_STORAGE_KEY, ARTICLE_IMAGE_CONFIG, type AspectRatioMode, type ArticleImageType, type ImageCropTranslations } from "./image-crop/types";
import { CropPreview, InfoPill } from "./image-crop/crop-preview";
import { useImageCrop } from "./image-crop/use-image-crop";
import { useBatchRename } from "./image-crop/use-batch-rename";

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
interface ToolImageCropProps {
  dictionary: Dictionary;
}

type TabMode = "crop" | "rename";

export function ToolImageCrop({ dictionary }: ToolImageCropProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("crop");

  const handleTabChange = (tab: TabMode) => {
    setActiveTab(tab);
    try { localStorage.setItem(STORAGE_KEYS.IMAGE_CROP_TAB, tab); } catch {}
  };

  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("4:3");

  // Hydrate from localStorage safely
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem(STORAGE_KEYS.IMAGE_CROP_TAB);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedTab === "crop" || savedTab === "rename") setActiveTab(savedTab);
      
      const savedRatio = localStorage.getItem(ASPECT_RATIO_STORAGE_KEY);
       
      if (savedRatio === "16:9" || savedRatio === "4:3") setAspectRatio(savedRatio);
    } catch {}
  }, []);

  const handleRatioChange = (mode: AspectRatioMode) => {
    setAspectRatio(mode);
    try { localStorage.setItem(ASPECT_RATIO_STORAGE_KEY, mode); } catch {}
  };

  const toolMeta = dictionary?.tools?.tool_list?.image_crop || {
    title: "Image Crop",
    description: "Crop to 16:9 and export as WebP.",
  };

  const t: ImageCropTranslations = dictionary?.tools?.image_crop || {
    invalidImageFile: "Please upload a valid image file.",
    imageLoadError: "Failed to load image. File may be corrupted.",
    downloadError: "Failed to generate WebP. Please try again.",
    downloaded: "Downloaded: {filename} ({size})",
    dropTitle: "Drop image here",
    dropDescription: "or click to browse - PNG, JPG, and WebP supported.",
    pasteHint: "You can also Ctrl+V / Cmd+V to paste",
    outputBadge: "Output: 16:9 .webp",
    original: "Original",
    ratio: "Ratio",
    target: "Target 16:9",
    already169: "Already 16:9",
    horizontal: "Horizontal",
    vertical: "Vertical",
    noAdjustment: "no adjustment",
    center: "Center",
    dragHint: "Drag to reposition",
    removeImage: "Remove image",
    previewAlt: "Crop preview",
    downloadButton: "Download WebP",
    loadAnother: "Load Another Image",
    outputLabel: "Output:",
    clientSideInfo: "100% client-side, no upload.",
    howTo: [
      { step: "01", title: "Upload Image", desc: "Drop or pick any image from screenshots or files." },
      { step: "02", title: "Drag to Reposition", desc: "Click and drag the preview directly to position the 16:9 crop window." },
      { step: "03", title: "Download WebP", desc: "Get a perfectly cropped .webp ready to use in your articles." },
    ],
  };

  const cropHook = useImageCrop(t, aspectRatio);
  const renameHook = useBatchRename();
  const renameFileInputRef = useRef<HTMLInputElement>(null);

  const {
    imageSrc, imgW, imgH, fileName, isDragging: cropDragging, isProcessing, estimatedSize,
    offsetX, setOffsetX, offsetY, setOffsetY, cropScale,
    fileInputRef,
    maxCropW, maxCropH, cropW, cropH, maxOffsetX, maxOffsetY,
    cropX, cropY, canSlideX, canSlideY, canDrag, isAlreadyTarget,
    exportW, exportH,
    compressLoading, compressProgress, compressError,
    handleFileInput, handleDrop, handleDragOver, handleDragLeave,
    handleReposition, handleBrowseFiles, handleDownload,
    handleReset, handleResize,
  } = cropHook;

  const {
    imageType, files, isDragging: renameDragging, startIndex,
    convertingId, compressLoading: renameCompressLoading, compressProgress: renameCompressProgress,
    setImageType, setStartIndex,
    handleDrop: renameHandleDrop,
    handleDragOver: renameHandleDragOver,
    handleDragLeave: renameHandleDragLeave,
    handleFileInput: renameHandleFileInput,
    removeFile, moveFile, clearAll, downloadFile, downloadAll,
  } = renameHook;

  return (
    <ToolWrapper
      title={toolMeta.title}
      description={toolMeta.description}
      dictionary={dictionary}
      isPublic={true}
      requiresCloud={false}
    >
      <div className="space-y-5 mt-4">

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 rounded-2xl border border-primary/10 bg-background/60 p-1 backdrop-blur-sm w-fit">
          {(["crop", "rename"] as TabMode[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              {tab === "crop" ? <Crop className="h-3.5 w-3.5" /> : <Tags className="h-3.5 w-3.5" />}
              {tab === "crop" ? "Crop & Convert" : "Batch Rename"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════
              TAB 1 — Crop & Convert (for Hero images)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === "crop" && (
            <motion.div
              key="crop-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Top bar */}
              <div className="sticky top-3 z-20 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-background/70 px-4 py-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                    <Crop className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black uppercase tracking-[0.24em] text-primary">Crop &amp; Convert</p>
                    <p className="text-[11px] text-muted-foreground">For Hero images &middot; auto WebP &middot; target &le;120KB</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <div className="flex items-center rounded-full border border-primary/15 bg-background/70 p-0.5">
                    {(["4:3", "16:9"] as AspectRatioMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleRatioChange(mode)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-all",
                          aspectRatio === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        <RectangleHorizontal className={cn("h-3 w-3", mode === "4:3" && "rotate-90")} />
                        {mode}
                      </button>
                    ))}
                  </div>
                  <Button type="button" onClick={handleBrowseFiles} size="sm" variant="outline" className="rounded-full gap-2 font-bold uppercase tracking-widest border-primary/15 bg-background/70">
                    <Upload className="h-3.5 w-3.5" /> Add Files
                  </Button>
                  {imageSrc && (
                    <Button type="button" onClick={handleDownload} disabled={isProcessing} size="sm" className="rounded-full gap-2 font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      {isProcessing ? "Processing..." : t.downloadButton}
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={handleReset} size="sm" className="rounded-full gap-2 font-bold uppercase tracking-widest border-primary/15 bg-background/70">
                    <X className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              </div>

              <input ref={fileInputRef} id="image-upload-input" type="file" accept="image/*,.avif" className="sr-only" onChange={handleFileInput} />

              {compressLoading && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Compressing... {Math.round(compressProgress)}%</span>
                  </div>
                </div>
              )}
              {compressError && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-[10px] text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
                    <X className="h-3 w-3" /><span>Error: {compressError}</span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {!imageSrc ? (
                  <motion.div key="dropzone" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    <label htmlFor="image-upload-input" className="cursor-pointer block">
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed transition-all duration-300 py-16 px-6 text-center min-h-[280px] bg-gradient-to-b from-background to-muted/20 shadow-[0_18px_60px_-28px_rgba(0,0,0,0.45)]",
                          cropDragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-primary/10 hover:border-primary/30 hover:bg-muted/30",
                        )}
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10 text-primary ring-1 ring-primary/10 shadow-sm">
                          <Upload className="h-8 w-8 text-primary/60" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-primary uppercase tracking-[0.18em] text-base">{t.dropTitle}</p>
                          <p className="text-xs text-muted-foreground md:max-w-[280px] mx-auto leading-relaxed">
                            {t.dropDescription}<br className="hidden sm:block" />
                            <span className="hidden sm:inline">({t.pasteHint})</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 backdrop-blur-sm">
                          <Crop className="h-3 w-3 text-accent" />
                          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Output: {aspectRatio} .webp &middot; {exportW}x{exportH}</span>
                        </div>
                      </div>
                    </label>
                  </motion.div>
                ) : (
                  <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="space-y-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      <InfoPill label={t.original} value={`${imgW} x ${imgH}`} />
                      <InfoPill label={t.ratio} value={(imgW / imgH).toFixed(3)} />
                      <InfoPill label={t.target} value={`${exportW} x ${exportH}`} />
                      {isAlreadyTarget && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-wider">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Already {aspectRatio}
                        </div>
                      )}
                    </div>
                    <CropPreview
                      imageSrc={imageSrc} imgW={imgW} imgH={imgH}
                      cropX={cropX} cropY={cropY} cropW={cropW} cropH={cropH}
                      maxCropW={maxCropW} maxCropH={maxCropH} cropScale={cropScale}
                      canDrag={canDrag} onReposition={handleReposition} onResize={handleResize}
                      currentOffsetX={offsetX} currentOffsetY={offsetY}
                      maxOffsetX={maxOffsetX} maxOffsetY={maxOffsetY}
                      dragHint={t.dragHint} removeImageLabel={t.removeImage}
                      imageAlt={t.previewAlt} onReset={handleReset}
                    />
                    <Card className="rounded-[28px] border border-white/10 bg-background/75 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                      <CardContent className="p-5 space-y-4">
                        <div className={cn("space-y-1.5", !canSlideX && "opacity-35 pointer-events-none")}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.horizontal}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{canSlideX ? `x: ${cropX}px` : t.noAdjustment}</span>
                          </div>
                          <Slider value={[offsetX * 100]} onValueChange={([v]) => setOffsetX(v / 100)} min={0} max={100} step={0.5} disabled={!canSlideX} />
                        </div>
                        <div className={cn("space-y-1.5", !canSlideY && "opacity-35 pointer-events-none")}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.vertical}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{canSlideY ? `y: ${cropY}px` : t.noAdjustment}</span>
                          </div>
                          <Slider value={[offsetY * 100]} onValueChange={([v]) => setOffsetY(v / 100)} min={0} max={100} step={0.5} disabled={!canSlideY} />
                        </div>
                        {canDrag && (
                          <div className="flex justify-center">
                            <button type="button" onClick={() => { setOffsetX(0.5); setOffsetY(0.5); }} className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-muted/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/40 hover:text-primary">
                              <AlignCenter className="h-3.5 w-3.5" /> {t.center}
                            </button>
                          </div>
                        )}
                        <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                        <div className="rounded-2xl border border-primary/5 bg-muted/20 p-3">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                            <div className="text-[11px] leading-relaxed text-muted-foreground">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-primary">{fileName}-{exportW}x{exportH}.webp</span>
                                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">auto quality</span>
                              </div>
                              <p className="mt-1 font-mono text-primary">{exportW} x {exportH} px &middot; &le;{MAX_TARGET_SIZE_KB}KB{estimatedSize && <span className="text-accent"> &middot; Est. {estimatedSize}</span>}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground/70">{t.clientSideInfo}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-center text-muted-foreground/40 font-mono tracking-wide select-none">
                          Arrow keys nudge &middot; R center &middot; Esc clear &middot; Ctrl+D save
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {t.howTo.map((s: { step: string; title: string; desc: string }) => (
                  <div key={s.step} className="p-3 rounded-xl bg-background border border-primary/5 space-y-1">
                    <span className="text-2xl font-black text-primary/10">{s.step}</span>
                    <p className="text-[11px] font-black uppercase tracking-tight text-primary">{s.title}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2 — Batch Rename (for Body / Gallery / Grid images)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === "rename" && (
            <motion.div
              key="rename-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Header bar */}
              <div className="sticky top-3 z-20 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-background/70 px-4 py-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/10">
                    <Tags className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black uppercase tracking-[0.24em] text-accent">Batch Convert &amp; Rename</p>
                    <p className="text-[11px] text-muted-foreground">Body / Gallery / Grid &middot; convert to WebP &middot; target &le;120KB</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button type="button" size="sm" variant="outline" onClick={() => renameFileInputRef.current?.click()} className="rounded-full gap-2 font-bold uppercase tracking-widest border-accent/20 bg-background/70">
                    <Upload className="h-3.5 w-3.5" /> Add Images
                  </Button>
              {files.length > 0 && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={downloadAll}
                        disabled={files.some((f) => f.status === "pending" || f.status === "converting")}
                        className="rounded-full gap-2 font-black uppercase tracking-widest bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90 disabled:opacity-50"
                      >
                        {renameCompressLoading
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Download className="h-3.5 w-3.5" />
                        }
                        {renameCompressLoading ? `Converting... ${Math.round(renameCompressProgress)}%` : `Download All (${files.filter(f => f.status === "done").length})`}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={clearAll} className="rounded-full gap-2 font-bold uppercase tracking-widest border-destructive/20 text-destructive bg-background/70 hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" /> Clear All
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <input
                ref={renameFileInputRef}
                type="file"
                accept="image/*,.avif"
                multiple
                className="sr-only"
                onChange={renameHandleFileInput}
              />

              {/* Image Type Selector + Settings */}
              <Card className="rounded-2xl border border-accent/10 bg-background/60">
                <CardContent className="p-5 space-y-4">

                  {/* Type selector — compact pill row */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Image Type</p>
                    <div className="flex items-stretch gap-2 rounded-xl border border-accent/10 bg-background/50 p-1">
                      {(Object.entries(ARTICLE_IMAGE_CONFIG) as [ArticleImageType, typeof ARTICLE_IMAGE_CONFIG[ArticleImageType]][]).map(([type, config]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setImageType(type)}
                          title={config.description}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-0.5 rounded-lg py-2 px-1 text-center transition-all",
                            imageType === type
                              ? "bg-accent text-accent-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{config.label}</span>
                          <span className={cn(
                            "font-mono text-[8px] leading-tight",
                            imageType === type ? "text-accent-foreground/70" : "text-muted-foreground/50",
                          )}>
                            {type === "body" ? "01-name.webp" : `${config.prefix}01.webp`}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[9px] text-muted-foreground/50">{ARTICLE_IMAGE_CONFIG[imageType].description}</p>
                  </div>

                  {/* Start index override */}
                  <div className="flex items-center gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground shrink-0">Start at #</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setStartIndex(Math.max(1, startIndex - 1))}
                        disabled={startIndex <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-40"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[3ch] text-center font-mono text-sm font-bold text-foreground">{startIndex}</span>
                      <button
                        type="button"
                        onClick={() => setStartIndex(startIndex + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">Useful when continuing from an existing article folder</p>
                  </div>

                  {/* Naming preview */}
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Output Pattern Preview</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: Math.min(4, ARTICLE_IMAGE_CONFIG[imageType].groupSize * 2) }, (_, i) => {
                        const idx = startIndex + i;
                        const name = imageType === "body"
                          ? `${String(idx).padStart(2, "0")}-image-name.webp`
                          : `${ARTICLE_IMAGE_CONFIG[imageType].prefix}${String(idx).padStart(2, "0")}.webp`;
                        return (
                          <span key={i} className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-[10px] text-accent">
                            {name}
                          </span>
                        );
                      })}
                      <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground/50">...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Drop Zone (when no files) */}
              {files.length === 0 && (
                <div
                  onDrop={renameHandleDrop}
                  onDragOver={renameHandleDragOver}
                  onDragLeave={renameHandleDragLeave}
                  onClick={() => renameFileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed transition-all duration-300 py-16 px-6 text-center min-h-[240px] bg-gradient-to-b from-background to-muted/20 cursor-pointer",
                    renameDragging ? "border-accent bg-accent/5 scale-[1.01]" : "border-accent/15 hover:border-accent/30 hover:bg-muted/20",
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-accent/10 text-accent ring-1 ring-accent/10 shadow-sm">
                    <FileImage className="h-7 w-7 text-accent/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-accent uppercase tracking-[0.18em]">Drop images here</p>
                    <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                      PNG, JPG, WebP, AVIF &mdash; each file is converted &amp; compressed to WebP &le;120KB, then saved with the correct name.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5">
                    <Tags className="h-3 w-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Convert &middot; Compress &middot; Rename &middot; 100% client-side</span>
                  </div>
                </div>
              )}

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div
                    onDrop={renameHandleDrop}
                    onDragOver={renameHandleDragOver}
                    onDragLeave={renameHandleDragLeave}
                    onClick={() => renameFileInputRef.current?.click()}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-[11px] font-bold text-muted-foreground transition-all cursor-pointer",
                      renameDragging ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-accent/30 hover:text-accent",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" /> Drop more or click to add
                  </div>

                  {files.map((file, idx) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border bg-background/60 p-3 transition-colors",
                        file.status === "converting" ? "border-accent/40 bg-accent/5" :
                        file.status === "error" ? "border-destructive/30" :
                        file.status === "done" ? "border-emerald-500/20" : "border-border",
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-12 w-20 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.objectUrl}
                          alt={file.originalName}
                          className="h-12 w-20 rounded-lg object-cover border border-border"
                        />
                        {/* Status overlay */}
                        {file.status === "converting" && convertingId === file.id && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          </div>
                        )}
                        {file.status === "done" && (
                          <div className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          </div>
                        )}
                        {file.status === "error" && (
                          <div className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white">
                            <AlertCircle className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-[10px] text-muted-foreground/60 font-mono">{file.originalName}</p>
                        <p className="truncate font-mono text-[12px] font-bold text-accent">{file.outputName}</p>
                        <div className="flex items-center gap-2">
                          {file.status === "done" && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {(file.size / 1024).toFixed(0)} KB
                              {file.size < file.originalSize && (
                                <span className="text-muted-foreground/50 font-normal"> (was {(file.originalSize / 1024).toFixed(0)} KB)</span>
                              )}
                            </span>
                          )}
                          {file.status === "pending" && (
                            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">Queued...</span>
                          )}
                          {file.status === "converting" && (
                            <span className="text-[9px] text-accent uppercase tracking-wider animate-pulse">Converting...</span>
                          )}
                          {file.status === "error" && (
                            <span className="text-[9px] text-destructive uppercase tracking-wider">Convert failed</span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => moveFile(file.id, "up")} disabled={idx === 0} title="Move up" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveFile(file.id, "down")} disabled={idx === files.length - 1} title="Move down" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile(file)}
                          disabled={file.status !== "done"}
                          title={file.status === "done" ? "Download" : "Waiting for conversion"}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-30"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeFile(file.id)} title="Remove" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* How-to */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {[
                  { step: "01", title: "Choose Type", desc: "Pick Body Image, Gallery, or Grid depending on how this image will appear in the article." },
                  { step: "02", title: "Drop Images", desc: "PNG, JPG, WebP, or AVIF — all formats accepted. Files are auto-converted to WebP and compressed to ≤120KB." },
                  { step: "03", title: "Download All", desc: "Files are saved with the correct naming convention, ready for your staging folder." },
                ].map((s) => (
                  <div key={s.step} className="p-3 rounded-xl bg-background border border-accent/5 space-y-1">
                    <span className="text-2xl font-black text-accent/10">{s.step}</span>
                    <p className="text-[11px] font-black uppercase tracking-tight text-accent">{s.title}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </ToolWrapper>
  );
}
