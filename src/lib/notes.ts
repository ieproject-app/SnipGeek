import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { i18n, type Locale } from "@/i18n-config";

const notesDirectory = path.join(process.cwd(), "_notes");

// Recursively collect every .mdx file under a directory.
// Returns { filePath, slug } where slug = bare filename without extension.
function getAllMdxFiles(
  dir: string,
): { filePath: string; slug: string }[] {
  if (!fs.existsSync(dir)) return [];
  const results: { filePath: string; slug: string }[] = [];
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

// Search recursively for a single slug (filename without .mdx) under dir.
function findMdxFilePath(dir: string, slug: string): string | null {
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
  [key: string]: string | number | boolean | string[] | null | undefined;
};

export type Note<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};

type GetNotesOptions = {
  includeDrafts?: boolean;
};

export async function getSortedNotesData(
  locale?: string,
  options: GetNotesOptions = {},
): Promise<Note<NoteFrontmatter>[]> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const { includeDrafts = false } = options;
  const localeDirectory = path.join(notesDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) {
    return [];
  }

  const mdxFiles = getAllMdxFiles(localeDirectory);

  const allNotesData = mdxFiles
    .map(({ filePath, slug }) => {
      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContents);

        if (!data.title || !data.date) {
          return null;
        }

        return {
          slug,
          frontmatter: data as NoteFrontmatter,
          locale: targetLocale!,
        };
      } catch {
        return null;
      }
    })
    .filter((note): note is Note<NoteFrontmatter> => note !== null)
    .filter((note) => includeDrafts || note.frontmatter.published === true);

  return allNotesData.sort((a, b) => {
    if (new Date(a.frontmatter.date) < new Date(b.frontmatter.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}


export type NoteData = {
  slug: string;
  frontmatter: NoteFrontmatter;
  content: string;
  locale: string;
  isFallback?: boolean;
};

export async function getNoteData(
  slug: string,
  locale?: string,
): Promise<NoteData | null> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  // Search recursively inside locale sub-folders (e.g. 2026-H1/, 2026-H2/)
  const localeDir = path.join(notesDirectory, targetLocale!);
  const foundPath = findMdxFilePath(localeDir, slug);

  // If file not found in requested locale, fallback to default locale (EN)
  const fallbackDir = path.join(notesDirectory, i18n.defaultLocale);
  const fallbackFound = findMdxFilePath(fallbackDir, slug);

  const resolvedPath = foundPath
    ? { path: foundPath, locale: targetLocale! }
    : fallbackFound
      ? { path: fallbackFound, locale: i18n.defaultLocale }
      : null;

  if (!resolvedPath) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(resolvedPath.path, "utf8");
    const { data, content } = matter(fileContents);
    const isPublished = data.published === true;

    if (!isPublished && process.env.NODE_ENV !== "development") {
      return null;
    }

    return {
      slug,
      frontmatter: data as NoteFrontmatter,
      content,
      locale: resolvedPath.locale,
      isFallback: resolvedPath.locale !== targetLocale,
    };
  } catch {
    return null;
  }
}

export async function getAllNoteSlugs(locale?: string) {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const localeDirectory = path.join(notesDirectory, targetLocale!);

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
      } catch {
        return null;
      }
    })
    .filter((slug) => slug !== null);
}

export async function getAllLocales() {
  try {
    if (!fs.existsSync(notesDirectory)) return [];
    return fs
      .readdirSync(notesDirectory)
      .filter((item) =>
        fs.statSync(path.join(notesDirectory, item)).isDirectory(),
      );
  } catch {
    return [];
  }
}

export type NotesTranslationsMap = {
  [key: string]: {
    locale: string;
    slug: string;
  }[];
};

export async function getNoteTranslation(
  translationKey: string,
  targetLocale: string,
): Promise<Note<NoteFrontmatter> | null> {
  const allNotes = await getSortedNotesData(targetLocale);
  const translatedNote = allNotes.find(
    (n) => n.frontmatter.translationKey === translationKey,
  );
  return translatedNote || null;
}

export async function getAllNotesTranslationsMap(): Promise<NotesTranslationsMap> {
  const allLocales = await getAllLocales();
  const translationsMap: NotesTranslationsMap = {};

  for (const locale of allLocales) {
    const localeDirectory = path.join(notesDirectory, locale);

    if (!fs.existsSync(localeDirectory)) continue;

    const mdxFiles = getAllMdxFiles(localeDirectory);

    for (const { filePath, slug } of mdxFiles) {
      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContents);

        if (!data.translationKey || !data.published) continue;
        const frontmatter = data as NoteFrontmatter;

        const key = frontmatter.translationKey;
        if (!key) continue;

        if (!translationsMap[key]) {
          translationsMap[key] = [];
        }

        const existing = translationsMap[key].find((t) => t.locale === locale);
        if (!existing) {
          translationsMap[key].push({ locale, slug });
        }
      } catch {}
    }
  }
  return translationsMap;
}

