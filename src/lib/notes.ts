import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { i18n, type Locale } from '@/i18n-config';

const notesDirectory = path.join(process.cwd(), '_notes');

export type NoteFrontmatter = {
  title: string;
  date: string;
  description: string;
  translationKey: string;
  [key: string]: any;
};

export type Note<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};


export function getSortedNotesData(locale?: string): Note<NoteFrontmatter>[] {
  const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
  const localeDirectory = path.join(notesDirectory, targetLocale!);
  
  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    return [];
  }

  const allNotesData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(localeDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        frontmatter: data as NoteFrontmatter,
        locale: targetLocale!,
      };
    });

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

export async function getNoteData(slug: string, locale?: string): Promise<NoteData | null> {
  const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
  const fullPath = path.join(notesDirectory, targetLocale!, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as NoteFrontmatter,
    content,
    locale: targetLocale!,
  };
}

export function getAllNoteSlugs(locale?: string) {
    const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
    const localeDirectory = path.join(notesDirectory, targetLocale!);
    let fileNames: string[];
    try {
      fileNames = fs.readdirSync(localeDirectory);
    } catch (err) {
      return [];
    }

    return fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map((fileName) => {
        return {
          slug: fileName.replace(/\.mdx$/, ''),
        };
      });
}

export function getAllLocales() {
  try {
    return fs.readdirSync(notesDirectory).filter(item => 
      fs.statSync(path.join(notesDirectory, item)).isDirectory()
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

export function getAllNotesTranslationsMap(): NotesTranslationsMap {
  const allLocales = getAllLocales();
  const translationsMap: NotesTranslationsMap = {};

  for (const locale of allLocales) {
    const localeDirectory = path.join(notesDirectory, locale);
    let fileNames: string[];
    try {
      fileNames = fs.readdirSync(localeDirectory);
    } catch (err) {
      continue; 
    }

    for (const fileName of fileNames) {
      if (!fileName.endsWith('.mdx')) continue;
      
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(localeDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);
      const frontmatter = data as NoteFrontmatter;

      const key = frontmatter.translationKey;
      if (!key) continue;

      if (!translationsMap[key]) {
        translationsMap[key] = [];
      }

      const existing = translationsMap[key].find(t => t.locale === locale);
      if (!existing) {
        translationsMap[key].push({ locale, slug });
      }
    }
  }
  return translationsMap;
}
