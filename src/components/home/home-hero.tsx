'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post, PostFrontmatter } from '@/lib/posts';
import { Dictionary } from '@/lib/get-dictionary';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { ArrowRight } from 'lucide-react';
import { CategoryBadge, getBadgeStyle, simplifyCategoryLabel } from '@/components/layout/category-badge';

interface HomeHeroProps {
    posts: Post<PostFrontmatter>[];
    dictionary: Dictionary;
    locale: string;
    linkPrefix: string;
}

/**
 * HomeHero - A sophisticated 4-column staggered gallery grid using the colorful badge system.
 * Updated: Category badge moved to Caption Block (Option 1) and minimalist labels implemented.
 */
export function HomeHero({ posts, dictionary, locale, linkPrefix }: HomeHeroProps) {
    if (posts.length === 0) return null;

    return (
        <section className="py-12 sm:py-16 bg-card border-b border-primary/5">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
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

                        const rawCategory = post.frontmatter.category || 'Tutorial';
                        const simplifiedCategory = simplifyCategoryLabel(rawCategory);
                        const badgeStyle = getBadgeStyle(simplifiedCategory);
                        const isStaggered = index % 2 !== 0;

                        const item = {
                            slug: post.slug,
                            title: post.frontmatter.title,
                            description: post.frontmatter.description,
                            href: `${linkPrefix}/blog/${post.slug}`,
                            type: 'blog' as const,
                        };

                        return (
                            <div
                                key={post.slug}
                                className={cn(
                                    "group relative transition-all duration-500 ease-out",
                                    isStaggered && "lg:mt-10"
                                )}
                            >
                                <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read ${post.frontmatter.title}`}>
                                    <article className="space-y-5">
                                        {/* Image Block */}
                                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-md group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-500">
                                            {/* Accent Bar (Bottom) - Color matches category */}
                                            <div
                                                className={cn("absolute bottom-0 left-0 right-0 h-[3px] z-30 transition-opacity duration-500 opacity-0 group-hover:opacity-100", badgeStyle.dot)}
                                            />
                                            {/* Cinematic Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

                                            {/* Hero Image */}
                                            {heroImageSrc && (
                                                <Image
                                                    src={heroImageSrc}
                                                    alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                                    fill
                                                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                    priority={index < 4}
                                                    data-ai-hint={heroImageHint}
                                                />
                                            )}
                                        </div>

                                        {/* Caption Block */}
                                        <div className="px-1 space-y-3">
                                            {/* Option 1: Category Badge inside text block, above title */}
                                            <div>
                                                <CategoryBadge
                                                    category={rawCategory}
                                                    size="xs"
                                                    className="shadow-sm"
                                                />
                                            </div>

                                            <h3 className="font-display text-xl font-bold leading-snug text-primary group-hover:text-accent transition-colors duration-300">
                                                {post.frontmatter.title}
                                            </h3>

                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                                                    {formatRelativeTime(new Date(post.frontmatter.date), locale)}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <AddToReadingListButton
                                                        item={item}
                                                        dictionary={dictionary}
                                                        showText={false}
                                                        className="h-8 w-8 rounded-full border-none bg-primary/[0.03] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                                                    />
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                            badgeStyle.text,
                                                            "group-hover:bg-primary/5"
                                                        )}
                                                    >
                                                        READ <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                    </div>
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