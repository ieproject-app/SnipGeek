'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Undo2, ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { Dictionary } from '@/lib/get-dictionary';
import { CategoryBadge } from '@/components/layout/category-badge';

interface TopicPost {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    category?: string;
    date: string;
    heroImage: string;
    imageAlt?: string;
  };
}

interface TopicSectionProps {
  posts: TopicPost[];
  title: string;
  breadcrumbHome: string;
  viewAllText: string;
  readingListDictionary: Dictionary['readingList'];
  locale: string; 
  linkPrefix: string;
  tag: string;
}

export function TopicSection({ 
  posts, 
  title, 
  breadcrumbHome, 
  viewAllText,
  readingListDictionary,
  locale, 
  linkPrefix,
  tag
}: TopicSectionProps) {
  const renderHorizontalCard = (post: TopicPost) => {
    const heroImageValue = post.frontmatter.heroImage;
    let heroImageSrc = "/images/blank/blank.webp";
    if (heroImageValue) {
        if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
            heroImageSrc = heroImageValue;
        } else {
            const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
            if (placeholder) heroImageSrc = placeholder.imageUrl;
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
        <div key={post.slug} className="group relative flex items-start gap-4 py-3 border-b border-primary/5 transition-all duration-300">
            <Link 
                href={`${linkPrefix}/blog/${post.slug}`} 
                className="flex items-start gap-4 flex-1 min-w-0"
            >
                {/* Image Container - Updated to 4:3 (120x90) */}
                <div className="relative w-[120px] h-[90px] shrink-0 overflow-hidden rounded-lg shadow-sm border border-primary/5">
                    <Image
                        src={heroImageSrc}
                        alt={post.frontmatter.imageAlt || post.frontmatter.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="120px"
                    />
                </div>
                <div className="flex-1 min-w-0 py-1">
                    <div className="mb-1">
                        <CategoryBadge category={post.frontmatter.category || tag} />
                    </div>
                    <h3 className="font-headline text-[13px] md:text-sm font-medium text-primary leading-snug line-clamp-2 transition-colors group-hover:text-accent">
                        {post.frontmatter.title}
                    </h3>
                    <time className="text-[10px] text-muted-foreground mt-2 block font-medium opacity-60">
                        {formatRelativeTime(new Date(post.frontmatter.date), locale)}
                    </time>
                </div>
            </Link>
            <AddToReadingListButton 
                item={item}
                dictionary={readingListDictionary}
                showText={false}
                className="self-center text-muted-foreground hover:text-primary h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
        </div>
    );
  };

  const breadcrumbSegments = [
    { label: breadcrumbHome, href: linkPrefix || '/' },
    { label: tag }
  ];

  return (
    <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-10 text-left">
            <h2 className="text-3xl font-extrabold font-headline tracking-tight text-primary mb-2">
                {title}
            </h2>
            <Breadcrumbs segments={breadcrumbSegments} className="mb-4" />
            <div className="w-12 h-1 bg-accent rounded-full" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {posts.map((post) => renderHorizontalCard(post))}
        </div>

        <footer className="mt-12 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50 select-none">
                <Undo2 className="h-4 w-4" />
                {breadcrumbHome}
            </div>
            
            <Link 
                href={`${linkPrefix}/tags/${tag.toLowerCase()}`}
                className="flex items-center gap-2 text-sm font-bold text-accent hover:text-primary transition-all group"
            >
                <span>{viewAllText}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
        </footer>
    </section>
  );
}