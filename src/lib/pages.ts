import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { i18n, type Locale } from '@/i18n-config';
import { notFound } from 'next/navigation';

const pagesDirectory = path.join(process.cwd(), '_pages');

export type PageData = {
  frontmatter: Record<string, string | number | boolean | string[] | null | undefined>;
  content: string;
};

export async function getPageContent(pageName: string, locale?: string): Promise<PageData> {
  const targetLocale = i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale;
  const fullPath = path.join(pagesDirectory, pageName, `${targetLocale}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    // If the localized version doesn't exist, fall back to the default locale
    const fallbackPath = path.join(pagesDirectory, pageName, `${i18n.defaultLocale}.mdx`);
    if (!fs.existsSync(fallbackPath)) {
        notFound();
    }
    const fileContents = fs.readFileSync(fallbackPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { frontmatter: data, content };
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return { frontmatter: data, content };
}
