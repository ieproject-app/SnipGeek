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
} from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────
const TARGET_RATIO = 16 / 9;
const DEFAULT_QUALITY = 85;
const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;

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
  // Feature 9: rAF throttle for drag performance
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
  const topPct   = (cropY / imgH) * 100;
  const bottomPct = ((imgH - cropY - cropH) / imgH) * 100;
  const leftPct  = (cropX / imgW) * 100;
  const rightPct = ((imgW - cropX - cropW) / imgW) * 100;
  const cropWPct = (cropW / imgW) * 100;
  const cropHPct = (cropH / imgH) * 100;

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
    [canDrag, currentOffsetX, currentOffsetY],
  );

  // Feature 9: throttle via rAF — store latest pointer, only compute on next frame
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
    [imgW, imgH, maxOffsetX, maxOffsetY, onReposition],
  );

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    pendingMoveRef.current = null;
    resizeStartRef.current = null;
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
        // Display delta → image delta
        const dpxX = (clientX - r.clientX) * (imgW / r.rectW);
        const dpxY = (clientY - r.clientY) * (imgH / r.rectH);
        // Scale sign per corner: positive = grow when dragging outward
        const sx = (r.corner === "br" || r.corner === "tr") ? 1 : -1;
        const sy = (r.corner === "br" || r.corner === "bl") ? 1 : -1;
        const scaleDelta = ((dpxX * sx) / maxCropW + (dpxY * sy) / maxCropH) / 2;
        const newScale = Math.max(MIN_SCALE, Math.min(1.0, r.scale + scaleDelta));
        // Old/new crop dimensions in image space
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
        // Anchor opposite corner in image pixel space
        let newCX = r.corner === "tl" || r.corner === "bl" ? oldCX + oldCW - newCW : oldCX;
        let newCY = r.corner === "tl" || r.corner === "tr" ? oldCY + oldCH - newCH : oldCY;
        newCX = Math.max(0, Math.min(newMaxX, newCX));
        newCY = Math.max(0, Math.min(newMaxY, newCY));
        const newOX = newMaxX > 0 ? newCX / newMaxX : 0.5;
        const newOY = newMaxY > 0 ? newCY / newMaxY : 0.5;
        onResize(newScale, newOX, newOY);
      });
    },
    [imgW, imgH, maxCropW, maxCropH, onResize],
  );

  // Plain function — OK to mutate refs here (not inside useCallback)
  function startResize(e: ReactMouseEvent | ReactTouchEvent, corner: ResizeCorner) {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    // eslint-disable-next-line react-hooks/immutability
    resizeStartRef.current = {
      corner, clientX, clientY,
      scale: cropScale, offsetX: currentOffsetX, offsetY: currentOffsetY,
      rectW: rect.width, rectH: rect.height,
    };
  }

  // Global mouse/touch listeners — handles both reposition drag and corner resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (resizeStartRef.current) performResize(e.clientX, e.clientY);
      else moveDrag(e.clientX, e.clientY);
    };
    const onUp = () => endDrag();
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
            maxWidth: '100%',
            maxHeight: '55vh',
            aspectRatio: `${imgW} / ${imgH}`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Base image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-fill block pointer-events-none"
            draggable={false}
          />

          {/* Top dark overlay */}
          {topPct > 0.01 && (
            <div
              className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none"
              style={{ height: `${topPct}%` }}
            />
          )}
          {/* Bottom dark overlay */}
          {bottomPct > 0.01 && (
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none"
              style={{ height: `${bottomPct}%` }}
            />
          )}
          {/* Left dark overlay */}
          {leftPct > 0.01 && (
            <div
              className="absolute left-0 bg-black/65 pointer-events-none"
              style={{ top: `${topPct}%`, width: `${leftPct}%`, height: `${cropHPct}%` }}
            />
          )}
          {/* Right dark overlay */}
          {rightPct > 0.01 && (
            <div
              className="absolute right-0 bg-black/65 pointer-events-none"
              style={{ top: `${topPct}%`, width: `${rightPct}%`, height: `${cropHPct}%` }}
            />
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
            {/* Corner handles — interactive, pointer-events-auto */}
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

          {/* Drag hint (only when draggable) */}
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
  const toolMeta = dictionary?.tools?.tool_list?.image_crop || {
    title: "Image Crop",
    description: "Crop to 16:9 and export as WebP.",
  };
  const t = dictionary?.tools?.image_crop || {
    invalidImageFile: "Please upload a valid image file.",
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
    webpQuality: "WebP Quality",
    qualityHigh: "Lossless-class",
    qualityBalanced: "Balanced",
    qualitySmall: "Small size",
    defaultLabel: "85% default",
    outputLabel: "Output:",
    clientSideInfo: "100% client-side, no upload.",
    downloadButton: "Download WebP",
    loadAnother: "Load Another Image",
    dragHint: "Drag to reposition",
    removeImage: "Remove image",
    previewAlt: "Crop preview",
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

  // ── Crop position (0–1) ──
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);

  // ── Quality ──
  const [quality, setQuality] = useState(DEFAULT_QUALITY);

  // ── Feature 5: Estimated output size ──
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);
  const estimateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Feature 6: Smart auto-center ──
  const [smartCenter, setSmartCenter] = useState(true);

  // ── Crop scale (resize via corner handles, 0.15–1.0, maintains 16:9) ──
  const [cropScale, setCropScale] = useState(1.0);

  // ── Image element ref (used in download) ──
  const imageRef = useRef<HTMLImageElement | null>(null);

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
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          setImgW(img.naturalWidth);
          setImgH(img.naturalHeight);
          // Feature 6: Smart auto-center — for vertically-cropped images, bias upward
          // (subjects like faces/heads are usually in the upper portion of the frame)
          const { cropH: cH } = getCropBox(img.naturalWidth, img.naturalHeight);
          const mY = Math.max(0, img.naturalHeight - cH);
          const initY = (smartCenter && mY > 0) ? 0.35 : 0.5;
          setOffsetX(0.5);
          setOffsetY(initY);
          setEstimatedSize(null);
          setImageSrc(src);
          setFileName(file.name.replace(/\.[^.]+$/, ""));
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [notify, smartCenter, t.invalidImageFile],
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImage(file);
      e.target.value = "";
    },
    [loadImage],
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
    [loadImage],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleReposition = useCallback((newOX: number, newOY: number) => {
    setOffsetX(newOX);
    setOffsetY(newOY);
  }, []);

  // ── Download ──
  const handleDownload = useCallback(() => {
    const img = imageRef.current;
    if (!img || imgW === 0) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = EXPORT_WIDTH;
    offscreen.height = EXPORT_HEIGHT;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    offscreen.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}-1920x1080.webp`;
        a.click();
        URL.revokeObjectURL(url);
        const downloadedName = `${fileName}-1920x1080.webp`;
        notify(
          t.downloaded
            .replace("{filename}", downloadedName)
            .replace("{size}", formatBytes(blob.size)),
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
        );
      },
      "image/webp",
      quality / 100,
    );
  }, [cropH, cropW, cropX, cropY, fileName, imgW, notify, quality, t.downloaded]);

  // Feature 4: preserve quality when resetting — user's quality choice persists
  const handleReset = useCallback(() => {
    setImageSrc(null);
    setImgW(0); setImgH(0);
    setOffsetX(0.5); setOffsetY(0.5);
    setCropScale(1.0);
    setEstimatedSize(null);
    imageRef.current = null;
    if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current);
  }, []);

  const handleResize = useCallback(
    (newScale: number, newOffsetX: number, newOffsetY: number) => {
      setCropScale(newScale);
      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
    },
    [],
  );

  // ── Feature 5: Debounced estimated output size ──
  useEffect(() => {
    if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current);
    if (!imageRef.current || imgW === 0) {
      // Defer to avoid calling setState synchronously in effect body
      estimateTimerRef.current = setTimeout(() => setEstimatedSize(null), 0);
      return () => { if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current); };
    }
    estimateTimerRef.current = setTimeout(() => {
      const img = imageRef.current;
      if (!img) return;
      // Use 1/4-resolution canvas for fast non-blocking estimation
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
        (blob) => { if (blob) setEstimatedSize(formatBytes(blob.size * SCALE * SCALE)); },
        "image/webp",
        quality / 100,
      );
    }, 500);
    return () => { if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current); };
  }, [quality, cropX, cropY, cropW, cropH, imgW]);

  // ── Feature 8: Keyboard shortcuts ──
  useEffect(() => {
    if (!imageSrc) return;
    const STEP = 0.02;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowLeft":  e.preventDefault(); setOffsetX((p) => Math.max(0, p - STEP)); break;
        case "ArrowRight": e.preventDefault(); setOffsetX((p) => Math.min(1, p + STEP)); break;
        case "ArrowUp":    e.preventDefault(); setOffsetY((p) => Math.max(0, p - STEP)); break;
        case "ArrowDown":  e.preventDefault(); setOffsetY((p) => Math.min(1, p + STEP)); break;
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
      <div className="space-y-6 mt-4">
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
                    "relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed transition-all duration-300 py-16 px-8 text-center",
                    isDragging
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : "border-primary/15 bg-muted/20 hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  <div className="p-5 rounded-full bg-primary/5 border border-primary/10">
                    <Upload className="h-10 w-10 text-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-primary uppercase tracking-tight text-lg">
                      {t.dropTitle}
                    </p>
                    <p className="text-sm text-muted-foreground md:max-w-[280px] mx-auto">
                      {t.dropDescription}
                      <br className="hidden sm:block" />
                      <span className="hidden sm:inline">({t.pasteHint})</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                    <Crop className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-bold text-accent uppercase tracking-widest">
                      {t.outputBadge} · {EXPORT_WIDTH}x{EXPORT_HEIGHT}
                    </span>
                  </div>
                </div>
              </label>
              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileInput}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-3">
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

              {/* Draggable + resizable preview */}
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

              {/* Fine-tune sliders + quality */}
              <Card className="rounded-2xl border-primary/10 bg-card/50">
                <CardContent className="p-5 space-y-5">

                  {/* Horizontal slider */}
                  <div className={cn("space-y-2", !canSlideX && "opacity-35 pointer-events-none")}>
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
                  <div className={cn("space-y-2", !canSlideY && "opacity-35 pointer-events-none")}>
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

                  {/* Center + Smart Center toggle */}
                  {canDrag && (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setOffsetX(0.5); setOffsetY(0.5); }}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-muted-foreground border border-primary/10 bg-muted/20 hover:border-primary/30 hover:text-primary hover:bg-muted/40 transition-all"
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                        {t.center}
                      </button>
                      {/* Feature 6: Smart Center toggle */}
                      <button
                        type="button"
                        title="Auto-position crop for portrait subjects"
                        onClick={() => setSmartCenter((v) => !v)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all",
                          smartCenter
                            ? "bg-accent/15 border-accent/30 text-accent"
                            : "border-primary/10 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-primary",
                        )}
                      >
                        <Info className="h-3.5 w-3.5" />
                        Smart Center
                      </button>
                    </div>
                  )}

                  <div className="h-px bg-primary/5" />

                  {/* WebP quality */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {t.webpQuality}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-accent font-mono">{quality}%</span>
                        <span className="text-[10px] text-muted-foreground">
                          {quality >= 90 ? `· ${t.qualityHigh}` : quality >= 75 ? `· ${t.qualityBalanced}` : `· ${t.qualitySmall}`}
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[quality]}
                      onValueChange={([v]) => setQuality(v)}
                      min={40} max={100} step={1}
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono">
                      <span>40%</span><span>{t.defaultLabel}</span><span>100%</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-primary/5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t.outputLabel}{" "}
                      <span className="font-mono font-bold text-primary">{fileName}-1920x1080.webp</span>
                      {" "}—{" "}
                      <span className="font-mono font-bold text-primary">{EXPORT_WIDTH} × {EXPORT_HEIGHT} px</span>.
                      {" "}{t.clientSideInfo}
                      {/* Feature 5: Estimated size */}
                      {estimatedSize && (
                        <>{" "}·{" "}
                          <span className="font-mono font-bold text-accent">Est. {estimatedSize}</span>
                        </>
                      )}
                    </p>
                  </div>
                  {/* Feature 8: Keyboard hints */}
                  <p className="text-[9px] text-center text-muted-foreground/35 font-mono tracking-wide select-none pt-1">
                    ← → ↑ ↓ nudge · R center · Esc clear · Ctrl+D save
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="rounded-full gap-2.5 font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
                >
                  <Download className="h-4 w-4" />
                  {t.downloadButton}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="rounded-full gap-2 font-bold uppercase tracking-widest border-primary/15 hover:border-primary/40"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.loadAnother}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How-to */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {t.howTo.map((s: { step: string; title: string; desc: string }) => (
            <div key={s.step} className="p-4 rounded-xl bg-background border border-primary/5 space-y-1.5">
              <span className="text-3xl font-black text-primary/10">{s.step}</span>
              <p className="text-xs font-black uppercase tracking-tight text-primary">{s.title}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ToolWrapper>
  );
}
