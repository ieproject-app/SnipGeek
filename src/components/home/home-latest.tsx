"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatRelativeTime } from "@/lib/utils";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { RevealImage } from "@/components/ui/reveal-image";
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

        return (
            <ScrollReveal key={post.slug} direction="up" delay={index * 0.1}>
                <div className="group relative transition-all duration-500 hover:-translate-y-1">
                    <Link
                        href={`${linkPrefix}/blog/${post.slug}`}
                        className="block"
                        aria-label={`Read more about ${post.frontmatter.title}`}
                    >
                        <div className="relative w-full aspect-8/5 overflow-hidden rounded-xl mb-4 shadow-sm transition-all duration-500 border border-primary/5">
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
                            <AddToReadingListButton
                                item={item}
                                dictionary={dictionary}
                                showText={false}
                                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        <div className="mb-2">
                            <CategoryBadge category={post.frontmatter.category} />
                        </div>
                        <h3 className="font-display text-lg font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight">
                            {post.frontmatter.title}
                        </h3>
                        <time className="text-[10px] font-medium text-muted-foreground mt-2 block opacity-60">
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
                    className="flex items-center gap-6 bg-muted/30 px-5 py-2.5 rounded-full border border-primary/5 hover:bg-muted/50 transition-all group"
                >
                    <div className="flex items-center gap-2 pr-4 border-r border-primary/10">
                        <div className="h-1.5 w-8 bg-accent rounded-full" />
                        <div className="h-1.5 w-1.5 bg-primary/20 rounded-full" />
                        <div className="h-1.5 w-1.5 bg-primary/20 rounded-full" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary/80 group-hover:text-primary transition-all flex items-center gap-2">
                        {dictionary.home.viewAllPosts}
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                </Link>
            </ScrollReveal>
        </section>
    );
};
