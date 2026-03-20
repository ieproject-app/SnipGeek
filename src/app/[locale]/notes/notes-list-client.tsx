"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { StickyNote, ChevronDown } from "lucide-react";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";

const NOTES_PER_PAGE = 9;

export function NotesListClient({
  initialNotes,
  dictionary,
  locale,
}: {
  initialNotes: Note<NoteFrontmatter>[];
  dictionary: Dictionary;
  locale: string;
}) {
  const linkPrefix = locale === "en" ? "" : `/${locale}`;
  const [visibleCount, setVisibleCount] = useState(NOTES_PER_PAGE);

  const allNotes = useMemo(() => {
    return [...initialNotes].sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );
  }, [initialNotes]);

  const displayedNotes = allNotes.slice(0, visibleCount);
  const hasMore = visibleCount < allNotes.length;
  const remainingCount = Math.min(NOTES_PER_PAGE, allNotes.length - visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + NOTES_PER_PAGE);
  };

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16">
        <header className="mb-12 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary mb-3">
            {dictionary.notes.title}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <div className="h-px w-10 bg-accent/40 rounded-full" />
            <div className="h-1 w-1 bg-accent rounded-full" />
            <div className="h-px w-10 bg-accent/40 rounded-full" />
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
            {dictionary.notes.description}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedNotes.map((note, index) => {
            const noteDate = new Date(note.frontmatter.date);
            const multicolor = getMulticolorTheme(
              getMulticolorSeed(note.slug, note.frontmatter.title),
            );
            const item = {
              slug: note.slug,
              title: note.frontmatter.title,
              description: note.frontmatter.description,
              href: `${linkPrefix}/notes/${note.slug}`,
              type: "note" as const,
            };
            return (
              <ScrollReveal key={note.slug} delay={index * 0.05} direction="up">
                <Card className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 h-full ring-1 ring-transparent",
                  multicolor.hoverRing,
                  multicolor.hoverShadow,
                )}>
                  {/* Top accent bar — opsi 1 */}
                  <div className={cn("absolute top-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10", multicolor.accentBar)} />

                  <CardHeader className="p-6 pb-0 flex-row justify-between items-start space-y-0">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      "bg-muted/50 group-hover:bg-primary/10",
                    )}>
                      <StickyNote className={cn(
                        "h-5 w-5 transition-colors",
                        "text-muted-foreground group-hover:text-primary",
                      )} />
                    </div>
                    <AddToReadingListButton
                      item={item}
                      showText={false}
                      dictionary={dictionary}
                      className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    />
                  </CardHeader>

                  <CardContent className="p-6 pt-4 flex-1">
                    <Link
                      href={`${linkPrefix}/notes/${note.slug}`}
                      className="block group/link"
                    >
                      <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        {formatRelativeTime(noteDate, locale)}
                      </time>
                      <h3 className={cn(
                        "font-display text-base font-bold tracking-tight text-primary transition-colors mb-2 leading-tight",
                        multicolor.hoverTitle,
                      )}>
                        {note.frontmatter.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.frontmatter.description}
                      </p>
                    </Link>
                  </CardContent>

                  {note.frontmatter.tags && note.frontmatter.tags.length > 0 && (
                    <div className="px-6 py-4 border-t bg-muted/5">
                      <div className="flex flex-wrap gap-2">
                        {note.frontmatter.tags.slice(0, 2).map((tag: string) => (
                          <CategoryBadge key={tag} category={tag} size="xs" />
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </ScrollReveal>
            );
          })}
        </section>

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              size="lg"
              className="group gap-2 border-primary/20 bg-background/50 px-8 py-6 text-base font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
            >
              <span>
                {locale === "id"
                  ? `Muat ${remainingCount} Catatan Lagi`
                  : `Load ${remainingCount} More Note${remainingCount > 1 ? "s" : ""}`}
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
