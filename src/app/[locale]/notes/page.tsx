
import { getSortedNotesData } from '@/lib/notes';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import { NotesListClient } from './notes-list-client';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function NotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const initialNotes = getSortedNotesData(locale);
  const dictionary = await getDictionary(locale as any);

  return (
    <NotesListClient initialNotes={initialNotes as any} dictionary={dictionary} locale={locale} />
  );
}
