
import { getNoteData, getAllNoteSlugs, getAllLocales } from '@/lib/notes';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n } from '@/i18n-config';
import { NotePageClient } from './note-page-client';

export async function generateStaticParams() {
  const locales = getAllLocales();
  return locales.flatMap((locale) => {
    const slugs = getAllNoteSlugs(locale);
    return slugs.map(item => ({ slug: item.slug, locale }));
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params;
  const initialNote = await getNoteData(slug, locale);
  const dictionary = await getDictionary(locale as any);

  return (
    <NotePageClient 
        initialNote={initialNote as any} 
        slug={slug} 
        locale={locale} 
        dictionary={dictionary} 
    />
  );
}
