"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { RevealImage } from "@/components/ui/reveal-image";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import type { Post, PostFrontmatter } from "@/lib/posts";
import type { Dictionary } from "@/lib/get-dictionary";

interface HomeLatestProps {
    posts: Post<PostFrontmatter>[];
    dictionary: Dictionary;
    locale: string;
    linkPrefix: string;
}

export const HomeLatest = ({
    posts,
    dictionary,
    locale,
    linkPrefix,
}: HomeLatestProps) => {
    const renderLatestCard = (post: Post<PostFrontmatter>, index: number) => {
        const heroImageValue = post.frontmatter.heroImage;
        let heroImageSrc: string | undefined;
        let heroImageHint: string | undefined;

        if (heroImageValue) {
            if (heroImageValue.startsWith("http") || heroImageValue.startsWith("/")) {
                heroImageSrc = heroImageValue;
                heroImageHint = post.frontmatter.imageAlt || post.frontmatter.title;
            } else {
                const placeholder = PlaceHolderImages.find(
                    (p) => p.id === heroImageValue,
                );
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
            type: "blog" as const,
        };
        const multicolor = getMulticolorTheme(
            getMulticolorSeed(post.slug, post.frontmatter.category, post.frontmatter.title),
        );

        return (
            <ScrollReveal key={post.slug} direction="up" delay={index * 0.1}>
                <div className="group relative transition-all duration-500 hover:-translate-y-1">
                    <Link
                        href={`${linkPrefix}/blog/${post.slug}`}
                        className="block"
                        aria-label={`Read more about ${post.frontmatter.title}`}
                    >
                        <div className={cn(
                            "relative w-full aspect-8/5 overflow-hidden rounded-xl mb-4 shadow-sm transition-all duration-500 border border-primary/5 ring-1 ring-transparent",
                            multicolor.hoverRing,
                            multicolor.hoverShadow,
                        )}>
                            {heroImageSrc && (
                                <RevealImage
                                    src={heroImageSrc}
                                    alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                    fill
                                    className="transition-transform duration-700 group-hover:scale-110"
                                    wrapperClassName="absolute inset-0"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                                    holdUntilLoaded={index < 3}
                                    initialVisitOnly={index < 3}
                                    showSkeleton
                                    data-ai-hint={heroImageHint}
                                />
                            )}
                            <div className={cn("absolute inset-0 bg-linear-to-t opacity-0 transition-opacity duration-500 group-hover:opacity-100", multicolor.overlayGradient)} />
                            <div className={cn("absolute bottom-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover:opacity-100", multicolor.accentBar)} />
                            <AddToReadingListButton
                                item={item}
                                dictionary={dictionary}
                                showText={false}
                                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                            />
                        </div>

                        <div className="mb-2">
                            <CategoryBadge category={post.frontmatter.category} />
                        </div>
                        <h3 className={cn("font-display text-lg sm:text-base font-semibold tracking-tight text-primary transition-colors leading-tight mb-2", multicolor.hoverTitle)}>
                            {post.frontmatter.title}
                        </h3>
                        <time className="text-[10px] font-medium text-muted-foreground block opacity-60">
                            {formatRelativeTime(new Date(post.frontmatter.date), locale)}
                        </time>
                    </Link>
                </div>
            </ScrollReveal>
        );
    };

    if (posts.length === 0) return null;

    return (
        <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 overflow-hidden">
            <ScrollReveal direction="up">
                <h2 className="text-3xl font-bold font-display tracking-tighter text-primary mb-10 text-center">
                    {dictionary.home.latestPosts}
                </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 mb-12">
                {posts.map((post, index) => renderLatestCard(post, index))}
            </div>
            <ScrollReveal
                delay={0.3}
                direction="up"
                className="flex justify-center"
            >
                <Link
                    href={`${linkPrefix}/blog`}
                    className="flex items-center gap-2 bg-accent/5 px-3 py-1.5 rounded-full border border-accent/30 hover:bg-accent/10 transition-all group"
                >
                    <div className="flex items-center gap-1 pr-2.5 border-r border-accent/20">
                        <div className="h-1 w-5 bg-accent rounded-full" />
                        <div className="h-0.75 w-0.75 bg-accent rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent/90 group-hover:text-accent transition-all flex items-center gap-1">
                        {dictionary.home.viewAllPosts}
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </Link>
            </ScrollReveal>
        </section>
    );
};
