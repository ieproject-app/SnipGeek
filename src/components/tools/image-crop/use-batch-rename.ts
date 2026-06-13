"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useImageCompress } from "@/hooks/use-image-compress";
import { STORAGE_KEYS } from "@/lib/constants";
import { getArticleImageFilename, MAX_TARGET_SIZE_KB, type ArticleImageType } from "./types";

export interface RenameFile {
  id: string;
  originalName: string;    // without extension
  objectUrl: string;       // for preview (from original)
  blob: Blob;              // converted/compressed WebP blob (or raw if pending)
  outputName: string;      // computed output filename
  size: number;            // converted blob size in bytes
  status: "pending" | "converting" | "done" | "error";
  originalSize: number;    // original file size in bytes
}

// ── Utility: draw a File onto a canvas (preserving original dimensions) ──
function drawFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas context failed")); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

export function useBatchRename() {
  const { encodeWithAutoQuality, loading: compressLoading, progress: compressProgress } = useImageCompress();

  const [imageType, setImageTypeState] = useState<ArticleImageType>("body");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IMAGE_RENAME_TYPE);
       
      if (saved === "body" || saved === "gallery" || saved === "grid") setImageTypeState(saved);
    } catch {}
  }, []);

  const [files, setFiles] = useState<RenameFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startIndex, setStartIndex] = useState(1);
  // Track which file is currently being converted (for per-file progress UI)
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Queue ref to process one file at a time
  const conversionQueueRef = useRef<string[]>([]);
  const isConvertingRef = useRef(false);

  // Persist chosen type
  const setImageType = useCallback((type: ArticleImageType) => {
    setImageTypeState(type);
    try { localStorage.setItem(STORAGE_KEYS.IMAGE_RENAME_TYPE, type); } catch {}
  }, []);

  // Recompute output names whenever type or startIndex changes
  useEffect(() => {
    setFiles((prev) =>
      prev.map((f, i) => ({
        ...f,
        outputName: getArticleImageFilename(imageType, startIndex + i, f.originalName),
      })),
    );
  }, [imageType, startIndex]);

  // ── Conversion pipeline (one at a time) ──
  const processNextInQueue = useCallback(async () => {
    if (isConvertingRef.current) return;
    const id = conversionQueueRef.current.shift();
    if (!id) return;

    isConvertingRef.current = true;
    setConvertingId(id);

    // Get file blob from state (need raw file, store it separately)
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "converting" } : f));

    // We need access to the raw File — store it in a ref map
    const rawFile = rawFileMapRef.current.get(id);
    if (!rawFile) {
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "error" } : f));
      isConvertingRef.current = false;
      setConvertingId(null);
      processNextInQueue();
      return;
    }

    try {
      // Draw image to canvas (preserves all formats: PNG, JPG, WebP, AVIF)
      const canvas = await drawFileToCanvas(rawFile);

      // Check if already WebP and already ≤120KB — skip re-encoding
      const alreadyOptimal = rawFile.type === "image/webp" && rawFile.size <= MAX_TARGET_SIZE_KB * 1024;

      let outputBlob: Blob;

      if (alreadyOptimal) {
        // Pass-through — just use the original
        outputBlob = rawFile;
      } else {
        // Determine quality range based on source format
        const sourceIsWebP = rawFile.type === "image/webp";
        const targetKB = sourceIsWebP
          ? Math.min(MAX_TARGET_SIZE_KB, Math.max(1, Math.floor(rawFile.size / 1024 - 2)))
          : MAX_TARGET_SIZE_KB;
        const maxQuality = sourceIsWebP ? 80 : 85;
        const minQuality = sourceIsWebP ? 20 : 40;

        const { blob } = await encodeWithAutoQuality(canvas, targetKB, maxQuality, minQuality);
        outputBlob = blob ?? rawFile;
      }

      // Update preview URL to the converted WebP
      const newUrl = URL.createObjectURL(outputBlob);

      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          // Revoke old preview
          URL.revokeObjectURL(f.objectUrl);
          return { ...f, blob: outputBlob, objectUrl: newUrl, size: outputBlob.size, status: "done" };
        }),
      );
    } catch {
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "error" } : f));
    }

    isConvertingRef.current = false;
    setConvertingId(null);
    // Process next in queue
    processNextInQueue();
  }, [encodeWithAutoQuality]);

  // Map from id → raw File (to avoid storing Files in React state)
  const rawFileMapRef = useRef<Map<string, File>>(new Map());

  // ── Accept files ──
  const addFiles = useCallback(
    (incoming: File[]) => {
      const imageFiles = incoming.filter(
        (f) => f.type.startsWith("image/") || /\.avif$/i.test(f.name),
      );
      if (imageFiles.length === 0) return;

      setFiles((prev) => {
        const nextIndex = startIndex + prev.length;
        const newEntries: RenameFile[] = imageFiles.map((f, i) => {
          const id = `${Date.now()}-${i}-${f.name}`;
          const nameWithoutExt = f.name.replace(/\.[^.]+$/, "");
          rawFileMapRef.current.set(id, f);
          return {
            id,
            originalName: nameWithoutExt,
            objectUrl: URL.createObjectURL(f),
            blob: f,
            outputName: getArticleImageFilename(imageType, nextIndex + i, nameWithoutExt),
            size: f.size,
            status: "pending",
            originalSize: f.size,
          };
        });

        // Queue IDs for conversion
        newEntries.forEach((e) => conversionQueueRef.current.push(e.id));

        return [...prev, ...newEntries];
      });

      // Kick off conversion queue after state settles
      setTimeout(processNextInQueue, 50);
    },
    [imageType, startIndex, processNextInQueue],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles],
  );
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files ?? []));
      e.target.value = "";
    },
    [addFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.objectUrl);
      rawFileMapRef.current.delete(id);
      // Also remove from queue if pending
      conversionQueueRef.current = conversionQueueRef.current.filter((qid) => qid !== id);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const moveFile = useCallback((id: string, direction: "up" | "down") => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      // Recompute output names after reorder
      return next.map((f, i) => ({
        ...f,
        outputName: getArticleImageFilename(imageType, startIndex + i, f.originalName),
      }));
    });
  }, [imageType, startIndex]);

  const clearAll = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.objectUrl));
      return [];
    });
    rawFileMapRef.current.clear();
    conversionQueueRef.current = [];
    isConvertingRef.current = false;
  }, []);

  const downloadFile = useCallback((file: RenameFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, []);

  const downloadAll = useCallback(async () => {
    // Only download files that are done
    const readyFiles = files.filter((f) => f.status === "done");
    for (let i = 0; i < readyFiles.length; i++) {
      downloadFile(readyFiles[i]);
      if (i < readyFiles.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
  }, [files, downloadFile]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    const rawMap = rawFileMapRef.current;
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.objectUrl));
      rawMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    imageType,
    files,
    isDragging,
    startIndex,
    convertingId,
    compressLoading,
    compressProgress,

    // Actions
    setImageType,
    setStartIndex,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInput,
    removeFile,
    moveFile,
    clearAll,
    downloadFile,
    downloadAll,
  };
}
