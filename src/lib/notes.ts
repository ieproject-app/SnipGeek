import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { i18n, type Locale } from "@/i18n-config";

const notesDirectory = path.join(process.cwd(), "_notes");

export type NoteFrontmatter = {
  title: string;
  date: string;
  updated?: string;
  description: string;
  translationKey: string;
  published?: boolean;
  tags?: string[];
  authorId?: string;
  [key: string]: any;
};

export type Note<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};

export async function getSortedNotesData(
  locale?: string,
): Promise<Note<NoteFrontmatter>[]> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const localeDirectory = path.join(notesDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) {
    return [];
  }

  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    return [];
  }

  const allNotesData = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);

        // Return null for invalid/empty files
        if (!data.title || !data.date) {
          return null;
        }

        return {
          slug,
          frontmatter: data as NoteFrontmatter,
          locale: targetLocale!,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((note): note is Note<NoteFrontmatter> => note !== null)
    .filter((note) => note.frontmatter.published === true); // Only show published notes

  return allNotesData.sort((a, b) => {
    if (new Date(a.frontmatter.date) < new Date(b.frontmatter.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getDraftNotesData(
  locale?: string,
): Promise<Note<NoteFrontmatter>[]> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const localeDirectory = path.join(notesDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) return [];

  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    return [];
  }

  const allNotesData = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);

        // Return null for invalid/empty files
        if (!data.title || !data.date) {
          return null;
        }

        return {
          slug,
          frontmatter: data as NoteFrontmatter,
          locale: targetLocale!,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((note): note is Note<NoteFrontmatter> => note !== null)
    .filter((note) => note.frontmatter.published !== true); // Only show drafts

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
};

export async function getNoteData(
  slug: string,
  locale?: string,
): Promise<NoteData | null> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const fullPath = path.join(notesDirectory, targetLocale!, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data as NoteFrontmatter,
      content,
      locale: targetLocale!,
    };
  } catch (e) {
    return null;
  }
}

export async function getAllNoteSlugs(locale?: string) {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const localeDirectory = path.join(notesDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) return [];

  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    return [];
  }

  return fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);
        if (data.published === true) {
          return {
            slug: fileName.replace(/\.mdx$/, ""),
          };
        }
        return null;
      } catch (e) {
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
  } catch (error) {
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

    let fileNames: string[];
    try {
      fileNames = fs.readdirSync(localeDirectory);
    } catch (err) {
      continue;
    }

    for (const fileName of fileNames) {
      if (!fileName.endsWith(".mdx")) continue;

      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
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
      } catch (e) {}
    }
  }
  return translationsMap;
}
