"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { EXPORT_WIDTH, EXPORT_HEIGHT, MAX_TARGET_SIZE_KB, type ImageCropTranslations } from "./image-crop/types";
import { CropPreview, InfoPill } from "./image-crop/crop-preview";
import { useImageCrop } from "./image-crop/use-image-crop";

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
interface ToolImageCropProps {
  dictionary: Dictionary;
}

export function ToolImageCrop({ dictionary }: ToolImageCropProps) {
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
      {
        step: "01",
        title: "Upload Image",
        desc: "Drop or pick any image from screenshots or files.",
      },
      {
        step: "02",
        title: "Drag to Reposition",
        desc: "Click and drag the preview directly to position the 16:9 crop window.",
      },
      {
        step: "03",
        title: "Download WebP",
        desc: "Get a perfectly cropped .webp ready to use in your articles.",
      },
    ],
  };

  const hook = useImageCrop(t);
  const {
    imageSrc, imgW, imgH, fileName, isDragging, isProcessing, estimatedSize,
    offsetX, setOffsetX, offsetY, setOffsetY, cropScale,
    fileInputRef,
    maxCropW, maxCropH, cropW, cropH, maxOffsetX, maxOffsetY,
    cropX, cropY, canSlideX, canSlideY, canDrag, isAlready169,
    compressLoading, compressProgress, compressError,
    handleFileInput, handleDrop, handleDragOver, handleDragLeave,
    handleReposition, handleBrowseFiles, handleDownload,
    handleReset, handleResize,
  } = hook;

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <ToolWrapper
      title={toolMeta.title}
      description={toolMeta.description}
      dictionary={dictionary}
      isPublic={true}
      requiresCloud={false}
    >
      <div className="space-y-5 mt-4">
        {/* Top bar - towebp-like file actions */}
        <div className="sticky top-3 z-20 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-background/70 px-4 py-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <Crop className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-black uppercase tracking-[0.24em] text-primary">Image Crop</p>
              <p className="text-[11px] text-muted-foreground">Client-side crop · auto WebP · target ≤120KB</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              onClick={handleBrowseFiles}
              size="sm"
              variant="outline"
              className="rounded-full gap-2 font-bold uppercase tracking-widest border-primary/15 bg-background/70"
            >
              <Upload className="h-3.5 w-3.5" />
              Add Files
            </Button>
            {imageSrc && (
              <Button
                type="button"
                onClick={handleDownload}
                disabled={isProcessing}
                size="sm"
                className="rounded-full gap-2 font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {isProcessing ? "Processing..." : t.downloadButton}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              size="sm"
              className="rounded-full gap-2 font-bold uppercase tracking-widest border-primary/15 bg-background/70"
            >
              <X className="h-3.5 w-3.5" />
              Clear Queue
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          id="image-upload-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileInput}
        />

        {/* Compression Progress/Error */}
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
              <X className="h-3 w-3" />
              <span>Error: {compressError}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!imageSrc ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <label htmlFor="image-upload-input" className="cursor-pointer block">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed transition-all duration-300 py-16 px-6 text-center min-h-[280px] bg-gradient-to-b from-background to-muted/20 shadow-[0_18px_60px_-28px_rgba(0,0,0,0.45)]",
                    isDragging
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : "border-primary/10 hover:border-primary/30 hover:bg-muted/30",
                  )}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10 text-primary ring-1 ring-primary/10 shadow-sm">
                    <Upload className="h-8 w-8 text-primary/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-primary uppercase tracking-[0.18em] text-base">
                      {t.dropTitle}
                    </p>
                    <p className="text-xs text-muted-foreground md:max-w-[280px] mx-auto leading-relaxed">
                      {t.dropDescription}
                      <br className="hidden sm:block" />
                      <span className="hidden sm:inline">({t.pasteHint})</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 backdrop-blur-sm">
                    <Crop className="h-3 w-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                      {t.outputBadge} · {EXPORT_WIDTH}x{EXPORT_HEIGHT}
                    </span>
                  </div>
                </div>
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-2">
                <InfoPill label={t.original} value={`${imgW} × ${imgH}`} />
                <InfoPill label={t.ratio} value={(imgW / imgH).toFixed(3)} />
                <InfoPill label={t.target} value={`${EXPORT_WIDTH} × ${EXPORT_HEIGHT}`} />
                {isAlready169 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.already169}
                  </div>
                )}
              </div>

              {/* Draggable + resizable preview - more compact */}
              <CropPreview
                imageSrc={imageSrc}
                imgW={imgW}
                imgH={imgH}
                cropX={cropX}
                cropY={cropY}
                cropW={cropW}
                cropH={cropH}
                maxCropW={maxCropW}
                maxCropH={maxCropH}
                cropScale={cropScale}
                canDrag={canDrag}
                onReposition={handleReposition}
                onResize={handleResize}
                currentOffsetX={offsetX}
                currentOffsetY={offsetY}
                maxOffsetX={maxOffsetX}
                maxOffsetY={maxOffsetY}
                dragHint={t.dragHint}
                removeImageLabel={t.removeImage}
                imageAlt={t.previewAlt}
                onReset={handleReset}
              />

              {/* Fine-tune sliders - Simplified & compact */}
              <Card className="rounded-[28px] border border-white/10 bg-background/75 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <CardContent className="p-5 space-y-4">
                  {/* Horizontal slider */}
                  <div className={cn("space-y-1.5", !canSlideX && "opacity-35 pointer-events-none")}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t.horizontal}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {canSlideX ? `x: ${cropX}px` : t.noAdjustment}
                      </span>
                    </div>
                    <Slider
                      value={[offsetX * 100]}
                      onValueChange={([v]) => setOffsetX(v / 100)}
                      min={0} max={100} step={0.5}
                      disabled={!canSlideX}
                    />
                  </div>

                  {/* Vertical slider */}
                  <div className={cn("space-y-1.5", !canSlideY && "opacity-35 pointer-events-none")}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t.vertical}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {canSlideY ? `y: ${cropY}px` : t.noAdjustment}
                      </span>
                    </div>
                    <Slider
                      value={[offsetY * 100]}
                      onValueChange={([v]) => setOffsetY(v / 100)}
                      min={0} max={100} step={0.5}
                      disabled={!canSlideY}
                    />
                  </div>

                  {/* Center button */}
                  {canDrag && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => { setOffsetX(0.5); setOffsetY(0.5); }}
                        className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-muted/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/40 hover:text-primary"
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                        {t.center}
                      </button>
                    </div>
                  )}

                  <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

                  {/* Output info - Simplified, no quality slider */}
                  <div className="rounded-2xl border border-primary/5 bg-muted/20 p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div className="text-[11px] leading-relaxed text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-primary">{fileName}-1920x1080.webp</span>
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
                            auto quality
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-primary">
                          {EXPORT_WIDTH} × {EXPORT_HEIGHT} px · ≤{MAX_TARGET_SIZE_KB}KB
                          {estimatedSize && <span className="text-accent"> · Est. {estimatedSize}</span>}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">{t.clientSideInfo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard hints */}
                  <p className="text-[9px] text-center text-muted-foreground/40 font-mono tracking-wide select-none">
                    ←→↑↓ nudge · R center · Esc clear · Ctrl+D save
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How-to - Simplified */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {t.howTo.map((s: { step: string; title: string; desc: string }) => (
            <div key={s.step} className="p-3 rounded-xl bg-background border border-primary/5 space-y-1">
              <span className="text-2xl font-black text-primary/10">{s.step}</span>
              <p className="text-[11px] font-black uppercase tracking-tight text-primary">{s.title}</p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ToolWrapper>
  );
}
