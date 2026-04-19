"use client";

import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent } from "react";
import { useNotification } from "@/hooks/use-notification";
import { useImageCompress } from "@/hooks/use-image-compress";
import {
  TARGET_RATIO,
  EXPORT_WIDTH,
  EXPORT_HEIGHT,
  MAX_TARGET_SIZE_KB,
  formatBytes,
  getCropBox,
  type ImageCropTranslations,
} from "./types";

export function useImageCrop(t: ImageCropTranslations) {
  const { notify } = useNotification();
  const { loading: compressLoading, progress: compressProgress, error: compressError, encodeWithAutoQuality } = useImageCompress();

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
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (imageRef.current) {
      imageRef.current.onload = null;
      imageRef.current.onerror = null;
      imageRef.current = null;
    }
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
      const isImageMime = file.type.startsWith("image/");
      const isAvifByExt = /\.avif$/i.test(file.name);
      if (!isImageMime && !isAvifByExt) {
        notify(t.invalidImageFile);
        return;
      }

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
          notify(t.imageLoadError);
          cleanupImage();
        };
        img.src = src;
      };
      reader.onerror = () => {
        notify(t.invalidImageFile);
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
        notify(t.downloadError);
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
      const sizeStr = formatBytes(outputBlob.size);
      const message = t.downloaded
        .replace("{filename}", downloadedName)
        .replace("{size}", sizeStr);
      notify(isLarge ? `${message} (>${MAX_TARGET_SIZE_KB}KB)` : message);
    } catch (err) {
      console.error("Download failed:", err);
      notify(t.downloadError);
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

  return {
    // State
    imageSrc, imgW, imgH, fileName, isDragging, isProcessing, estimatedSize,
    offsetX, setOffsetX, offsetY, setOffsetY, cropScale,
    fileInputRef,

    // Derived
    maxCropW, maxCropH, cropW, cropH, maxOffsetX, maxOffsetY,
    cropX, cropY, canSlideX, canSlideY, canDrag, isAlready169,

    // Compress state
    compressLoading, compressProgress, compressError,

    // Handlers
    handleFileInput, handleDrop, handleDragOver, handleDragLeave,
    handleReposition, handleBrowseFiles, handleDownload,
    handleReset, handleResize,
  };
}
