'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { RevealImage } from '@/components/ui/reveal-image';
import type { Dictionary } from '@/lib/get-dictionary';

import { ScrollReveal } from '@/components/ui/scroll-reveal';

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

interface HomeUpdatesProps {
  posts: SliderPost[];
  title: string;
  viewMoreText: string;
  dictionary: Dictionary;
  locale: string;
  tag?: string;
  viewMoreHref?: string;
}

export function HomeUpdates({ posts, title, viewMoreText, dictionary, locale, tag, viewMoreHref }: HomeUpdatesProps) {
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;
  const finalViewMoreHref = viewMoreHref || (tag ? `${linkPrefix}/tags/${tag.toLowerCase()}` : `${linkPrefix}/blog`);

  return (
    <section className="pb-12 sm:pb-16 overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="left">
          <div className="mb-8 text-left">
            <h2 className="text-sm font-medium font-display text-primary mb-2 italic">
              {title}
            </h2>
            <div className="w-full h-0.5 bg-[linear-gradient(to_right,#0078D4,#E95420,transparent)]" />
          </div>
        </ScrollReveal>

        {/* Carousel */}
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
                  <CarouselItem key={post.slug} className="pl-4 sm:pl-6 md:basis-1/2 py-2">
                    <article className={cn(
                      "bg-card/50 rounded-lg overflow-hidden border border-primary/5 p-3 transition-all duration-500 h-full flex gap-4 shadow-sm group",
                      "hover:-translate-y-1 hover:bg-card hover:border-primary/10"
                    )}>
                      <Link href={`${linkPrefix}/blog/${post.slug}`} className="contents">
                        {/* Thumbnail Container - Responsive 3:2 for denser visual balance */}
                        <div className="relative w-30 h-20 sm:w-36 sm:h-24 shrink-0 overflow-hidden rounded-lg shadow-sm border border-primary/5 mt-0.5">
                          <RevealImage
                            src={heroImageSrc}
                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 640px) 120px, 144px"
                            quality={64}
                            data-ai-hint={heroImageHint}
                          />
                          <AddToReadingListButton
                            item={item}
                            dictionary={dictionary}
                            showText={false}
                            className="absolute top-1 right-1 z-20 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity h-6 w-6"
                          />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                          <h3 className="font-display text-[15px] sm:text-base font-medium text-primary leading-snug transition-colors group-hover:text-accent">
                            {post.frontmatter.title}
                          </h3>
                        </div>
                      </Link>
                    </article>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {/* Controls - Redesigned Style */}
            <div className="mt-6 flex justify-center">
              <Link
                href={finalViewMoreHref}
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
