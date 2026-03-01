'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { i18n } from '@/i18n-config';
import { StickyNote } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

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
  const db = useFirestore();
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  // Fetch Firestore Related Content
  const collectionName = type === 'blog' ? 'blogPosts_published' : 'notes_published';
  const fsQuery = useMemoFirebase(() => 
    query(
        collection(db, collectionName),
        where('locale', '==', locale)
    ), [db, locale, collectionName]);
  
  const { data: firestoreContent } = useCollection(fsQuery);

  const allRelated = useMemo(() => {
    // 1. Combine initial (files) and Firestore
    const merged = [...initialRelatedContent];
    
    if (firestoreContent) {
        firestoreContent.forEach(fp => {
            if (fp.slug !== currentSlug && !merged.find(item => item.slug === fp.slug)) {
                merged.push({
                    slug: fp.slug,
                    frontmatter: {
                        ...fp,
                        heroImage: fp.heroImageUrl || 'footer-about',
                        imageAlt: fp.heroImageAltText,
                        date: fp.publishDate || fp.date,
                        published: true
                    }
                });
            }
        });
    }

    // 2. Score them
    const scored = merged.map(item => {
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
    .filter(item => item.score > 0 || initialRelatedContent.some(i => i.slug === item.slug))
    .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3);
  }, [initialRelatedContent, firestoreContent, currentSlug, currentTags, currentCategory, type]);

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
                        dictionary={dictionary.readingList}
                        className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>

                <p className="text-[10px] font-medium tracking-wider text-accent mb-1.5 uppercase">
                    {item.frontmatter.category || (isBlog ? 'Article' : 'Note')}
                </p>
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
