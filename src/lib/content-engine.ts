import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { i18n, type Locale } from "@/i18n-config";

// ─── Shared MDX file helpers ────────────────────────────────────────────────

export type MdxFileEntry = { filePath: string; slug: string };

/**
 * Recursively collect every .mdx file under a directory.
 * Returns { filePath, slug } where slug = bare filename without extension.
 */
export function getAllMdxFiles(dir: string): MdxFileEntry[] {
  if (!fs.existsSync(dir)) return [];
  const results: MdxFileEntry[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllMdxFiles(fullPath));
      } else if (entry.name.endsWith(".mdx")) {
        results.push({
          filePath: fullPath,
          slug: entry.name.replace(/\.mdx$/, ""),
        });
      }
    }
  } catch (err) {
    console.error("Error reading directory:", dir, err);
  }
  return results;
}

/**
 * Search recursively for a single slug (filename without .mdx) under dir.
 */
export function findMdxFilePath(dir: string, slug: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findMdxFilePath(fullPath, slug);
        if (found) return found;
      } else if (entry.name === `${slug}.mdx`) {
        return fullPath;
      }
    }
  } catch (err) {
    console.error("Error finding file:", slug, err);
  }
  return null;
}

// ─── Shared types ───────────────────────────────────────────────────────────

/** Minimal frontmatter contract every content type must satisfy. */
export type BaseFrontmatter = {
  title: string;
  date: string;
  updated?: string;
  description: string;
  translationKey: string;
  published?: boolean;
  tags?: string[];
  category?: string;
  [key: string]: unknown;
};

export type ContentItem<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};

export type ContentData<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  content: string;
  locale: string;
  isFallback?: boolean;
};

export type TranslationsMap = {
  [key: string]: {
    locale: string;
    slug: string;
  }[];
};

type GetContentOptions = {
  includeDrafts?: boolean;
};

// ─── Content engine factory ─────────────────────────────────────────────────

export type ContentEngineConfig<TFrontmatter extends BaseFrontmatter> = {
  /** Absolute path to the content root directory (e.g. `_posts`, `_notes`). */
  contentDirectory: string;
  /**
   * Optional hook to normalise frontmatter after parsing.
   * Called for every MDX file. Return `null` to skip the item.
   */
  normaliseFrontmatter?: (data: Record<string, unknown>) => TFrontmatter | null;
};

