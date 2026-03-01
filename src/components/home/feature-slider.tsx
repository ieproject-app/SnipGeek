
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from '@/components/ui/carousel';
import { ChevronRight } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { Dictionary } from '@/lib/get-dictionary';

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

interface FeatureSliderProps {
  posts: SliderPost[];
  title: string;
  viewMoreText: string;
  readingListDictionary: Dictionary['readingList'];
  locale: string;
  tag?: string;
}

export function FeatureSlider({ posts, title, viewMoreText, readingListDictionary, locale, tag }: FeatureSliderProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const linkPrefix = locale === 'en' ? '' : `/${locale}`;
  const viewMoreHref = tag ? `${linkPrefix}/tags/${tag.toLowerCase()}` : `${linkPrefix}/blog`;

  return (
    <section className="pb-12 sm:pb-16 overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Left Aligned */}
        <div className="mb-8 text-left">
          <h2 className="text-sm font-medium font-headline text-primary mb-2 italic">
            {title}
          </h2>
          <div className="w-12 h-1 bg-accent rounded-full" />
        </div>

        {/* Slider */}
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

              return (
                <CarouselItem key={post.slug} className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3 py-8">
                  <article className={cn(
                      "relative bg-card rounded-lg border border-primary/5 transition-all duration-500 h-full flex flex-col group/card overflow-hidden shadow-md",
                      "hover:-translate-y-1.5 hover:border-primary/10",
                      "dark:shadow-black/40"
                  )}>
                    <Link href={`${linkPrefix}/blog/${post.slug}`} className="block h-full group">
                      {/* Image container - Changed to aspect 4:3 */}
                      <div className="relative aspect-[4/3] overflow-hidden z-10 rounded-t-lg">
                        <Image
                          src={heroImageSrc}
                          alt={post.frontmatter.imageAlt || post.frontmatter.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                          data-ai-hint={heroImageHint}
                        />
                        <AddToReadingListButton 
                          item={item}
                          dictionary={readingListDictionary}
                          showText={false}
                          className="absolute top-2 right-2 z-20 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover/card:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col z-10">
                        <span className="text-[10px] font-bold tracking-widest text-accent mb-2 block">
                          {post.frontmatter.category || 'Featured'}
                        </span>
                        <h3 className="font-headline text-base font-semibold text-primary leading-snug group-hover:text-accent transition-colors">
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
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-6 bg-muted/30 px-5 py-2.5 rounded-full border border-primary/5">
              <div className="flex items-center gap-2 pr-4 border-r border-primary/10">
                <div className="h-1.5 w-8 bg-accent rounded-full" />
                <div className="h-1.5 w-1.5 bg-primary/20 rounded-full" />
                <div className="h-1.5 w-1.5 bg-primary/20 rounded-full" />
              </div>

              <Link 
                href={viewMoreHref} 
                className="text-sm font-bold text-primary/80 hover:text-primary transition-all flex items-center gap-2 group/more"
              >
                {viewMoreText}
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/more:translate-x-1" />
              </Link>
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
