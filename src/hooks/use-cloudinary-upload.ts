"use client";

import { useState, useCallback } from "react";
import { getAuth } from "firebase/auth";

export interface CloudinaryUploadResult {
  ok: boolean;
  url: string;
  publicId: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  folder: string;
}

export interface UploadState {
  loading: boolean;
  progress: number;        // 0–100 (count-based across batch)
  results: CloudinaryUploadResult[];
  errors: { filename: string; error: string }[];
}

export interface UploadFileOptions {
  slug: string;
  type: "_posts" | "_notes";
  category?: string;
}

async function getIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  return user.getIdToken();
}

/**
 * Hook for uploading images to Cloudinary via the admin API route.
 * Requires an active Firebase session (admin-protected pages only).
 *
 * Usage:
 *   const { uploadBatch, loading, progress, results, errors } = useCloudinaryUpload();
 *   const files = [heroFile, bodyFile1, bodyFile2]; // already converted WebP blobs
 *   await uploadBatch(files, { slug: "cara-install-wsl", type: "_posts", category: "windows11" });
 */
export function useCloudinaryUpload() {
  const [state, setState] = useState<UploadState>({
    loading: false,
    progress: 0,
    results: [],
    errors: [],
  });

  // ── Upload a single File ──
  const uploadFile = useCallback(
    async (
      file: File,
      opts: UploadFileOptions,
    ): Promise<CloudinaryUploadResult | null> => {
      const token = await getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", opts.slug);
      formData.append("type", opts.type);
      if (opts.category) formData.append("category", opts.category);

      const res = await fetch("/api/admin/cloudinary/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Upload failed: HTTP ${res.status}`);
      }

      return (await res.json()) as CloudinaryUploadResult;
    },
    [],
  );

  // ── Upload multiple Files sequentially ──
  const uploadBatch = useCallback(
    async (
      files: File[],
      opts: UploadFileOptions,
      onFileComplete?: (result: CloudinaryUploadResult, index: number) => void,
    ) => {
      if (files.length === 0) return;

      setState({ loading: true, progress: 0, results: [], errors: [] });

      const results: CloudinaryUploadResult[] = [];
      const errors: { filename: string; error: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await uploadFile(file, opts);
          if (result) {
            results.push(result);
            onFileComplete?.(result, i);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          errors.push({ filename: file.name, error: message });
          console.error(`[useCloudinaryUpload] Failed: ${file.name}`, err);
        }

        setState((prev) => ({
          ...prev,
          progress: Math.round(((i + 1) / files.length) * 100),
          results: [...results],
          errors: [...errors],
        }));
      }

      setState({ loading: false, progress: 100, results, errors });
      return { results, errors };
    },
    [uploadFile],
  );

  const reset = useCallback(() => {
    setState({ loading: false, progress: 0, results: [], errors: [] });
  }, []);

  return {
    ...state,
    uploadFile,
    uploadBatch,
    reset,
  };
}
