import { getSortedNotesData } from '@/lib/notes';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { getDictionary } from '@/lib/get-dictionary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        <header className="mb-16 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.notes.title}
            </h1>
        </header>

        <section className="space-y-8">
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
              <Card key={note.slug} className="group relative border-l-4 border-primary bg-card/50 transition-colors hover:border-accent">
                <CardContent className="p-6">
                    <div className="mb-4">
                        <Link href={`${linkPrefix}/notes/${note.slug}`} aria-label={note.frontmatter.title} className="inline-block">
                            <div className="flex w-20 flex-col items-center justify-center rounded-lg bg-primary p-2 text-center text-primary-foreground transition-transform sm:group-hover:scale-105">
                                <p className="text-3xl font-bold">{formatDatePart(noteDate, { day: 'numeric' })}</p>
                                <p className="text-sm font-semibold uppercase">{formatDatePart(noteDate, { month: 'short' })}</p>
                                <p className="text-xs">{formatDatePart(noteDate, { year: 'numeric' })}</p>
                            </div>
                        </Link>
                    </div>

                    <div>
                      <Link href={`${linkPrefix}/notes/${note.slug}`} aria-label={note.frontmatter.title}>
                        <h2 className="font-headline text-2xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
                            {note.frontmatter.title}
                        </h2>
                        <p className="text-muted-foreground mt-2 line-clamp-3">
                            {note.frontmatter.description}
                        </p>
                      </Link>
                      {note.frontmatter.tags && note.frontmatter.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                              {note.frontmatter.tags.map(tag => (
                                  <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                          </div>
                      )}
                    </div>
                </CardContent>
                <AddToReadingListButton 
                    item={item}
                    showText={false}
                    dictionary={dictionary.readingList}
                    className="absolute top-6 right-6 text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </Card>
            )})}
        </section>
      </main>
    </div>
  );
}