export function createContentEngine<TFrontmatter extends BaseFrontmatter>(
  config: ContentEngineConfig<TFrontmatter>,
) {
  const { contentDirectory, normaliseFrontmatter } = config;

  function resolveLocale(locale?: string): string {
    return i18n.locales.includes(locale as Locale) ? locale! : i18n.defaultLocale;
  }

  // ── getSortedData ───────────────────────────────────────────────────────

  async function getSortedData(
    locale?: string,
    options: GetContentOptions = {},
  ): Promise<ContentItem<TFrontmatter>[]> {
    const targetLocale = resolveLocale(locale);
    const { includeDrafts = false } = options;
    const localeDirectory = path.join(contentDirectory, targetLocale);

    if (!fs.existsSync(localeDirectory)) return [];

    const mdxFiles = getAllMdxFiles(localeDirectory);

    const allItems = mdxFiles
      .map(({ filePath, slug }) => {
        try {
          const fileContents = fs.readFileSync(filePath, "utf8");
          const { data } = matter(fileContents);

          const fm = normaliseFrontmatter
            ? normaliseFrontmatter(data)
            : (data as TFrontmatter);

          if (!fm) return null;

          return {
            slug,
            frontmatter: fm,
            locale: targetLocale,
          };
        } catch (err) {
          console.error("Error reading MDX file:", filePath, err);
          return null;
        }
      })
      .filter((item): item is ContentItem<TFrontmatter> => item !== null)
      .filter((item) => includeDrafts || item.frontmatter.published === true);

    // De-duplicate by translationKey, keeping the most recent
    const withKeys = new Map<string, ContentItem<TFrontmatter>>();
    const withoutKeys: ContentItem<TFrontmatter>[] = [];

    for (const item of allItems) {
      const key = item.frontmatter.translationKey;
      if (key) {
        if (
          !withKeys.has(key) ||
          new Date(item.frontmatter.date) >
            new Date(withKeys.get(key)!.frontmatter.date)
        ) {
          withKeys.set(key, item);
        }
      } else {
        withoutKeys.push(item);
      }
    }

    const uniqueItems = [...Array.from(withKeys.values()), ...withoutKeys];

    return uniqueItems.sort((a, b) =>
      new Date(a.frontmatter.date) < new Date(b.frontmatter.date) ? 1 : -1,
    );
  }

  // ── getData ─────────────────────────────────────────────────────────────

  async function getData(
    slug: string,
    locale?: string,
  ): Promise<ContentData<TFrontmatter> | null> {
    const targetLocale = resolveLocale(locale);

    const localeDir = path.join(contentDirectory, targetLocale);
    const foundPath = findMdxFilePath(localeDir, slug);

    const fallbackDir = path.join(contentDirectory, i18n.defaultLocale);
    const fallbackFound = findMdxFilePath(fallbackDir, slug);

    const resolvedPath = foundPath
      ? { path: foundPath, locale: targetLocale }
      : fallbackFound
        ? { path: fallbackFound, locale: i18n.defaultLocale }
        : null;

    if (!resolvedPath) return null;

    try {
      const fileContents = fs.readFileSync(resolvedPath.path, "utf8");
      const { data, content } = matter(fileContents);
      const isPublished = data.published === true;

      if (!isPublished && process.env.NODE_ENV !== "development") {
        return null;
      }

      const fm = normaliseFrontmatter
        ? normaliseFrontmatter(data)
        : (data as TFrontmatter);

      if (!fm) return null;

      return {
        slug,
        frontmatter: fm,
        content,
        locale: resolvedPath.locale,
        isFallback: resolvedPath.locale !== targetLocale,
      };
    } catch (err) {
      console.error("Error reading MDX content:", resolvedPath.path, err);
      return null;
    }
  }

  // ── getAllSlugs ──────────────────────────────────────────────────────────

  async function getAllSlugs(locale?: string): Promise<{ slug: string }[]> {
    const targetLocale = resolveLocale(locale);
    const localeDirectory = path.join(contentDirectory, targetLocale);

    if (!fs.existsSync(localeDirectory)) return [];

    const mdxFiles = getAllMdxFiles(localeDirectory);

    return mdxFiles
      .map(({ filePath, slug }) => {
        try {
          const fileContents = fs.readFileSync(filePath, "utf8");
          const { data } = matter(fileContents);
          if (data.published === true) {
            return { slug };
          }
          return null;
        } catch (err) {
          console.error("Error reading MDX for slug list:", filePath, err);
          return null;
        }
      })
      .filter((item): item is { slug: string } => item !== null);
  }

  // ── getTranslation ──────────────────────────────────────────────────────

  async function getTranslation(
    translationKey: string,
    targetLocale: string,
  ): Promise<ContentItem<TFrontmatter> | null> {
    const allItems = await getSortedData(targetLocale);
    return (
      allItems.find((item) => item.frontmatter.translationKey === translationKey) ||
      null
    );
  }

  // ── getAllLocales ────────────────────────────────────────────────────────

  async function getAllLocales(): Promise<string[]> {
    try {
      if (!fs.existsSync(contentDirectory)) return [];
      return fs
        .readdirSync(contentDirectory)
        .filter((item) =>
          fs.statSync(path.join(contentDirectory, item)).isDirectory(),
        );
    } catch (err) {
      console.error("Error listing locales in:", contentDirectory, err);
      return [];
    }
  }

  // ── getAllTranslationsMap ────────────────────────────────────────────────

  async function getAllTranslationsMap(): Promise<TranslationsMap> {
    const allLocales = await getAllLocales();
    const translationsMap: TranslationsMap = {};

    for (const locale of allLocales) {
      const localeDirectory = path.join(contentDirectory, locale);

      if (!fs.existsSync(localeDirectory)) continue;

      const mdxFiles = getAllMdxFiles(localeDirectory);

      for (const { filePath, slug } of mdxFiles) {
        try {
          const fileContents = fs.readFileSync(filePath, "utf8");
          const { data } = matter(fileContents);

          if (!data.translationKey || !data.published) continue;

          const key = data.translationKey as string;

          if (!translationsMap[key]) {
            translationsMap[key] = [];
          }

          const existing = translationsMap[key].find((t) => t.locale === locale);
          if (!existing) {
            translationsMap[key].push({ locale, slug });
          }
        } catch (err) {
          console.error("Error reading MDX for translations map:", filePath, err);
        }
      }
    }
    return translationsMap;
  }

  return {
    getSortedData,
    getData,
    getAllSlugs,
    getTranslation,
    getAllLocales,
    getAllTranslationsMap,
  };
}
