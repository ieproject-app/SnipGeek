import { getSortedNotesData } from '@/lib/notes';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default function NotesPage({ params: { locale } }: { params: { locale: string } }) {
  const allNotesData = getSortedNotesData(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {locale === 'id' ? 'Catatan' : 'Notes'}
            </h1>
        </header>

        <section>
          <ul className="space-y-8">
            {allNotesData.map((note) => (
              <li key={note.slug}>
                <Link href={`${linkPrefix}/notes/${note.slug}`} className="block group">
                  <article className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h2 className="font-headline text-2xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
                        {note.frontmatter.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {new Date(note.frontmatter.date).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                     <AddToReadingListButton 
                        item={{
                            slug: note.slug,
                            title: note.frontmatter.title,
                            description: note.frontmatter.description,
                            href: `${linkPrefix}/notes/${note.slug}`,
                            type: 'note'
                        }}
                        showText={false}
                        className="text-muted-foreground hover:text-primary shrink-0"
                    />
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
