
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import { PromptGeneratorClient } from './prompt-generator-client';
import { getSortedPostsData } from '@/lib/posts';
import { getSortedNotesData } from '@/lib/notes';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as any);
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
  const { locale: lang } = await params;
  const dictionary = await getDictionary(lang as any);
  const pageContent = dictionary.promptGenerator;

  // MUST await both async calls
  const posts = await getSortedPostsData(lang);
  const notes = await getSortedNotesData(lang);
  
  const existingArticles = [
    ...posts.map(p => ({ slug: p.slug, title: p.frontmatter.title, type: 'blog' as const })),
    ...notes.map(n => ({ slug: n.slug, title: n.frontmatter.title, type: 'note' as const }))
  ].sort((a, b) => a.title.localeCompare(b.title));
  
  return (
    <div className="w-full">
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 sm:pb-16">
        <PromptGeneratorClient 
            dictionary={pageContent} 
            existingArticles={existingArticles} 
            fullDictionary={dictionary}
        />
      </main>
    </div>
  );
}
