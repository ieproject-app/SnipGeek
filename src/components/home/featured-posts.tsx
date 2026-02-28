
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post, PostFrontmatter } from '@/lib/posts';
import { Dictionary } from '@/lib/get-dictionary';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Flame, ArrowRight, Clock } from 'lucide-react';

interface FeaturedPostsProps {
  posts: Post<PostFrontmatter>[];
  dictionary: Dictionary;
  locale: string;
  linkPrefix: string;
}

/**
 * FeaturedPosts - Refactored into a high-impact 4-column grid.
 * Features: Equal 4/3 aspect ratio, category-coded accents, and animated descriptions.
 */
export function FeaturedPosts({ posts, dictionary, locale, linkPrefix }: FeaturedPostsProps) {
  if (posts.length === 0) return null;

  // Lookup for category-specific colors
  const categoryColors: Record<string, { bg: string; text: string; shadow: string; border: string; accent: string }> = {
    'Tutorial': { 
        bg: 'bg-blue-500/20', 
        text: 'text-blue-400', 
        shadow: 'group-hover:shadow-blue-500/20', 
        border: 'border-blue-500',
        accent: 'text-blue-500'
    },
    'Windows': { 
        bg: 'bg-sky-500/20', 
        text: 'text-sky-400', 
        shadow: 'group-hover:shadow-sky-500/20', 
        border: 'border-sky-500',
        accent: 'text-sky-500'
    },
    'Linux': { 
        bg: 'bg-orange-500/20', 
        text: 'text-orange-400', 
        shadow: 'group-hover:shadow-orange-500/20', 
        border: 'border-orange-500',
        accent: 'text-orange-500'
    },
    'Hardware': { 
        bg: 'bg-emerald-500/20', 
        text: 'text-emerald-400', 
        shadow: 'group-hover:shadow-emerald-500/20', 
        border: 'border-emerald-500',
        accent: 'text-emerald-500'
    },
    'Automation': { 
        bg: 'bg-violet-500/20', 
        text: 'text-violet-400', 
        shadow: 'group-hover:shadow-violet-500/20', 
        border: 'border-violet-500',
        accent: 'text-violet-500'
    },
    'default': { 
        bg: 'bg-accent/20', 
        text: 'text-accent', 
        shadow: 'group-hover:shadow-accent/20', 
        border: 'border-accent',
        accent: 'text-accent'
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-background border-y border-primary/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 flex items-center gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary/40 shrink-0">
                {dictionary.home.featuredPosts}
            </h2>
            <div className="h-px bg-primary/5 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post, index) => {
            const heroImageValue = post.frontmatter.heroImage;
            let heroImageSrc: string | undefined;
            let heroImageHint: string | undefined;

            if (heroImageValue) {
                if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
                    heroImageSrc = heroImageValue;
                    heroImageHint = post.frontmatter.imageAlt || post.frontmatter.title;
                } else {
                    const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
                    if (placeholder) {
                        heroImageSrc = placeholder.imageUrl;
                        heroImageHint = placeholder.imageHint;
                    }
                }
            }

            const category = post.frontmatter.category || 'Tutorial';
            const colors = categoryColors[category] || categoryColors.default;
            
            const item = {
                slug: post.slug,
                title: post.frontmatter.title,
                description: post.frontmatter.description,
                href: `${linkPrefix}/blog/${post.slug}`,
                type: 'blog' as const,
            };

            // Estimate reading time
            const wordCount = post.frontmatter.description?.length || 0;
            const readingTime = Math.max(1, Math.ceil(wordCount / 50));

            return (
              <div key={post.slug} className="group h-full">
                <Link href={`${linkPrefix}/blog/${post.slug}`} className="block h-full" aria-label={`Read ${post.frontmatter.title}`}>
                    <article className={cn(
                        "relative w-full aspect-[4/3] rounded-xl overflow-hidden transition-all duration-500 ease-out",
                        "bg-muted border border-primary/5",
                        "hover:-translate-y-2 hover:scale-[1.02] shadow-xl",
                        colors.shadow
                    )}>
                        {/* 3px bottom border accent */}
                        <div className={cn(
                            "absolute bottom-0 left-0 right-0 h-[3px] z-30 transition-opacity duration-500 opacity-0 group-hover:opacity-100",
                            colors.border,
                            "bg-current" // Uses the color from the border class
                        )} />

                        {/* Top Overlay: Category & Actions */}
                        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-start justify-between">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-lg",
                                colors.bg, colors.text
                            )}>
                                {category}
                            </span>
                            <div className="flex items-center gap-2">
                                <AddToReadingListButton 
                                    item={item}
                                    dictionary={dictionary.readingList}
                                    showText={false}
                                    className="text-white bg-black/20 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100"
                                />
                                <div className="p-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/20">
                                    <Flame className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                                </div>
                            </div>
                        </div>

                        {/* Image Layer */}
                        {heroImageSrc && (
                            <Image
                                src={heroImageSrc}
                                alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                fill
                                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                priority={index < 4}
                                data-ai-hint={heroImageHint}
                            />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />

                        {/* Content Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
                            {/* Animated Description */}
                            <p className="text-[11px] leading-relaxed text-white/60 mb-3 line-clamp-2 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
                                {post.frontmatter.description}
                            </p>

                            <h3 className="font-serif text-lg md:text-xl font-bold leading-tight mb-4 line-clamp-2 group-hover:text-white transition-colors">
                                {post.frontmatter.title}
                            </h3>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter text-white/40">
                                    <span>{formatRelativeTime(new Date(post.frontmatter.date), locale)}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime} MIN</span>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                    "group-hover:translate-x-1",
                                    colors.text
                                )}>
                                    READ <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        </div>
                    </article>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
