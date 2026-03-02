import { getNoteData, getAllNoteSlugs, getAllLocales, getSortedNotesData } from '@/lib/notes';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n } from '@/i18n-config';
import { notFound } from 'next/navigation';
import { NotePageClient } from './note-page-client';

export async function generateStaticParams() {
  const locales = await getAllLocales();
  const allSlugs = await Promise.all(
    locales.map(async (locale) => {
      const slugs = await getAllNoteSlugs(locale);
      return slugs.map(item => ({ slug: item.slug, locale }));
    })
  );
  return allSlugs.flat();
}

export default async function Page({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params;
  const initialNote = await getNoteData(slug, locale);
  const dictionary = await getDictionary(locale as any);

  if (!initialNote) {
    notFound();
  }

  const allNotes = await getSortedNotesData(locale);
  const initialRelatedContent = allNotes
    .filter(n => n.slug !== slug)
    .slice(0, 10);

  return (
    <NotePageClient 
      initialNote={initialNote} 
      slug={slug} 
      locale={locale} 
      dictionary={dictionary} 
      initialRelatedContent={initialRelatedContent} 
    />
  );
}