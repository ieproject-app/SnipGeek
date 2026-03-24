'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RelativeTime } from '@/components/ui/relative-time';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { Dictionary } from '@/lib/get-dictionary';
import { CategoryBadge } from '@/components/layout/category-badge';
import { getMulticolorSeed, getMulticolorTheme } from '@/lib/multicolor';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { RevealImage } from '@/components/ui/reveal-image';

interface SliderPost {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    heroImage: string;
    imageAlt?: string;
    category?: string;
    date: string;
  };
}

interface HomeTutorialsProps {
  posts: SliderPost[];
  title: string;
  viewMoreText: string;
  dictionary: Dictionary;
  locale: string;
  tag?: string;
}

export function HomeTutorials({ posts, title, viewMoreText, dictionary, locale, tag }: HomeTutorialsProps) {
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

    api.on('select', onSelect);
    api.on('reInit', onSelect);

    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  const linkPrefix = locale === 'en' ? '' : `/${locale}`;
  const viewMoreHref = tag ? `${linkPrefix}/tags/${tag.toLowerCase()}` : `${linkPrefix}/blog`;

  return (
    <section className="pb-12 sm:pb-16 overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Left Aligned */}
        <ScrollReveal direction="left">
          <div className="mb-8 text-left">
            <h2 className="text-sm font-medium font-display text-primary mb-2 italic">
              {title}
            </h2>
            <div className="w-full h-0.5 bg-[linear-gradient(to_right,#0078D4,#E95420,transparent)]" />
          </div>
        </ScrollReveal>

        {/* Slider */}
        <ScrollReveal direction="up" delay={0.2}>
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 sm:-ml-6">
              {posts.map((post) => {
                const heroImageValue = post.frontmatter.heroImage;
                let heroImageSrc = "/images/blank/blank.webp";
                let heroImageHint = post.frontmatter.imageAlt || post.frontmatter.title;

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
                const multicolor = getMulticolorTheme(
                  getMulticolorSeed(post.slug, post.frontmatter.category, post.frontmatter.title),
                );

                return (
                  <CarouselItem key={post.slug} className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3 pb-6 pt-2">
                    <article className={cn(
                      "relative bg-card rounded-lg border border-primary/5 transition-all duration-500 h-full flex flex-col group/card overflow-hidden shadow-md ring-1 ring-transparent",
                      "hover:-translate-y-1.5 hover:border-primary/10",
                      "dark:shadow-black/40",
                      multicolor.hoverRing,
                      multicolor.hoverShadow,
                    )}>
                      <Link href={`${linkPrefix}/blog/${post.slug}`} className="block h-full group">
                        {/* Image container - Tuned to 8:5 for richer card height */}
                        <div className="relative aspect-8/5 overflow-hidden z-10 rounded-t-lg">
                          <RevealImage
                            src={heroImageSrc}
                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                            fill
                            className="transition-transform duration-700 group-hover:scale-110"
                            wrapperClassName="absolute inset-0"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                            holdUntilLoaded
                            initialVisitOnly
                            showSkeleton
                            data-ai-hint={heroImageHint}
                          />
                          <div className={cn('absolute inset-0 bg-linear-to-t opacity-0 transition-opacity duration-500 group-hover/card:opacity-100', multicolor.overlayGradient)} />
                          <div className={cn('absolute bottom-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100', multicolor.accentBar)} />
                          <AddToReadingListButton
                            item={item}
                            dictionary={dictionary}
                            showText={false}
                            className="absolute top-2 right-2 z-20 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover/card:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col z-10">
                          <div className="mb-2">
                            <CategoryBadge category={post.frontmatter.category || 'Featured'} />
                          </div>
                          <h3 className={cn('font-display text-base font-semibold text-primary leading-snug transition-colors mb-2', multicolor.hoverTitle)}>
                            {post.frontmatter.title}
                          </h3>
                          <RelativeTime
                            date={post.frontmatter.date}
                            locale={locale}
                            className="text-[10px] text-muted-foreground block font-medium opacity-60"
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
                  aria-label={locale === 'id' ? 'Slide sebelumnya' : 'Previous slide'}
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
                        'h-1.5 rounded-full transition-all',
                        index === selectedIndex
                          ? 'w-4 bg-primary/70'
                          : 'w-1.5 bg-primary/25 hover:bg-primary/40',
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
                  aria-label={locale === 'id' ? 'Slide berikutnya' : 'Next slide'}
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
