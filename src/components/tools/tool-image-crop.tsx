"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { useNotification } from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/get-dictionary";
import {
  Upload,
  Download,
  Image as ImageIcon,
  RefreshCw,
  AlignCenter,
  Crop,
  Info,
  CheckCircle2,
  X,
  GripHorizontal,
  Loader2,
} from "lucide-react";
import { useImageCompress } from "@/hooks/use-image-compress";

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────
const TARGET_RATIO = 16 / 9;
const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;
const MAX_TARGET_SIZE_KB = 120; // Target max file size

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getCropBox(imgW: number, imgH: number): { cropW: number; cropH: number } {
  const imgRatio = imgW / imgH;
  if (imgRatio > TARGET_RATIO) {
    // Wider than 16:9 → crop sides
    const cropH = imgH;
    const cropW = Math.round(imgH * TARGET_RATIO);
    return { cropW, cropH };
  } else {
    // Taller than 16:9 → crop top/bottom
    const cropW = imgW;
    const cropH = Math.round(imgW / TARGET_RATIO);
    return { cropW, cropH };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Info Pill
// ──────────────────────────────────────────────────────────────────────────────
function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl bg-muted/40 border border-primary/5 min-w-[100px]">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-black text-primary font-mono">{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// WASM Loading Progress
// ──────────────────────────────────────────────────────────────────────────────
function WasmLoadingIndicator({
  progress,
  useFallback,
}: {
  progress: number;
  useFallback: boolean;
}) {
  if (useFallback) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
        <Info className="h-3 w-3" />
        <span>Using basic mode</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Loading optimizer... {progress}%</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Crop Preview — CSS overlay + drag to reposition
// ──────────────────────────────────────────────────────────────────────────────
type ResizeCorner = "tl" | "tr" | "bl" | "br";
const MIN_SCALE = 0.15;

interface CropPreviewProps {
  imageSrc: string;
  imageAlt: string;
  imgW: number;
  imgH: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  maxCropW: number;
  maxCropH: number;
  cropScale: number;
  canDrag: boolean;
  onReposition: (newOffsetX: number, newOffsetY: number) => void;
  onResize: (newScale: number, newOffsetX: number, newOffsetY: number) => void;
  currentOffsetX: number;
  currentOffsetY: number;
  maxOffsetX: number;
  maxOffsetY: number;
  dragHint: string;
  removeImageLabel: string;
  onReset: () => void;
}

function CropPreview({
  imageSrc,
  imageAlt,
  imgW,
  imgH,
  cropX,
  cropY,
  cropW,
  cropH,
  maxCropW,
  maxCropH,
  cropScale,
  canDrag,
  onReposition,
  onResize,
  currentOffsetX,
  currentOffsetY,
  maxOffsetX,
  maxOffsetY,
  dragHint,
  removeImageLabel,
  onReset,
}: CropPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
    rectW: number;
    rectH: number;
  } | null>(null);

  // % positions for the overlay divs
  const topPct = (cropY / imgH) * 100;
  const bottomPct = ((imgH - cropY - cropH) / imgH) * 100;
  const leftPct = (cropX / imgW) * 100;
  const rightPct = ((imgW - cropX - cropW) / imgW) * 100;
  const cropWPct = (cropW / imgW) * 100;
  const cropHPct = (cropH / imgH) * 100;

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // ── Drag helpers ──
  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!canDrag || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      isDraggingRef.current = true;
      dragStartRef.current = {
        clientX,
        clientY,
        offsetX: currentOffsetX,
        offsetY: currentOffsetY,
        rectW: rect.width,
        rectH: rect.height,
      };
    },
    [canDrag, currentOffsetX, currentOffsetY]
  );

  // rAF throttle for drag performance
  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStartRef.current) return;
      pendingMoveRef.current = { clientX, clientY };
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!dragStartRef.current || !pendingMoveRef.current) return;
        const { clientX: sx, clientY: sy, offsetX: ox, offsetY: oy, rectW, rectH } = dragStartRef.current;
        const { clientX: cx, clientY: cy } = pendingMoveRef.current;
        const dpxX = cx - sx;
        const dpxY = cy - sy;
        const imgPxX = dpxX * (imgW / rectW);
        const imgPxY = dpxY * (imgH / rectH);
        const newOX = maxOffsetX > 0
          ? Math.max(0, Math.min(1, ox + imgPxX / maxOffsetX))
          : ox;
        const newOY = maxOffsetY > 0
          ? Math.max(0, Math.min(1, oy + imgPxY / maxOffsetY))
          : oy;
        onReposition(newOX, newOY);
      });
    },
    [imgW, imgH, maxOffsetX, maxOffsetY, onReposition]
  );

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    pendingMoveRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ── Corner resize state ──
  const resizeStartRef = useRef<{
    corner: ResizeCorner;
    clientX: number; clientY: number;
    scale: number; offsetX: number; offsetY: number;
    rectW: number; rectH: number;
  } | null>(null);

  const performResize = useCallback(
    (clientX: number, clientY: number) => {
      if (!resizeStartRef.current) return;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const r = resizeStartRef.current;
        if (!r) return;
        const dpxX = (clientX - r.clientX) * (imgW / r.rectW);
        const dpxY = (clientY - r.clientY) * (imgH / r.rectH);
        const sx = (r.corner === "br" || r.corner === "tr") ? 1 : -1;
        const sy = (r.corner === "br" || r.corner === "bl") ? 1 : -1;
        const scaleDelta = ((dpxX * sx) / maxCropW + (dpxY * sy) / maxCropH) / 2;
        const newScale = Math.max(MIN_SCALE, Math.min(1.0, r.scale + scaleDelta));
        const oldCW = Math.round(maxCropW * r.scale);
        const oldCH = Math.round(maxCropH * r.scale);
        const newCW = Math.round(maxCropW * newScale);
        const newCH = Math.round(maxCropH * newScale);
        const oldMaxX = Math.max(0, imgW - oldCW);
        const oldMaxY = Math.max(0, imgH - oldCH);
        const oldCX = Math.round(oldMaxX * r.offsetX);
        const oldCY = Math.round(oldMaxY * r.offsetY);
        const newMaxX = Math.max(0, imgW - newCW);
        const newMaxY = Math.max(0, imgH - newCH);
        let newCX = r.corner === "tl" || r.corner === "bl" ? oldCX + oldCW - newCW : oldCX;
        let newCY = r.corner === "tl" || r.corner === "tr" ? oldCY + oldCH - newCH : oldCY;
        newCX = Math.max(0, Math.min(newMaxX, newCX));
        newCY = Math.max(0, Math.min(newMaxY, newCY));
        const newOX = newMaxX > 0 ? newCX / newMaxX : 0.5;
        const newOY = newMaxY > 0 ? newCY / newMaxY : 0.5;
        onResize(newScale, newOX, newOY);
      });
    },
    [imgW, imgH, maxCropW, maxCropH, onResize]
  );

  function startResize(e: ReactMouseEvent | ReactTouchEvent, corner: ResizeCorner) {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = {
      corner, clientX, clientY,
      scale: cropScale, offsetX: currentOffsetX, offsetY: currentOffsetY,
      rectW: rect.width, rectH: rect.height,
    };
  }

  // Global mouse/touch listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (resizeStartRef.current) performResize(e.clientX, e.clientY);
      else moveDrag(e.clientX, e.clientY);
    };
    const onUp = () => {
      resizeStartRef.current = null;
      endDrag();
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (resizeStartRef.current) performResize(e.touches[0].clientX, e.touches[0].clientY);
      else moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [moveDrag, endDrag, performResize]);

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (!canDrag) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    if (!canDrag) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-primary/10 shadow-xl mx-auto w-fit max-w-full">
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className={cn(
            "relative overflow-hidden rounded-2xl select-none",
            canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          )}
          style={{
            maxWidth: "100%",
            maxHeight: "55vh",
            aspectRatio: `${imgW} / ${imgH}`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-fill block pointer-events-none"
            draggable={false}
          />

          {/* Overlays */}
          {topPct > 0.01 && (
            <div className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none" style={{ height: `${topPct}%` }} />
          )}
          {bottomPct > 0.01 && (
            <div className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none" style={{ height: `${bottomPct}%` }} />
          )}
          {leftPct > 0.01 && (
            <div className="absolute left-0 bg-black/65 pointer-events-none" style={{ top: `${topPct}%`, width: `${leftPct}%`, height: `${cropHPct}%` }} />
          )}
          {rightPct > 0.01 && (
            <div className="absolute right-0 bg-black/65 pointer-events-none" style={{ top: `${topPct}%`, width: `${rightPct}%`, height: `${cropHPct}%` }} />
          )}

          {/* Crop border box */}
          <div
            className="absolute border-2 border-sky-400"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${cropWPct}%`,
              height: `${cropHPct}%`,
              pointerEvents: "none",
            }}
          >
            {/* Corner handles */}
            <span
              className="absolute -top-1 -left-1 w-5 h-5 border-t-[3px] border-l-[3px] border-white rounded-tl cursor-nw-resize hover:border-sky-300 transition-colors"
              style={{ pointerEvents: "auto" }}
              onMouseDown={(e) => startResize(e, "tl")}
              onTouchStart={(e) => startResize(e, "tl")}
            />
            <span
              className="absolute -top-1 -right-1 w-5 h-5 border-t-[3px] border-r-[3px] border-white rounded-tr cursor-ne-resize hover:border-sky-300 transition-colors"
              style={{ pointerEvents: "auto" }}
              onMouseDown={(e) => startResize(e, "tr")}
              onTouchStart={(e) => startResize(e, "tr")}
            />
            <span
              className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3px] border-l-[3px] border-white rounded-bl cursor-sw-resize hover:border-sky-300 transition-colors"
              style={{ pointerEvents: "auto" }}
              onMouseDown={(e) => startResize(e, "bl")}
              onTouchStart={(e) => startResize(e, "bl")}
            />
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3px] border-r-[3px] border-white rounded-br cursor-se-resize hover:border-sky-300 transition-colors"
              style={{ pointerEvents: "auto" }}
              onMouseDown={(e) => startResize(e, "br")}
              onTouchStart={(e) => startResize(e, "br")}
            />

            {/* 16:9 label + scale */}
            <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-sky-400 text-[10px] font-bold font-mono pointer-events-none">
              16 : 9 · {Math.round(cropScale * 100)}%
            </span>
          </div>

          {/* Drag hint */}
          {canDrag && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm pointer-events-none">
              <GripHorizontal className="h-3.5 w-3.5 text-white/80" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{dragHint}</span>
            </div>
          )}

          {/* Reset button */}
          <button
            type="button"
            aria-label={removeImageLabel}
            onClick={onReset}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-background/70 backdrop-blur-sm border border-primary/10 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
interface ToolImageCropProps {
  dictionary: Dictionary;
}

export function ToolImageCrop({ dictionary }: ToolImageCropProps) {
  const { notify } = useNotification();
  const { loading: compressLoading, progress: compressProgress, error: compressError, encodeWithAutoQuality } = useImageCompress();

  const toolMeta = dictionary?.tools?.tool_list?.image_crop || {
    title: "Image Crop",
    description: "Crop to 16:9 and export as WebP.",
  };

  const t = dictionary?.tools?.image_crop || {
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

  // ── Image state ──
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [fileName, setFileName] = useState("output");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);

  // ── Crop position (0–1) ──
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);

  // ── Crop scale ──
  const [cropScale, setCropScale] = useState(1.0);

  // ── Refs ──
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourceFileRef = useRef<File | null>(null);
  const estimateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // ── Cleanup function ──
  const cleanupImage = useCallback(() => {
    // Revoke object URL if exists
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    // Clear image ref
    if (imageRef.current) {
      imageRef.current.onload = null;
      imageRef.current.onerror = null;
      imageRef.current = null;
    }
    // Clear estimate timer
    if (estimateTimerRef.current) {
      clearTimeout(estimateTimerRef.current);
      estimateTimerRef.current = null;
    }
  }, []);

  // ── Derived values ──
  const { cropW: maxCropW, cropH: maxCropH } = imgW > 0 ? getCropBox(imgW, imgH) : { cropW: 0, cropH: 0 };
  const cropW = Math.round(maxCropW * cropScale);
  const cropH = Math.round(maxCropH * cropScale);
  const maxOffsetX = Math.max(0, imgW - cropW);
  const maxOffsetY = Math.max(0, imgH - cropH);
  const cropX = Math.round(maxOffsetX * offsetX);
  const cropY = Math.round(maxOffsetY * offsetY);
  const canSlideX = maxOffsetX > 0;
  const canSlideY = maxOffsetY > 0;
  const canDrag = canSlideX || canSlideY;
  const isAlready169 = imgW > 0 && Math.abs(imgW / imgH - TARGET_RATIO) < 0.01;

  // ── Load image from file ──
  const loadImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        notify(t.invalidImageFile, <X className="h-4 w-4 text-destructive" />);
        return;
      }

      // Cleanup previous
      cleanupImage();
      sourceFileRef.current = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (!src) return;

        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          setImgW(img.naturalWidth);
          setImgH(img.naturalHeight);
          setOffsetX(0.5);
          setOffsetY(0.5);
          setCropScale(1.0);
          setEstimatedSize(null);
          setImageSrc(src);
          setFileName(file.name.replace(/\.[^.]+$/, ""));
        };
        img.onerror = () => {
          notify(t.imageLoadError, <X className="h-4 w-4 text-destructive" />);
          cleanupImage();
        };
        img.src = src;
      };
      reader.onerror = () => {
        notify(t.invalidImageFile, <X className="h-4 w-4 text-destructive" />);
      };
      reader.readAsDataURL(file);
    },
    [notify, t.invalidImageFile, t.imageLoadError, cleanupImage]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImage(file);
      e.target.value = "";
    },
    [loadImage]
  );

  // ── Global Paste Support ──
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            loadImage(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [loadImage]);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleReposition = useCallback((newOX: number, newOY: number) => {
    setOffsetX(newOX);
    setOffsetY(newOY);
  }, []);

  const handleBrowseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Download with auto-quality canvas encoding ──
  const handleDownload = useCallback(async () => {
    const img = imageRef.current;
    if (!img || imgW === 0) return;

    const sourceFile = sourceFileRef.current;
    const sourceIsWebP = sourceFile?.type === "image/webp";
    const sourceSizeKB = sourceFile ? sourceFile.size / 1024 : null;
    const sourceSizeBytes = sourceFile?.size ?? null;

    const primaryTargetKB = sourceIsWebP && sourceSizeKB
      ? Math.min(MAX_TARGET_SIZE_KB, Math.max(1, Math.floor(sourceSizeKB - 2)))
      : MAX_TARGET_SIZE_KB;
    const primaryMaxQuality = sourceIsWebP ? 80 : 85;
    const primaryMinQuality = sourceIsWebP ? 20 : 45;

    setIsProcessing(true);

    try {
      // Create canvas at export size
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas context failed");

      // Draw cropped image scaled to export size
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      // Encode with automatic quality search to stay under target size
      const { blob: compressedBlob, finalQuality } = await encodeWithAutoQuality(
        canvas,
        primaryTargetKB,
        primaryMaxQuality,
        primaryMinQuality
      );

      let outputBlob = compressedBlob;
      if (!outputBlob && sourceIsWebP && sourceFile) {
        outputBlob = sourceFile;
      }

      if (!outputBlob) {
        outputBlob = await new Promise<Blob | null>((resolve) => {
          try {
            canvas.toBlob((blob) => resolve(blob), "image/png");
          } catch (error) {
            console.warn("[ImageCrop] PNG fallback toBlob threw:", error);
            resolve(null);
          }
        });
      }

      if (!outputBlob) {
        notify(t.downloadError, <X className="h-4 w-4 text-destructive" />);
        return;
      }

      let outputQuality = finalQuality;
      const outputIsSourceFallback = !!sourceIsWebP && !!sourceFile && outputBlob === sourceFile;

      if (sourceIsWebP && sourceFile && outputBlob.type !== "image/webp") {
        outputBlob = sourceFile;
      }

      if (
        sourceIsWebP &&
        sourceSizeBytes !== null &&
        outputBlob.size >= sourceSizeBytes
      ) {
        const retryPolicies = [
          { targetKB: Math.max(1, Math.floor(sourceSizeKB ? sourceSizeKB * 0.85 : primaryTargetKB)), maxQuality: 70, minQuality: 10 },
          { targetKB: Math.max(1, Math.floor(sourceSizeKB ? sourceSizeKB * 0.75 : primaryTargetKB)), maxQuality: 60, minQuality: 5 },
        ];

        for (const policy of retryPolicies) {
          const retryResult = await encodeWithAutoQuality(canvas, policy.targetKB, policy.maxQuality, policy.minQuality);

          if (retryResult.blob && retryResult.blob.size < outputBlob.size) {
            outputBlob = retryResult.blob;
            outputQuality = retryResult.finalQuality;
          }

          if (outputBlob.size < sourceSizeBytes) {
            break;
          }
        }
      }

      // Check size warning
      const sizeKB = outputBlob.size / 1024;
      const isLarge = sizeKB > MAX_TARGET_SIZE_KB;
      const isSmallerThanSource = sourceSizeBytes !== null ? outputBlob.size < sourceSizeBytes : true;
      
      const outputExt = outputBlob.type.includes("jpeg")
        ? "jpg"
        : outputBlob.type.includes("png")
          ? "png"
          : "webp";

      console.log(`[ImageCrop] Generated ${outputBlob.type || "image/webp"}: ${sizeKB.toFixed(1)}KB at ${outputQuality}% quality`, {
        sourceIsWebP,
        sourceSizeKB: sourceSizeKB?.toFixed(1),
        isSmallerThanSource,
        outputIsSourceFallback,
      });

      if (outputIsSourceFallback) {
        console.warn("[ImageCrop] Preserved original WebP source because the re-encoded result was not smaller.", {
          sourceSizeKB: sourceSizeKB?.toFixed(1),
        });
      }

      // Download
      const url = URL.createObjectURL(outputBlob);
      objectUrlRef.current = url;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}-1920x1080.${outputExt}`;
      a.click();

      // Notify with size info
      const downloadedName = `${fileName}-1920x1080.${outputExt}`;
      notify(
        <span>
          {t.downloaded
            .replace("{filename}", downloadedName)
            .replace("{size}", formatBytes(outputBlob.size))}
          {isLarge && (
            <span className="text-amber-500 ml-1">(&gt;{MAX_TARGET_SIZE_KB}KB)</span>
          )}
        </span>,
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      );
    } catch (err) {
      console.error("Download failed:", err);
      notify(t.downloadError, <X className="h-4 w-4 text-destructive" />);
    } finally {
      setIsProcessing(false);
    }
  }, [cropH, cropW, cropX, cropY, fileName, imgW, notify, t.downloaded, t.downloadError, encodeWithAutoQuality]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    cleanupImage();
    setImageSrc(null);
    setImgW(0);
    setImgH(0);
    sourceFileRef.current = null;
    setOffsetX(0.5);
    setOffsetY(0.5);
    setCropScale(1.0);
    setEstimatedSize(null);
  }, [cleanupImage]);

  const handleResize = useCallback(
    (newScale: number, newOffsetX: number, newOffsetY: number) => {
      setCropScale(newScale);
      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
    },
    []
  );

  // ── Debounced estimated output size ──
  useEffect(() => {
    if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current);
    if (!imageRef.current || imgW === 0) {
      estimateTimerRef.current = setTimeout(() => setEstimatedSize(null), 0);
      return () => { if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current); };
    }

    estimateTimerRef.current = setTimeout(() => {
      const img = imageRef.current;
      if (!img) return;

      // Use 1/4-resolution canvas for fast estimation
      const SCALE = 4;
      const estW = Math.round(EXPORT_WIDTH / SCALE);
      const estH = Math.round(EXPORT_HEIGHT / SCALE);
      const canvas = document.createElement("canvas");
      canvas.width = estW;
      canvas.height = estH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, estW, estH);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const estimatedBytes = blob.size * SCALE * SCALE;
            setEstimatedSize(formatBytes(estimatedBytes));
          }
        },
        "image/webp",
        0.8 // estimate at 80% quality
      );
    }, 500);

    return () => { if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current); };
  }, [cropX, cropY, cropW, cropH, imgW]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!imageSrc) return;
    const STEP = 0.02;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); setOffsetX((p) => Math.max(0, p - STEP)); break;
        case "ArrowRight": e.preventDefault(); setOffsetX((p) => Math.min(1, p + STEP)); break;
        case "ArrowUp": e.preventDefault(); setOffsetY((p) => Math.max(0, p - STEP)); break;
        case "ArrowDown": e.preventDefault(); setOffsetY((p) => Math.min(1, p + STEP)); break;
        case "r": case "R":
          if (!e.ctrlKey && !e.metaKey) { setOffsetX(0.5); setOffsetY(0.5); }
          break;
        case "Escape": handleReset(); break;
        case "d": case "D":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleDownload(); }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imageSrc, handleReset, handleDownload]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      cleanupImage();
    };
  }, [cleanupImage]);

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

