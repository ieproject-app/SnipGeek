import { getSortedNotesData } from '@/lib/notes';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { getDictionary } from '@/lib/get-dictionary';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function NotesPage({ params: { locale } }: { params: { locale: string } }) {
  const allNotesData = getSortedNotesData(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const dictionary = await getDictionary(locale);

  const formatDatePart = (date: Date, options: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.notes.title}
            </h1>
        </header>

        <section>
          <ul className="space-y-12">
            {allNotesData.map((note) => {
              const noteDate = new Date(note.frontmatter.date);
              const item = {
                  slug: note.slug,
                  title: note.frontmatter.title,
                  description: note.frontmatter.description,
                  href: `${linkPrefix}/notes/${note.slug}`,
                  type: 'note' as const
              };
              return (
                <li key={note.slug} className="relative group">
                    <Link href={`${linkPrefix}/notes/${note.slug}`} className="block">
                        <article className="flex items-start gap-4 sm:gap-6">
                        <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-lg w-20 text-center p-2">
                            <p className="text-3xl font-bold">{formatDatePart(noteDate, { day: 'numeric' })}</p>
                            <p className="text-sm font-semibold uppercase">{formatDatePart(noteDate, { month: 'short' })}</p>
                            <p className="text-xs">{formatDatePart(noteDate, { year: 'numeric' })}</p>
                        </div>
                        <div className="flex-1">
                            <h2 className="font-headline text-2xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
                            {note.frontmatter.title}
                            </h2>
                            <p className="text-muted-foreground text-sm mt-2">
                                {note.frontmatter.description}
                            </p>
                        </div>
                        </article>
                    </Link>
                    <AddToReadingListButton 
                        item={item}
                        showText={false}
                        dictionary={dictionary.readingList}
                        className="absolute top-0 right-0 text-muted-foreground hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </li>
            )})}
          </ul>
        </section>
      </main>
    </div>
  );
}
