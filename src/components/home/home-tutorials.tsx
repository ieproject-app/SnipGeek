'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { ChevronRight } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { Dictionary } from '@/lib/get-dictionary';
import { CategoryBadge } from '@/components/layout/category-badge';

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
            <div className="w-full h-0.5 bg-linear-to-r from-accent via-accent/50 to-transparent" />
          </div>
        </ScrollReveal>

        {/* Slider */}
        <ScrollReveal direction="up" delay={0.2}>
          <Carousel
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

                return (
                  <CarouselItem key={post.slug} className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3 pb-6 pt-2">
                    <article className={cn(
                      "relative bg-card rounded-lg border border-primary/5 transition-all duration-500 h-full flex flex-col group/card overflow-hidden shadow-md",
                      "hover:-translate-y-1.5 hover:border-primary/10",
                      "dark:shadow-black/40"
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
                          <h3 className="font-display text-base font-semibold text-primary leading-snug group-hover:text-accent transition-colors">
                            {post.frontmatter.title}
                          </h3>
                          <time className="text-[10px] text-muted-foreground mt-3 block font-medium opacity-60">
                            {formatRelativeTime(new Date(post.frontmatter.date), locale)}
                          </time>
                        </div>
                      </Link>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {/* Controls & Custom "View More" Style */}
            <div className="mt-6 flex justify-center">
              <Link
                href={viewMoreHref}
                className="flex items-center gap-2 bg-accent/5 px-3 py-1.5 rounded-full border border-accent/30 hover:bg-accent/10 transition-all group"
              >
                <div className="flex items-center gap-1 pr-2.5 border-r border-accent/20">
                  <div className="h-1 w-5 bg-accent rounded-full" />
                  <div className="h-0.75 w-0.75 bg-accent rounded-full" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-accent/90 group-hover:text-accent transition-all flex items-center gap-1">
                  {viewMoreText}
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </Carousel>
        </ScrollReveal>
      </div>
    </section>
  );
}
