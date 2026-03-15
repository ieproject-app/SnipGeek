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
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";
import { formatRelativeTime } from "@/lib/utils";

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
          <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
            {dictionary.notes.description}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedNotes.map((note, index) => {
            const noteDate = new Date(note.frontmatter.date);
            const item = {
              slug: note.slug,
              title: note.frontmatter.title,
              description: note.frontmatter.description,
              href: `${linkPrefix}/notes/${note.slug}`,
              type: "note" as const,
            };
            return (
              <ScrollReveal key={note.slug} delay={index * 0.05} direction="up">
                <Card className="group relative flex flex-col overflow-hidden rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 h-full">
                  <CardHeader className="p-6 pb-0 flex-row justify-between items-start space-y-0">
                    <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                      <StickyNote className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                      <h3 className="font-display text-base font-bold tracking-tight text-primary transition-colors group-hover/link:text-accent mb-2 leading-tight">
                        {note.frontmatter.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.frontmatter.description}
                      </p>
                    </Link>
                  </CardContent>

                  <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/5 to-transparent" />
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
