import path from "path";
import { createContentEngine } from "@/lib/content-engine";
import type { TranslationsMap } from "@/lib/content-engine";

// ─── Note-specific frontmatter ──────────────────────────────────────────────

export type NoteFrontmatter = {
  title: string;
  date: string;
  updated?: string;
  description: string;
  translationKey: string;
  published?: boolean;
  tags?: string[];
  authorId?: string;
  heroImage?: string;
  category?: string;
  excludeFromIndexMonitoring?: boolean;
};

// Preserve existing type aliases for backward compatibility
export type Note<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};

export type NoteData = {
  slug: string;
  frontmatter: NoteFrontmatter;
  content: string;
  locale: string;
  isFallback?: boolean;
};

export type NotesTranslationsMap = TranslationsMap;

// ─── Engine instance ────────────────────────────────────────────────────────

const notesEngine = createContentEngine<NoteFrontmatter>({
  contentDirectory: path.join(process.cwd(), "_notes"),
  normaliseFrontmatter: (data) => {
    // Notes require title and date
    if (!data.title || !data.date) return null;
    return data as NoteFrontmatter;
  },
});

// ─── Public API (same signatures as before) ─────────────────────────────────

export const getSortedNotesData = notesEngine.getSortedData;
export const getNoteData = notesEngine.getData;
export const getAllNoteSlugs = notesEngine.getAllSlugs;
export const getNoteTranslation = notesEngine.getTranslation;
export const getAllLocales = notesEngine.getAllLocales;
export const getAllNotesTranslationsMap = notesEngine.getAllTranslationsMap;
