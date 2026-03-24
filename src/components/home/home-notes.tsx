"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";
import { RelativeTime } from "@/components/ui/relative-time";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";

interface HomeNotesProps {
  notes: Note<NoteFrontmatter>[];
  title: string;
  viewMoreText: string;
  dictionary: Dictionary;
  locale: string;
  linkPrefix: string;
  viewMoreHref: string;
}

const getNoteColorSeed = (note: Note<NoteFrontmatter>) => {
  const translationKey = note.frontmatter.translationKey || "";
  return getMulticolorSeed(note.slug, translationKey, note.frontmatter.title);
};

export function HomeNotes({
  notes,
  title,
  viewMoreText,
  dictionary,
  locale,
  linkPrefix,
  viewMoreHref,
}: HomeNotesProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    setScrollSnaps(api.scrollSnapList());
    onSelect();

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  if (notes.length === 0) return null;

  return (
    <section className="pb-12 sm:pb-16 overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="left">
          <div className="mb-8 text-left">
            <h2 className="text-sm font-medium font-display text-primary mb-2 italic">
              {title}
            </h2>
            <div className="w-full h-0.5 bg-[linear-gradient(to_right,#0078D4,#E95420,transparent)]" />
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2}>
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 sm:-ml-6 items-stretch">
              {notes.map((note) => {
                const noteHref = `${linkPrefix}/notes/${note.slug}`;
                const seed = getNoteColorSeed(note);
                const multicolor = getMulticolorTheme(seed);
                const firstLetter = note.frontmatter.title.trim().charAt(0).toUpperCase();
                const label = note.frontmatter.tags?.[0] || (locale === "id" ? "Catatan" : "Note");

                const item = {
                  slug: note.slug,
                  title: note.frontmatter.title,
                  description: note.frontmatter.description,
                  href: noteHref,
                  type: "note" as const,
                };

                return (
                  <CarouselItem key={note.slug} className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3 py-2 flex">
                    <article
                      className={cn(
                        "group relative bg-card/80 rounded-md overflow-hidden border border-primary/10 ring-1 ring-transparent shadow-md transition-all duration-400 hover:-translate-y-1 h-full flex flex-col w-full",
                        multicolor.hoverRing,
                        multicolor.hoverShadow,
                      )}
                    >
                      <Link href={noteHref} className="flex h-full flex-col">
                        <div className={cn("relative aspect-[3/4] bg-gradient-to-b flex items-center justify-center", multicolor.gradient)}>
                          <div
                            className={cn(
                              "absolute inset-0 bg-linear-to-t opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                              multicolor.overlayGradient,
                            )}
                          />
                          <div className={cn("absolute bottom-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover:opacity-100", multicolor.accentBar)} />
                          <span className="font-display text-5xl sm:text-6xl font-extrabold text-white/95 tracking-tight">
                            {firstLetter || "N"}
                          </span>
                          <AddToReadingListButton
                            item={item}
                            dictionary={dictionary}
                            showText={false}
                            className="absolute top-2 right-2 z-10 text-white bg-black/25 hover:bg-black/45 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                          />
                        </div>

                        <div className="p-4 sm:p-5 flex-1">
                          <div className="mb-2 line-clamp-1">
                            <CategoryBadge
                              label={label}
                              type="note"
                              size="xs"
                            />
                          </div>
                          <h3 className={cn("font-display text-base font-semibold text-primary leading-snug transition-colors mb-2", multicolor.hoverTitle)}>
                            {note.frontmatter.title}
                          </h3>
                          <RelativeTime
                            date={note.frontmatter.date}
                            locale={locale}
                            className="text-[10px] text-muted-foreground/80 block"
                          />
                        </div>
                      </Link>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => api?.scrollPrev()}
                  disabled={!canScrollPrev}
                  className="h-8 w-8 rounded-full border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
                  aria-label={locale === "id" ? "Slide sebelumnya" : "Previous slide"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {scrollSnaps.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      type="button"
                      onClick={() => api?.scrollTo(index)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        index === selectedIndex
                          ? "w-4 bg-primary/70"
                          : "w-1.5 bg-primary/25 hover:bg-primary/40",
                      )}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => api?.scrollNext()}
                  disabled={!canScrollNext}
                  className="h-8 w-8 rounded-full border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
                  aria-label={locale === "id" ? "Slide berikutnya" : "Next slide"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <Link
                href={viewMoreHref}
                className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                <span>{viewMoreText}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Carousel>
        </ScrollReveal>
      </div>
    </section>
  );
}
