
import { getSortedPostsData } from '@/lib/posts';
import { getSortedNotesData } from '@/lib/notes';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter } from '@/components/ui/card';
import { Metadata } from 'next';

export async function generateMetadata({ params: { tag, locale } }: { params: { tag: string, locale: string } }): Promise<Metadata> {
  const dictionary = await getDictionary(locale);
  const decodedTag = decodeURIComponent(tag);
  return {
    title: dictionary.tags.title.replace('{tag}', decodedTag),
    description: dictionary.tags.description.replace('{tag}', decodedTag),
  };
}

export async function generateStaticParams() {
  const allParams: { tag: string; locale: string }[] = [];
  
  for (const locale of i18n.locales) {
    const posts = getSortedPostsData(locale);
    const notes = getSortedNotesData(locale);
    
    const allTags = new Set<string>();
    posts.forEach(p => p.frontmatter.tags?.forEach(t => allTags.add(t.toLowerCase())));
    notes.forEach(n => n.frontmatter.tags?.forEach(t => allTags.add(t.toLowerCase())));
    
    Array.from(allTags).forEach(tag => {
      allParams.push({ tag, locale });
    });
  }
  
  return allParams;
}

export default async function TagPage({ params: { tag, locale } }: { params: { tag: string, locale: string } }) {
  const decodedTag = decodeURIComponent(tag).toLowerCase();
  const dictionary = await getDictionary(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const posts = getSortedPostsData(locale).filter(p => p.frontmatter.tags?.some(t => t.toLowerCase() === decodedTag));
  const notes = getSortedNotesData(locale).filter(n => n.frontmatter.tags?.some(t => t.toLowerCase() === decodedTag));

  const formatDatePart = (date: Date, options: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  return (
    <div className="w-full">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-16 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.tags.title.replace('{tag}', decodedTag.toUpperCase())}
            </h1>
            <p className="text-muted-foreground">{dictionary.tags.description.replace('{tag}', decodedTag.toUpperCase())}</p>
        </header>

        {posts.length === 0 && notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{dictionary.tags.noItems}</p>
        ) : (
          <div className="space-y-16">
            {posts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-headline mb-8 border-b pb-2">{dictionary.navigation.blog}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                  {posts.map((post) => {
                    const heroImageValue = post.frontmatter.heroImage;
                    let heroImageSrc: string | undefined;
                    let heroImageHint: string | undefined;

                    if (heroImageValue) {
                        if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
                            heroImageSrc = heroImageValue;
                        } else {
                            const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
                            if (placeholder) {
                                heroImageSrc = placeholder.imageUrl;
                                heroImageHint = placeholder.imageHint;
                            }
                        }
                    }
                    
                    const item = {
                        slug: post.slug,
                        title: post.frontmatter.title,
                        description: post.frontmatter.description,
                        href: `${linkPrefix}/blog/${post.slug}`,
                        type: 'blog' as const,
                    };
                    return (
                        <div key={post.slug} className="group relative">
                            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block">
                                <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                                    {heroImageSrc && (
                                        <Image
                                            src={heroImageSrc}
                                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            data-ai-hint={heroImageHint}
                                        />
                                    )}
                                </div>
                                {post.frontmatter.category && <p className="text-sm text-muted-foreground mb-1">{post.frontmatter.category}</p>}
                                <h3 className="font-headline text-xl font-bold tracking-tight text-primary">
                                    {post.frontmatter.title}
                                </h3>
                                <p className="leading-relaxed text-muted-foreground mt-2 text-sm line-clamp-3">
                                    {post.frontmatter.description}
                                </p>
                            </Link>
                             <AddToReadingListButton 
                                item={item}
                                dictionary={dictionary.readingList}
                                showText={false}
                                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    )
                  })}
                </div>
              </section>
            )}

            {notes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-headline mb-8 border-b pb-2">{dictionary.navigation.notes}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {notes.map((note) => {
                    const noteDate = new Date(note.frontmatter.date);
                    const item = {
                        slug: note.slug,
                        title: note.frontmatter.title,
                        description: note.frontmatter.description,
                        href: `${linkPrefix}/notes/${note.slug}`,
                        type: 'note' as const
                    };
                    return (
                      <Card key={note.slug} className="group relative flex flex-col overflow-hidden rounded-lg border bg-card/50 shadow-sm transition-all hover:shadow-lg">
                        <div className="flex items-center justify-between bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                          <div>
                            <span className="text-xl font-bold">{formatDatePart(noteDate, { day: 'numeric' })}</span>
                            <span className="ml-2 uppercase tracking-wider">{formatDatePart(noteDate, { month: 'short' })}</span>
                          </div>
                          <span>{formatDatePart(noteDate, { year: 'numeric' })}</span>
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <Link href={`${linkPrefix}/notes/${note.slug}`} className="flex-1">
                            <h2 className="font-headline text-2xl font-bold tracking-tight text-primary transition-colors group-hover:text-accent">
                                {note.frontmatter.title}
                            </h2>
                            <p className="mt-2 text-muted-foreground line-clamp-3">
                                {note.frontmatter.description}
                            </p>
                          </Link>
                        </div>
                        <CardFooter className="flex items-center justify-between gap-4 border-t px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                                {note.frontmatter.tags && note.frontmatter.tags.map(t => (
                                    <Badge key={t} variant={t.toLowerCase() === decodedTag ? 'default' : 'secondary'}>{t}</Badge>
                                ))}
                            </div>
                            <AddToReadingListButton 
                                item={item}
                                showText={false}
                                dictionary={dictionary.readingList}
                                className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            />
                        </CardFooter>
                      </Card>
                    )})}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
