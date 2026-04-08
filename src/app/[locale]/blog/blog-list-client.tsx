"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { CategoryBadge } from "@/components/layout/category-badge";
import { RevealImage } from "@/components/ui/reveal-image";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import type { Post, PostFrontmatter } from "@/lib/posts";
import type { Dictionary } from "@/lib/get-dictionary";

const POSTS_PER_PAGE = 9;

export function BlogListClient({
  initialPosts,
  dictionary,
  locale,
}: {
  initialPosts: Post<PostFrontmatter>[];
  dictionary: Dictionary;
  locale: string;
}) {
  const linkPrefix = locale === "en" ? "" : `/${locale}`;
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const allPosts = useMemo(() => {
    return [...initialPosts].sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );
  }, [initialPosts]);

  const displayedPosts = allPosts.slice(0, visibleCount);
  const hasMore = visibleCount < allPosts.length;
  const remainingCount = Math.min(POSTS_PER_PAGE, allPosts.length - visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + POSTS_PER_PAGE);
  };

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16">
        <header className="mb-12 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary mb-3">
            {dictionary.navigation.blog}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <div className="h-px w-10 bg-accent/40 rounded-full" />
            <div className="h-1 w-1 bg-accent rounded-full" />
            <div className="h-px w-10 bg-accent/40 rounded-full" />
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
            {dictionary.blog.description}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {displayedPosts.map((post, index) => {
            const heroImageValue = post.frontmatter.heroImage;
            let heroImageSrc: string | undefined;
            let heroImageHint: string | undefined;

            if (heroImageValue) {
              if (
                heroImageValue.startsWith("http") ||
                heroImageValue.startsWith("/")
              ) {
                heroImageSrc = heroImageValue;
                heroImageHint =
                  post.frontmatter.imageAlt || post.frontmatter.title;
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

            const multicolor = getMulticolorTheme(
              getMulticolorSeed(post.slug, post.frontmatter.category, post.frontmatter.title),
            );

            const item = {
              slug: post.slug,
              title: post.frontmatter.title,
              description: post.frontmatter.description,
              href: `${linkPrefix}/blog/${post.slug}`,
              type: "blog" as const,
            };

            return (
              <div key={post.slug} className="group relative transition-all duration-500 hover:-translate-y-1">
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
                        alt={
                          post.frontmatter.imageAlt || post.frontmatter.title
                        }
                        fill
                        className="transition-transform duration-700 group-hover:scale-110"
                        wrapperClassName="absolute inset-0"
                        sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1200px) 33vw, 300px"
                        loading={index === 0 ? "eager" : "lazy"}
                        priority={index === 0}
                        quality={68}
                        holdUntilLoaded={index === 0}
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
                    <CategoryBadge category={post.frontmatter.category} size="xs" />
                  </div>
                  <h3 className={cn("font-display text-lg sm:text-base font-semibold tracking-tight text-primary transition-colors leading-tight mb-2", multicolor.hoverTitle)}>
                    {post.frontmatter.title}
                  </h3>
                  <time className="text-[10px] font-medium text-muted-foreground block opacity-60">
                    {formatRelativeTime(
                      new Date(post.frontmatter.date),
                      locale,
                    )}
                  </time>
                </Link>
              </div>
            );
          })}
        </section>

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              size="lg"
              className="group gap-2 border-primary/20 bg-background/50 px-8 py-6 text-base font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
            >
              <span>
                {locale === "id"
                  ? `Muat ${remainingCount} Artikel Lagi`
                  : `Load ${remainingCount} More Article${remainingCount > 1 ? "s" : ""}`}
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
