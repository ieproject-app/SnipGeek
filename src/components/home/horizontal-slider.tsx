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
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

interface HorizontalSliderProps {
  posts: SliderPost[];
  title: string;
  viewMoreText: string;
  locale: string;
}

/**
 * HorizontalSlider - A carousel component displaying cards with 1:1 images.
 * Mixes the carousel functionality of FeatureSlider with the card style of TopicSection.
 */
export function HorizontalSlider({ posts, title, viewMoreText, locale }: HorizontalSliderProps) {
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

  return (
    <section className="pb-12 sm:pb-16 overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-left">
          <h2 className="text-sm font-medium font-headline text-primary mb-2 italic">
            {title}
          </h2>
          <div className="w-12 h-1 bg-accent rounded-full" />
        </div>

        {/* Carousel */}
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

              return (
                <CarouselItem key={post.slug} className="pl-4 sm:pl-6 md:basis-1/2">
                  <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group h-full">
                    <article className="bg-card/50 rounded-xl overflow-hidden border border-primary/5 p-3 transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full flex gap-4">
                      {/* 1:1 Square Thumbnail (100px) */}
                      <div className="relative w-[100px] h-[100px] shrink-0 overflow-hidden rounded-lg shadow-sm border border-primary/5">
                        <Image
                          src={heroImageSrc}
                          alt={post.frontmatter.imageAlt || post.frontmatter.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="100px"
                          data-ai-hint={heroImageHint}
                        />
                      </div>
                      
                      {/* Content Area */}
                      <div className="flex-1 min-w-0 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1 block">
                          {post.frontmatter.category || 'Update'}
                        </span>
                        <h3 className="font-headline text-[13px] md:text-sm font-medium text-primary leading-snug line-clamp-2 transition-colors group-hover:text-accent">
                          {post.frontmatter.title}
                        </h3>
                        <time className="text-[10px] text-muted-foreground mt-2 block font-medium opacity-60">
                          {new Date(post.frontmatter.date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                        </time>
                      </div>
                    </article>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Controls */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9 border-primary/10 bg-background text-primary hover:bg-primary hover:text-white transition-all"
                onClick={() => api?.scrollPrev()}
                disabled={!api?.canScrollPrev()}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9 border-primary/10 bg-background text-primary hover:bg-primary hover:text-white transition-all"
                onClick={() => api?.scrollNext()}
                disabled={!api?.canScrollNext()}
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-6 order-1 sm:order-2 bg-muted/30 px-5 py-2 rounded-full border border-primary/5">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      "h-1 transition-all duration-300 rounded-full",
                      current === i ? "w-6 bg-accent" : "w-1 bg-primary/20"
                    )}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              
              <div className="h-3 w-px bg-primary/10 hidden sm:block" />

              <Link 
                href={`${linkPrefix}/blog`} 
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-accent transition-all flex items-center gap-1 group/more"
              >
                {viewMoreText}
                <ChevronRight className="h-3 w-3 transition-transform group-hover/more:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
