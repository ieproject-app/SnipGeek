
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { StickyNote } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { CategoryBadge } from '@/components/layout/category-badge';

type RelatedPostsProps = {
  type: 'blog' | 'note';
  locale: string;
  currentSlug: string;
  currentTags?: string[];
  currentCategory?: string;
  initialRelatedContent: any[];
  dictionary: any;
};

export function RelatedPosts({ 
    type, 
    locale, 
    currentSlug, 
    currentTags = [], 
    currentCategory, 
    initialRelatedContent,
    dictionary 
}: RelatedPostsProps) {
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  // Related content is now strictly from local MDX files
  const allRelated = useMemo(() => {
    const scored = initialRelatedContent.map(item => {
        let score = 0;
        const itemTags = item.frontmatter.tags || [];
        const itemCategory = item.frontmatter.category;

        if (type === 'blog' && currentCategory && itemCategory && currentCategory === itemCategory) {
            score += 5;
        }

        currentTags.forEach(tag => {
            if (itemTags.includes(tag)) {
                score += 1;
            }
        });

        return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3);
  }, [initialRelatedContent, currentCategory, currentTags, type]);

  if (allRelated.length === 0) return null;

  const renderCard = (item: any) => {
    const isBlog = type === 'blog';
    const heroImageValue = item.frontmatter.heroImage;
    let heroImageSrc: string | undefined;
    let heroImageHint: string | undefined;

    if (isBlog && heroImageValue) {
        if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
            heroImageSrc = heroImageValue;
            heroImageHint = item.frontmatter.imageAlt || item.frontmatter.title;
        } else {
            const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
            if (placeholder) {
                heroImageSrc = placeholder.imageUrl;
                heroImageHint = placeholder.imageHint;
            }
        }
    }

    const readingListItem = {
        slug: item.slug,
        title: item.frontmatter.title,
        description: item.frontmatter.description,
        href: `${linkPrefix}/${isBlog ? 'blog' : 'notes'}/${item.slug}`,
        type: type,
    };
    
    return (
        <div key={item.slug} className="group relative transition-all duration-500 hover:-translate-y-1">
            <Link href={readingListItem.href} className="block">
                <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4 shadow-sm border border-primary/5 bg-primary/5 flex items-center justify-center">
                    {heroImageSrc ? (
                        <Image
                            src={heroImageSrc}
                            alt={item.frontmatter.imageAlt || item.frontmatter.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 300px"
                            data-ai-hint={heroImageHint}
                        />
                    ) : (
                        <StickyNote className="h-12 w-12 text-primary/20 transition-transform duration-700 group-hover:scale-110" />
                    )}
                    <AddToReadingListButton 
                        item={readingListItem}
                        showText={false}
                        dictionary={dictionary}
                        className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>

                <div className="mb-2">
                    <CategoryBadge category={item.frontmatter.category} type={type} />
                </div>
                <h3 className="font-headline text-base font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight">
                    {item.frontmatter.title}
                </h3>
                <time className="text-[10px] font-medium text-muted-foreground mt-2 block opacity-60">
                    {formatRelativeTime(new Date(item.frontmatter.date), locale)}
                </time>
            </Link>
        </div>
    );
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t mt-16">
      <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-12 text-center">
        {dictionary.post.relatedContent}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
        {allRelated.map(item => renderCard(item))}
      </div>
    </section>
  );
}
