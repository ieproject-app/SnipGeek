
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, type Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolPrompts } from '@/components/tools/tool-prompts';
import { getSortedPostsData } from '@/lib/posts';
import { getSortedNotesData } from '@/lib/notes';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const title = dictionary.promptGenerator.title;
  const description = dictionary.promptGenerator.description;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function PromptGeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const { locale: lang } = await params;
  const dictionary = await getDictionary(lang as Locale);
  const pageContent = dictionary.promptGenerator;

  const posts = await getSortedPostsData(lang, { includeDrafts: true });
  const notes = await getSortedNotesData(lang, { includeDrafts: true });

  const existingArticles = [
    ...posts.map((p) => ({
      slug: p.slug,
      title: p.frontmatter.title,
      type: 'blog' as const,
      published: p.frontmatter.published === true,
      date: p.frontmatter.date,
    })),
    ...notes.map((n) => ({
      slug: n.slug,
      title: n.frontmatter.title,
      type: 'note' as const,
      published: n.frontmatter.published === true,
      date: n.frontmatter.date,
    })),
  ].sort((a, b) => {
    if (a.published !== b.published) {
      return a.published ? 1 : -1;
    }

    return a.title.localeCompare(b.title);
  });

  return (
    <div className="w-full">
      <main className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 sm:pb-16">
        <ToolPrompts
          dictionary={pageContent}
          existingArticles={existingArticles}
          fullDictionary={dictionary}
          locale={lang}
        />
      </main>
    </div>
  );
}
