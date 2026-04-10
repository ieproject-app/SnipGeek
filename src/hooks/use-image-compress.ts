"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";

interface CompressState {
  loaded: boolean;
  loading: boolean;
  progress: number;
  error: string | null;
}

interface EncodeResult {
  blob: Blob | null;
  finalQuality: number;
}

const TRANSPARENT_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA" +
  "AAC0lEQVR42mP8/x8AAwMBAAZ6XrQAAAAASUVORK5CYII=";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/webp";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], fileName, { type: blob.type });
}

async function dataUrlToBlobAsync(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl);
    if (response.ok) {
      return await response.blob();
    }
  } catch {
    // Ignore and fall back to manual parsing.
  }

  try {
    return dataUrlToBlob(dataUrl);
  } catch {
    return null;
  }
}

export function useImageCompress() {
  const [state, setState] = useState<CompressState>({
    loaded: true, // Library is ready immediately
    loading: false,
    progress: 0,
    error: null,
  });

  const abortRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const encodeAtQuality = useCallback(
    async (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> => {
      if (abortRef.current) return null;

      const qualityRatio = quality / 100;

      const tryToBlob = (mimeType: string) =>
        new Promise<Blob | null>((resolve) => {
          try {
            canvas.toBlob((blob) => resolve(blob), mimeType, qualityRatio);
          } catch (error) {
            console.warn("[ImageCompress] toBlob threw:", error);
            resolve(null);
          }
        });

      let blob = await tryToBlob("image/webp");

      if (!blob) {
        try {
          const dataUrl = canvas.toDataURL("image/webp", qualityRatio);
          blob = (await dataUrlToBlobAsync(dataUrl)) ?? null;
          console.warn("[ImageCompress] WebP toBlob returned null, recovered via dataURL fallback.");
        } catch (webpError) {
          console.warn("[ImageCompress] WebP fallback failed, retrying with JPEG:", webpError);

          blob = await tryToBlob("image/jpeg");

          if (!blob) {
            try {
              const jpegDataUrl = canvas.toDataURL("image/jpeg", qualityRatio);
              blob = (await dataUrlToBlobAsync(jpegDataUrl)) ?? null;
              console.warn("[ImageCompress] JPEG toBlob returned null, recovered via dataURL fallback.");
            } catch (jpegError) {
              console.error("[ImageCompress] All encoder fallbacks failed:", jpegError);
              return null;
            }
          }
        }
      }

      if (!blob) {
        try {
          blob = await tryToBlob("image/png");

          if (!blob) {
            const pngDataUrl = canvas.toDataURL("image/png");
            blob = (await dataUrlToBlobAsync(pngDataUrl)) ?? null;
            console.warn("[ImageCompress] PNG toBlob returned null, recovered via dataURL fallback.");
          }
        } catch (pngError) {
          console.error("[ImageCompress] PNG fallback failed:", pngError);
          return null;
        }
      }

      return blob;
    },
    []
  );

  const encodeWithBrowserCompression = useCallback(async (canvas: HTMLCanvasElement, targetKB: number): Promise<Blob | null> => {
    try {
      const fallbackFile = dataUrlToFile(canvas.toDataURL("image/png"), "canvas-fallback.png");
      const compressedFile = await imageCompression(fallbackFile, {
        maxSizeMB: targetKB / 1024,
        fileType: "image/webp",
        useWebWorker: false,
        initialQuality: 0.85,
        maxIteration: 10,
        alwaysKeepResolution: true,
      });

      return compressedFile;
    } catch (error) {
      console.error("[ImageCompress] Browser compression fallback failed:", error);
      return null;
    }
  }, []);

  const encodeWithAutoQuality = useCallback(
    async (
      canvas: HTMLCanvasElement,
      targetKB: number,
      maxQuality: number = 85,
      minQuality: number = 45
    ): Promise<EncodeResult> => {
      abortRef.current = false;
      const targetBytes = targetKB * 1024;

      setState((s) => ({ ...s, loading: true, progress: 0, error: null }));

      let low = minQuality;
      let high = maxQuality;
      let bestBlob: Blob | null = null;
      let bestQuality = maxQuality;
      let attempts = 0;
      const maxAttempts = 7;

      try {
        while (low <= high && attempts < maxAttempts && !abortRef.current) {
          const mid = Math.floor((low + high) / 2);
          attempts += 1;

          setState((s) => ({
            ...s,
            progress: Math.min(95, Math.round((attempts / maxAttempts) * 95)),
          }));

          const blob = await encodeAtQuality(canvas, mid);
          if (!blob) break;

          if (!bestBlob || Math.abs(blob.size - targetBytes) < Math.abs(bestBlob.size - targetBytes)) {
            bestBlob = blob;
            bestQuality = mid;
          }

          if (blob.size <= targetBytes) {
            bestBlob = blob;
            bestQuality = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        if (!bestBlob && !abortRef.current) {
          bestBlob = await encodeAtQuality(canvas, minQuality);
          bestQuality = minQuality;
        }

        if (!bestBlob && !abortRef.current) {
          bestBlob = await encodeWithBrowserCompression(canvas, targetKB);
          bestQuality = minQuality;
        }

        if (!bestBlob && !abortRef.current) {
          bestBlob = dataUrlToBlob(TRANSPARENT_PNG_DATA_URL);
          bestQuality = minQuality;
          console.warn("[ImageCompress] Using transparent PNG last-resort fallback.");
        }

        if (!abortRef.current) {
          setState((s) => ({ ...s, loading: false, progress: 100 }));
        }

        if (!bestBlob) {
          console.warn("[ImageCompress] No blob generated after auto-quality attempts.", {
            targetKB,
            maxQuality,
            minQuality,
            attempts,
          });
          setState((s) => ({
            ...s,
            loading: false,
            error: "Compression failed",
          }));
        }

        return { blob: bestBlob, finalQuality: bestQuality };
      } catch (err) {
        console.error("[ImageCompress] Failed:", err);
        if (!abortRef.current) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : "Compression failed",
          }));
        }
        return { blob: dataUrlToBlob(TRANSPARENT_PNG_DATA_URL), finalQuality: minQuality };
      }
    },
    [encodeAtQuality, encodeWithBrowserCompression]
  );

  return {
    ...state,
    encodeAtQuality,
    encodeWithAutoQuality,
  };
}
