// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────
export const TARGET_RATIO = 16 / 9;
export const EXPORT_WIDTH = 1920;
export const EXPORT_HEIGHT = 1080;
export const MAX_TARGET_SIZE_KB = 120; // Target max file size

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getCropBox(imgW: number, imgH: number): { cropW: number; cropH: number } {
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

export type ResizeCorner = "tl" | "tr" | "bl" | "br";
export const MIN_SCALE = 0.15;

export interface ImageCropTranslations {
  invalidImageFile: string;
  imageLoadError: string;
  downloadError: string;
  downloaded: string;
  dropTitle: string;
  dropDescription: string;
  pasteHint: string;
  outputBadge: string;
  original: string;
  ratio: string;
  target: string;
  already169: string;
  horizontal: string;
  vertical: string;
  noAdjustment: string;
  center: string;
  dragHint: string;
  removeImage: string;
  previewAlt: string;
  downloadButton: string;
  loadAnother: string;
  outputLabel: string;
  clientSideInfo: string;
  howTo: Array<{ step: string; title: string; desc: string }>;
}
