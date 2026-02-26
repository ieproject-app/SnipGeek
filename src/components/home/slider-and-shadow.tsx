
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

interface SliderAndShadowProps {
  posts: SliderPost[];
  title: string;
  viewMoreText: string;
  locale: string;
}

export function SliderAndShadow({ posts, title, viewMoreText, locale }: SliderAndShadowProps) {
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
    <section className="bg-white py-20 overflow-hidden">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-left">
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary inline-block relative">
            {title}
            <div className="absolute -bottom-2 left-0 w-12 h-1.5 bg-accent rounded-full" />
          </h2>
        </div>

        {/* Slider */}
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
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
                <CarouselItem key={post.slug} className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3">
                  <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group h-full">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-[0_15px_45px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.18)] group-hover:-translate-y-2 h-full flex flex-col border border-primary/5">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={heroImageSrc}
                          alt={post.frontmatter.imageAlt || post.frontmatter.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                          data-ai-hint={heroImageHint}
                        />
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-3 block">
                          {post.frontmatter.category || 'Featured'}
                        </span>
                        <h3 className="font-headline text-xl font-bold text-primary leading-snug line-clamp-2 mb-6 group-hover:text-accent transition-colors">
                          {post.frontmatter.title}
                        </h3>
                        <div className="mt-auto pt-5 border-t border-primary/5">
                          <p className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">
                            By: <span className="text-primary/80">snipgeek.com</span>
                          </p>
                        </div>
                      </div>
                    </article>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Controls Container */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-10">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-4 order-2 sm:order-1">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12 border-primary/10 bg-white text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                onClick={() => api?.scrollPrev()}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12 border-primary/10 bg-white text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                onClick={() => api?.scrollNext()}
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Pagination Dots & More Link */}
            <div className="flex items-center gap-8 order-1 sm:order-2 bg-muted/30 px-6 py-3 rounded-full border border-primary/5">
              <div className="flex items-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      "h-2 transition-all duration-500 rounded-full",
                      current === i ? "w-10 bg-accent" : "w-2 bg-primary/15"
                    )}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              
              <div className="h-5 w-px bg-primary/10 hidden sm:block" />

              <Link 
                href={`${linkPrefix}/blog`} 
                className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-accent transition-all flex items-center gap-1.5 group/more"
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
