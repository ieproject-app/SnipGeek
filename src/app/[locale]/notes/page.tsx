import { getSortedNotesData } from '@/lib/notes';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { getDictionary } from '@/lib/get-dictionary';
import { Badge } from '@/components/ui/badge';

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.notes.title}
            </h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <div key={note.slug}>
                <Link href={`${linkPrefix}/notes/${note.slug}`} className="block group h-full">
                    <article className="relative flex h-full flex-col rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg hover:border-primary">
                        <div className="flex w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary p-2 text-center text-primary-foreground mb-4">
                            <p className="text-3xl font-bold">{formatDatePart(noteDate, { day: 'numeric' })}</p>
                            <p className="text-sm font-semibold uppercase">{formatDatePart(noteDate, { month: 'short' })}</p>
                            <p className="text-xs">{formatDatePart(noteDate, { year: 'numeric' })}</p>
                        </div>
                        
                        <h2 className="font-headline text-xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
                            {note.frontmatter.title}
                        </h2>
                        
                        <p className="text-muted-foreground text-sm mt-2 flex-grow line-clamp-3">
                            {note.frontmatter.description}
                        </p>
                        
                        {note.frontmatter.tags && note.frontmatter.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1">
                                {note.frontmatter.tags.map(tag => (
                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                            </div>
                        )}

                        <AddToReadingListButton 
                            item={item}
                            showText={false}
                            dictionary={dictionary.readingList}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </article>
                </Link>
              </div>
            )})}
        </section>
      </main>
    </div>
  );
}
