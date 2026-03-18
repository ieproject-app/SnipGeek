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
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";

const NOTE_COLOR_PALETTE = [
  "from-[#2f8ecf] to-[#3f98d4]",
  "from-[#7f009e] to-[#8d00ac]",
  "from-[#ec9634] to-[#f2a640]",
  "from-[#1a9f7a] to-[#24b58d]",
  "from-[#5b4fd9] to-[#6c63ec]",
  "from-[#0f7c90] to-[#1794ab]",
  "from-[#9a3412] to-[#c2410c]",
  "from-[#14532d] to-[#1f7a46]",
  "from-[#7c2d12] to-[#c2410c]",
  "from-[#1e3a8a] to-[#2563eb]",
  "from-[#831843] to-[#be185d]",
  "from-[#365314] to-[#65a30d]",
];

interface HomeNotesProps {
  notes: Note<NoteFrontmatter>[];
  title: string;
  viewMoreText: string;
  dictionary: Dictionary;
  locale: string;
  linkPrefix: string;
  viewMoreHref: string;
}

const getColorIndex = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % NOTE_COLOR_PALETTE.length;
};

const getNoteColorSeed = (note: Note<NoteFrontmatter>) => {
  const translationKey = note.frontmatter.translationKey || "";
  return `${note.slug}|${translationKey}|${note.frontmatter.title}`.toLowerCase();
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
                const colorClass = NOTE_COLOR_PALETTE[getColorIndex(seed)];
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
                    <article className="group relative bg-card/80 rounded-md overflow-hidden border border-primary/10 shadow-md transition-all duration-400 hover:-translate-y-1 hover:border-primary/20 h-full flex flex-col w-full">
                      <Link href={noteHref} className="flex h-full flex-col">
                        <div className={cn("relative aspect-[3/4] bg-gradient-to-b flex items-center justify-center", colorClass)}>
                          <span className="font-display text-5xl sm:text-6xl font-extrabold text-white/95 tracking-tight">
                            {firstLetter || "N"}
                          </span>
                          <AddToReadingListButton
                            item={item}
                            dictionary={dictionary}
                            showText={false}
                            className="absolute top-2 right-2 z-10 text-white bg-black/25 hover:bg-black/45 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>

                        <div className="p-4 sm:p-5 flex-1">
                          <p className="text-[11px] font-semibold text-emerald-500 mb-1.5 line-clamp-1">
                            {label}
                          </p>
                          <h3 className="font-display text-base font-medium text-primary leading-snug transition-colors group-hover:text-accent mb-2">
                            {note.frontmatter.title}
                          </h3>
                          <time className="text-[10px] text-muted-foreground/80 block">
                            {formatRelativeTime(new Date(note.frontmatter.date), locale)}
                          </time>
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
