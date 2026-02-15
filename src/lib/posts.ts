import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { i18n, type Locale } from '@/i18n-config';

const postsDirectory = path.join(process.cwd(), '_posts');

export type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
  heroImage: string;
  translationKey: string;
  featured?: boolean;
  tags?: string[];
  category?: string;
  [key: string]: any;
};

export type Post<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};


export function getSortedPostsData(locale?: string): Post<PostFrontmatter>[] {
  const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
  const localeDirectory = path.join(postsDirectory, targetLocale!);
  
  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    return [];
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(localeDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      if (!data.heroImage) {
        data.heroImage = 'understanding-nextjs';
      }

      return {
        slug,
        frontmatter: data as PostFrontmatter,
        locale: targetLocale!,
      };
    });

  return allPostsData.sort((a, b) => {
    if (new Date(a.frontmatter.date) < new Date(b.frontmatter.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

export type PostData = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  locale: string;
};

export async function getPostData(slug: string, locale?: string): Promise<PostData | null> {
  const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
  const fullPath = path.join(postsDirectory, targetLocale!, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  if (!data.heroImage) {
    data.heroImage = 'understanding-nextjs';
  }

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    locale: targetLocale!,
  };
}

export function getAllPostSlugs(locale?: string) {
    const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
    const localeDirectory = path.join(postsDirectory, targetLocale!);
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

export function getPostTranslation(translationKey: string, targetLocale: string): Post<PostFrontmatter> | null {
  const allPosts = getSortedPostsData(targetLocale);
  const translatedPost = allPosts.find(p => p.frontmatter.translationKey === translationKey);
  return translatedPost || null;
}

export function getAllLocales() {
  try {
    return fs.readdirSync(postsDirectory).filter(item => 
      fs.statSync(path.join(postsDirectory, item)).isDirectory()
    );
  } catch (error) {
    return [];
  }
}

export type TranslationsMap = {
  [key: string]: {
    locale: string;
    slug: string;
  }[];
};

export function getAllTranslationsMap(): TranslationsMap {
  const allLocales = getAllLocales();
  const translationsMap: TranslationsMap = {};

  for (const locale of allLocales) {
    const localeDirectory = path.join(postsDirectory, locale);
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
      const frontmatter = data as PostFrontmatter;

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
