import path from "path";
import { createContentEngine } from "@/lib/content-engine";
import type { TranslationsMap } from "@/lib/content-engine";

// ─── Post-specific frontmatter ──────────────────────────────────────────────

export type PostFrontmatter = {
  title: string;
  date: string;
  updated?: string;
  description: string;
  heroImage: string;
  imageAlt?: string;
  translationKey: string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
  excludeFromIndexMonitoring?: boolean;
  category?: string;
  authorId?: string;
  hideFromHome?: boolean;
  [key: string]: unknown;
};

// Preserve existing type aliases for backward compatibility
export type Post<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};

export type PostData = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  locale: string;
  isFallback?: boolean;
};

export type { TranslationsMap };

// ─── Engine instance ────────────────────────────────────────────────────────

const postsEngine = createContentEngine<PostFrontmatter>({
  contentDirectory: path.join(process.cwd(), "_posts"),
  normaliseFrontmatter: (data) => {
    // Default heroImage when missing
    if (!data.heroImage) {
      data.heroImage = "footer-about";
    }
    return data as PostFrontmatter;
  },
});

// ─── Public API (same signatures as before) ─────────────────────────────────

export const getSortedPostsData = postsEngine.getSortedData;
export const getPostData = postsEngine.getData;
export const getAllPostSlugs = postsEngine.getAllSlugs;
export const getPostTranslation = postsEngine.getTranslation;
export const getAllLocales = postsEngine.getAllLocales;
export const getAllTranslationsMap = postsEngine.getAllTranslationsMap;
