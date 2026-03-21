"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/layout/category-badge";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { Post, PostFrontmatter } from "@/lib/posts";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";

const ITEMS_PER_PAGE = 9;

export function TagListClient({
  posts,
  notes,
  dictionary,
  locale,
  decodedTag,
}: {
  posts: Post<PostFrontmatter>[];
  notes: Note<NoteFrontmatter>[];
  dictionary: Dictionary;
  locale: string;
  decodedTag: string;
}) {
  const linkPrefix = locale === "en" ? "" : `/${locale}`;
  const [visiblePostsCount, setVisiblePostsCount] = useState(ITEMS_PER_PAGE);
  const [visibleNotesCount, setVisibleNotesCount] = useState(ITEMS_PER_PAGE);

  const displayedPosts = posts.slice(0, visiblePostsCount);
  const hasMorePosts = visiblePostsCount < posts.length;
  const remainingPostsCount = Math.min(
    ITEMS_PER_PAGE,
    posts.length - visiblePostsCount,
  );

  const displayedNotes = notes.slice(0, visibleNotesCount);
  const hasMoreNotes = visibleNotesCount < notes.length;
  const remainingNotesCount = Math.min(
    ITEMS_PER_PAGE,
    notes.length - visibleNotesCount,
  );

  const handleLoadMorePosts = () => {
    setVisiblePostsCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleLoadMoreNotes = () => {
    setVisibleNotesCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <header className="mb-16 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary mb-3">
            {dictionary.tags.title.replace("{tag}", decodedTag.toUpperCase())}
          </h1>
          <p className="text-muted-foreground">
            {dictionary.tags.description.replace(
              "{tag}",
              decodedTag.toUpperCase(),
            )}
          </p>
        </header>

        {posts.length === 0 && notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {dictionary.tags.noItems}
          </p>
        ) : (
          <div className="space-y-16">
            {posts.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl font-bold font-display text-primary shrink-0 uppercase tracking-tight">
                    {dictionary.navigation.blog}
                  </h2>
                  <div className="w-full h-0.5 bg-linear-to-r from-accent via-accent/50 to-transparent flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                  {displayedPosts.map((post) => {
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
                          <div className="relative w-full aspect-8/5 overflow-hidden rounded-xl mb-4 shadow-sm transition-all duration-500 border border-primary/5">
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
                              className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                            />
                          </div>
                          <div className="mb-2">
                            <CategoryBadge
                              category={post.frontmatter.category}
                              size="xs"
                            />
                          </div>
                          <h3 className="font-display text-base font-semibold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight mb-2">
                            {post.frontmatter.title}
                          </h3>
                          <time className="text-[10px] font-medium text-muted-foreground block opacity-60">
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

                {hasMorePosts && (
                  <div className="mt-10 flex justify-center">
                    <Button
                      onClick={handleLoadMorePosts}
                      variant="outline"
                      size="lg"
                      className="group gap-2 border-primary/20 bg-background/50 px-8 py-6 text-base font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
                    >
                      <span>
                        {locale === "id"
                          ? `Muat ${remainingPostsCount} Artikel Lagi`
                          : `Load ${remainingPostsCount} More Article${remainingPostsCount > 1 ? "s" : ""}`}
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                    </Button>
                  </div>
                )}
              </section>
            )}

            {notes.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl font-bold font-display text-primary shrink-0 uppercase tracking-tight">
                    {dictionary.navigation.notes}
                  </h2>
                  <div className="w-full h-0.5 bg-linear-to-r from-accent via-accent/50 to-transparent flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {displayedNotes.map((note) => {
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
                            {formatRelativeTime(noteDate, locale)}
                          </div>
                          <AddToReadingListButton
                            item={item}
                            showText={false}
                            dictionary={dictionary}
                            className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shrink-0"
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-6 pt-2">
                          <Link
                            href={`${linkPrefix}/notes/${note.slug}`}
                            className="flex-1"
                          >
                            <h2 className="font-display text-base font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight mb-2">
                              {note.frontmatter.title}
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {note.frontmatter.description}
                            </p>
                          </Link>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/5 to-transparent" />
                      </Card>
                    );
                  })}
                </div>

                {hasMoreNotes && (
                  <div className="mt-10 flex justify-center">
                    <Button
                      onClick={handleLoadMoreNotes}
                      variant="outline"
                      size="lg"
                      className="group gap-2 border-primary/20 bg-background/50 px-8 py-6 text-base font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
                    >
                      <span>
                        {locale === "id"
                          ? `Muat ${remainingNotesCount} Catatan Lagi`
                          : `Load ${remainingNotesCount} More Note${remainingNotesCount > 1 ? "s" : ""}`}
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                    </Button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
