import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData as getRawNotes } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { Card, CardFooter } from "@/components/ui/card";
import { CategoryBadge } from "@/components/layout/category-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  const decodedTag = decodeURIComponent(tag).toUpperCase();
  const dictionary = await getDictionary(locale as any);
  const canonicalPath =
    locale === i18n.defaultLocale ? `/tags/${tag}` : `/${locale}/tags/${tag}`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tags/${tag}`;
  });

  return {
    title: dictionary.tags.title.replace("{tag}", decodedTag),
    description: dictionary.tags.description.replace("{tag}", decodedTag),
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export async function generateStaticParams() {
  const locales = i18n.locales;
  return locales.map((locale) => ({ locale, tag: "tutorial" }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await params;
  const decodedTag = decodeURIComponent(tag).toLowerCase();
  const dictionary = await getDictionary(locale as any);
  const linkPrefix = locale === "en" ? "" : `/${locale}`;

  const allPosts = await getSortedPostsData(locale);
  const posts = allPosts.filter((p) =>
    p.frontmatter.tags?.some((t) => t.toLowerCase() === decodedTag),
  );

  const notes = await getRawNotes(locale);
  const filteredNotes = notes.filter((n) =>
    n.frontmatter.tags?.some((t) => t.toLowerCase() === decodedTag),
  );

  const formatDatePart = (date: Date, options: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <header className="mb-16 text-center">
          <h1 className="font-headline text-display-sm font-extrabold tracking-tighter text-primary mb-3">
            {dictionary.tags.title.replace("{tag}", decodedTag.toUpperCase())}
          </h1>
          <p className="text-muted-foreground">
            {dictionary.tags.description.replace(
              "{tag}",
              decodedTag.toUpperCase(),
            )}
          </p>
        </header>

        {posts.length === 0 && filteredNotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {dictionary.tags.noItems}
          </p>
        ) : (
          <div className="space-y-16">
            {posts.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-h3 font-bold font-headline text-primary shrink-0 uppercase tracking-tight">
                    {dictionary.navigation.blog}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                  {posts.map((post) => {
                    const heroImageValue = post.frontmatter.heroImage;
                    let heroImageSrc: string | undefined;
                    let heroImageHint: string | undefined;

                    if (heroImageValue) {
                      if (
                        heroImageValue.startsWith("http") ||
                        heroImageValue.startsWith("/")
                      ) {
                        heroImageSrc = heroImageValue;
                      } else {
                        const placeholder = PlaceHolderImages.find(
                          (p) => p.id === heroImageValue,
                        );
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
                      type: "blog" as const,
                    };
                    return (
                      <div
                        key={post.slug}
                        className="group relative transition-all duration-500 hover:-translate-y-1"
                      >
                        <Link
                          href={`${linkPrefix}/blog/${post.slug}`}
                          className="block"
                        >
                          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl mb-4 shadow-sm transition-all duration-500 border border-primary/5">
                            {heroImageSrc && (
                              <Image
                                src={heroImageSrc}
                                alt={
                                  post.frontmatter.imageAlt ||
                                  post.frontmatter.title
                                }
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                                data-ai-hint={heroImageHint}
                              />
                            )}
                            <AddToReadingListButton
                              item={item}
                              dictionary={dictionary}
                              showText={false}
                              className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <div className="mb-2">
                            <CategoryBadge
                              category={post.frontmatter.category}
                            />
                          </div>
                          <h3 className="font-headline text-base font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight">
                            {post.frontmatter.title}
                          </h3>
                          <time className="text-[10px] font-medium text-muted-foreground mt-2 block opacity-60">
                            {formatRelativeTime(
                              new Date(post.frontmatter.date),
                              locale,
                            )}
                          </time>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {filteredNotes.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-h3 font-bold font-headline text-primary shrink-0 uppercase tracking-tight">
                    {dictionary.navigation.notes}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {filteredNotes.map((note) => {
                    const noteDate = new Date(note.frontmatter.date);
                    const item = {
                      slug: note.slug,
                      title: note.frontmatter.title,
                      description: note.frontmatter.description,
                      href: `${linkPrefix}/notes/${note.slug}`,
                      type: "note" as const,
                    };
                    return (
                      <Card
                        key={note.slug}
                        className="group relative flex flex-col overflow-hidden rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 h-full"
                      >
                        <div className="p-6 pb-0 flex flex-row justify-between items-start">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                            {formatDatePart(noteDate, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <AddToReadingListButton
                            item={item}
                            showText={false}
                            dictionary={dictionary}
                            className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-6 pt-2">
                          <Link
                            href={`${linkPrefix}/notes/${note.slug}`}
                            className="flex-1"
                          >
                            <h2 className="font-headline text-base font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight mb-2">
                              {note.frontmatter.title}
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {note.frontmatter.description}
                            </p>
                          </Link>
                        </div>
                        <CardFooter className="flex items-center gap-4 border-t px-6 py-4 bg-muted/5">
                          <div className="flex flex-wrap gap-2">
                            {note.frontmatter.tags &&
                              note.frontmatter.tags
                                .slice(0, 2)
                                .map((t) => (
                                  <CategoryBadge key={t} category={t} />
                                ))}
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
