// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────
export type AspectRatioMode = "16:9" | "4:3";

/**
 * Article image types for the Batch Rename tab.
 * - "body"    → numbered body images: 01-name.webp, 02-name.webp, …
 * - "gallery" → gallery groups of 3: gallery-01.webp … gallery-03.webp, gallery-04.webp …
 * - "grid"    → grid groups of 2:    grid-01.webp, grid-02.webp, grid-03.webp …
 */
export type ArticleImageType = "body" | "gallery" | "grid";

/** Map type → filename prefix/pattern */
export const ARTICLE_IMAGE_CONFIG: Record<
  ArticleImageType,
  { prefix: string; groupSize: number; label: string; description: string }
> = {
  body: {
    prefix: "",
    groupSize: 1,
    label: "Body Image",
    description: "Sequential numbered images: 01-name.webp, 02-name.webp, …",
  },
  gallery: {
    prefix: "gallery-",
    groupSize: 3,
    label: "Gallery",
    description: "Gallery groups of 3: gallery-01.webp, gallery-02.webp, gallery-03.webp, …",
  },
  grid: {
    prefix: "grid-",
    groupSize: 2,
    label: "Grid",
    description: "Grid pairs of 2: grid-01.webp, grid-02.webp, grid-03.webp, …",
  },
};

/**
 * Generate the output filename for a renamed article image.
 * @param type   - Article image type
 * @param index  - 1-based global index among all files of this type in the current session
 * @param originalName - Original filename without extension (used only for body type)
 */
export function getArticleImageFilename(
  type: ArticleImageType,
  index: number,
  originalName: string,
): string {
  const padded = String(index).padStart(2, "0");
  if (type === "body") {
    // Sanitize: lowercase, replace spaces/special chars with hyphens
    const safeName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${padded}-${safeName || "image"}.webp`;
  }
  return `${ARTICLE_IMAGE_CONFIG[type].prefix}${padded}.webp`;
}



export const ASPECT_RATIO_STORAGE_KEY = "snipgeek-image-crop-ratio";

export const RATIO_CONFIG: Record<AspectRatioMode, { ratio: number; width: number; height: number }> = {
  "16:9": { ratio: 16 / 9, width: 1920, height: 1080 },
  "4:3":  { ratio: 4 / 3,  width: 1920, height: 1440 },
};

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

export function getCropBox(imgW: number, imgH: number, targetRatio = TARGET_RATIO): { cropW: number; cropH: number } {
  const imgRatio = imgW / imgH;
  if (imgRatio > targetRatio) {
    // Wider than target → crop sides
    const cropH = imgH;
    const cropW = Math.round(imgH * targetRatio);
    return { cropW, cropH };
  } else {
    // Taller than target → crop top/bottom
    const cropW = imgW;
    const cropH = Math.round(imgW / targetRatio);
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
