"use client";

import {
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, GripHorizontal } from "lucide-react";
import { MIN_SCALE, type ResizeCorner } from "./types";

// ──────────────────────────────────────────────────────────────────────────────
// Info Pill
// ──────────────────────────────────────────────────────────────────────────────
export function InfoPill({ label, value }: { label: string; value: string }) {
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

export function CropPreview({
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
