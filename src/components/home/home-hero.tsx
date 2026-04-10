"use client";

import Link from "next/link";
import { Post, PostFrontmatter } from "@/lib/posts";
import { Dictionary } from "@/lib/get-dictionary";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { RelativeTime } from "@/components/ui/relative-time";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { ArrowRight } from "lucide-react";
import {
    CategoryBadge,
    simplifyCategoryLabel,
} from "@/components/layout/category-badge";
import { RevealImage } from "@/components/ui/reveal-image";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";

interface HomeHeroProps {
    posts: Post<PostFrontmatter>[];
    dictionary: Dictionary;
    locale: string;
    linkPrefix: string;
}

/**
 * HomeHero - A sophisticated 4-column staggered gallery grid using the colorful badge system.
 * Mobile: Embla carousel (1 card per slide) matching HomeTutorials design.
 * Desktop (sm+): Original 4-column staggered grid.
 */
export function HomeHero({ posts, dictionary, locale, linkPrefix }: HomeHeroProps) {
    // Build per-post data once, reused by both mobile carousel and desktop grid
    const postData = posts.map((post, index) => {
        const heroImageValue = post.frontmatter.heroImage;
        let heroImageSrc: string | undefined;
        let heroImageHint: string | undefined;

        if (heroImageValue) {
            if (heroImageValue.startsWith("http") || heroImageValue.startsWith("/")) {
                heroImageSrc = heroImageValue;
                heroImageHint = post.frontmatter.imageAlt || post.frontmatter.title;
            } else {
                const placeholder = PlaceHolderImages.find((p) => p.id === heroImageValue);
                if (placeholder) {
                    heroImageSrc = placeholder.imageUrl;
                    heroImageHint = placeholder.imageHint;
                }
            }
        }

        const rawCategory = post.frontmatter.category || "Tutorial";
        const simplifiedCategory = simplifyCategoryLabel(rawCategory);
        const multicolor = getMulticolorTheme(
            getMulticolorSeed(post.slug, simplifiedCategory, post.frontmatter.title),
        );

        const item = {
            slug: post.slug,
            title: post.frontmatter.title,
            description: post.frontmatter.description,
            href: `${linkPrefix}/blog/${post.slug}`,
            type: "blog" as const,
        };

        return { post, index, heroImageSrc, heroImageHint, rawCategory, multicolor, item };
    });

    if (posts.length === 0) return null;

    return (
        <section className="py-12 sm:py-16 bg-card border-b border-primary/5">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── MOBILE: Simple stacked cards (hidden on sm+) ── */}
                <div className="sm:hidden grid grid-cols-1 gap-4">
                    {postData.map(({ post, index, heroImageSrc, heroImageHint, rawCategory, multicolor, item }) => (
                        <article
                            key={post.slug}
                            className={cn(
                                "relative bg-card rounded-xl border border-primary/5 transition-all duration-500 flex flex-col group/card overflow-hidden shadow-md ring-1 ring-transparent",
                                multicolor.hoverRing,
                                multicolor.hoverShadow,
                            )}
                        >
                            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group">
                                <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl">
                                    {heroImageSrc ? (
                                        <RevealImage
                                            src={heroImageSrc}
                                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                            fill
                                            className="transition-transform duration-700 group-hover:scale-[1.04]"
                                            wrapperClassName="absolute inset-0"
                                            sizes="(max-width: 640px) 100vw, 100vw"
                                            priority={index === 0}
                                            loading={index === 0 ? "eager" : "lazy"}
                                            quality={68}
                                            holdUntilLoaded={index === 0}
                                            initialVisitOnly={index === 0}
                                            showSkeleton
                                            data-ai-hint={heroImageHint}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-muted" aria-hidden="true" />
                                    )}
                                    <div className={cn("absolute inset-0 bg-linear-to-t opacity-0 transition-opacity duration-500 group-hover/card:opacity-100", multicolor.overlayGradient)} />
                                    <div className={cn("absolute bottom-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100", multicolor.accentBar)} />
                                    <AddToReadingListButton
                                        item={item}
                                        dictionary={dictionary}
                                        showText={false}
                                        className="absolute top-2 right-2 z-20 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-100 transition-opacity"
                                    />
                                </div>

                                <div className="p-4 flex flex-col gap-2">
                                    <div>
                                        <CategoryBadge
                                            category={rawCategory}
                                            size="xs"
                                            className="shadow-sm"
                                        />
                                    </div>
                                    <h3 className={cn("font-display text-lg font-bold leading-snug text-primary transition-colors duration-300", multicolor.hoverTitle)}>
                                        {post.frontmatter.title}
                                    </h3>
                                    <div className="flex items-center justify-between gap-3 mt-1">
                                        <RelativeTime
                                            date={post.frontmatter.date}
                                            locale={locale}
                                            className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/80"
                                        />
                                        <div
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                multicolor.readingButtonTone,
                                            )}
                                        >
                                            READ <ArrowRight className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>

                {/* ── DESKTOP: Original 4-column staggered grid (hidden on mobile) ── */}
                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                    {postData.map(({ post, index, heroImageSrc, heroImageHint, rawCategory, multicolor, item }) => {
                        const isStaggered = index % 2 !== 0;
                        return (
                            <div
                                key={post.slug}
                                className={cn(
                                    "group relative transition-all duration-500 ease-out",
                                    isStaggered && "lg:mt-10",
                                )}
                            >
                                <Link href={`${linkPrefix}/blog/${post.slug}`} className="block">
                                    <article className="space-y-5">
                                        {/* Image Block */}
                                        <div
                                            className={cn(
                                                "relative aspect-[3/2] rounded-xl overflow-hidden bg-muted shadow-md group-hover:-translate-y-2 transition-all duration-500 ring-1 ring-transparent",
                                                multicolor.hoverRing,
                                                multicolor.hoverShadow,
                                            )}
                                        >
                                            <div
                                                className={cn("absolute bottom-0 left-0 right-0 h-0.75 z-30 transition-opacity duration-500 opacity-0 group-hover:opacity-100", multicolor.accentBar)}
                                            />
                                            <div
                                                className={cn(
                                                    "absolute inset-0 bg-linear-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10",
                                                    multicolor.overlayGradient,
                                                )}
                                            />
                                            {heroImageSrc && (
                                                <RevealImage
                                                    src={heroImageSrc}
                                                    alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                                    fill
                                                    className="transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
                                                    wrapperClassName="absolute inset-0"
                                                    sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 25vw"
                                                    priority={index === 0}
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                    quality={68}
                                                    holdUntilLoaded={index === 0}
                                                    initialVisitOnly={index === 0}
                                                    showSkeleton
                                                    data-ai-hint={heroImageHint}
                                                />
                                            )}
                                        </div>

                                        {/* Caption Block */}
                                        <div className="px-1 space-y-3">
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
                                                <RelativeTime
                                                    date={post.frontmatter.date}
                                                    locale={locale}
                                                    className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/80"
                                                />

                                                <div className="flex items-center gap-2">
                                                    <AddToReadingListButton
                                                        item={item}
                                                        dictionary={dictionary}
                                                        showText={false}
                                                        className="h-8 w-8 rounded-full border-none bg-primary/[0.03] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-x-0 -translate-x-2 group-hover:translate-x-0"
                                                    />
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                            multicolor.readingButtonTone,
                                                            "group-hover:bg-primary/5",
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