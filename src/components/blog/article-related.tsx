"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { StickyNote } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { RevealImage } from "@/components/ui/reveal-image";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/get-dictionary";

type RelatedContentItem = {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    tags?: string[];
    category?: string;
    heroImage?: string;
    imageAlt?: string;
  };
};

type ArticleRelatedProps = {
  type: "blog" | "note";
  locale: string;
  currentSlug: string;
  currentTags?: string[];
  currentCategory?: string;
  initialRelatedContent: RelatedContentItem[];
  dictionary: Dictionary;
};

/**
 * RelatedPosts - Shows suggested content at the bottom of post pages.
 * Handles both Blog and Note styles to match their respective listing pages.
 */
export function ArticleRelated({
  type,
  locale,
  currentSlug,
  currentTags = [],
  currentCategory,
  initialRelatedContent,
  dictionary,
}: ArticleRelatedProps) {
  const linkPrefix = locale === "en" ? "" : `/${locale}`;
  const normalizedCurrentTags = useMemo(
    () => Array.from(new Set(currentTags.map((tag) => tag.toLowerCase().trim()).filter(Boolean))),
    [currentTags],
  );
  const normalizedCurrentCategory = currentCategory?.toLowerCase().trim();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Related content is now strictly from local MDX files
  const allRelated = useMemo(() => {
    const scored = initialRelatedContent
      .filter((item) => item.slug !== currentSlug)
      .map((item) => {
        let score = 0;
        const normalizedItemTags = (item.frontmatter.tags || [])
          .map((tag) => tag.toLowerCase().trim())
          .filter(Boolean);
        const normalizedItemCategory = item.frontmatter.category
          ?.toLowerCase()
          .trim();
        const sharedTags = normalizedItemTags.filter((tag) =>
          normalizedCurrentTags.includes(tag),
        );
        const sameCategory = Boolean(
          normalizedCurrentCategory &&
            normalizedItemCategory &&
            normalizedCurrentCategory === normalizedItemCategory,
        );

        if (sameCategory) {
          score += type === "blog" ? 4 : 2;
        }

        score += sharedTags.length * 3;

        if (sameCategory && sharedTags.length > 0) {
          score += 2;
        }

        const isStrongMatch =
          sharedTags.length >= 2 ||
          (sameCategory && sharedTags.length >= 1) ||
          (type === "blog" && sameCategory && normalizedCurrentTags.length === 0);

        return {
          ...item,
          score,
          sharedTagsCount: sharedTags.length,
          isStrongMatch,
        };
      })
      .filter((item) => item.isStrongMatch)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3);
  }, [currentSlug, initialRelatedContent, normalizedCurrentCategory, normalizedCurrentTags, type]);

  if (allRelated.length === 0) return null;

  const renderCard = (item: RelatedContentItem) => {
    const isBlog = type === "blog";
    const heroImageValue = item.frontmatter.heroImage;
    let heroImageSrc: string | undefined;
    let heroImageHint: string | undefined;

    if (isBlog && heroImageValue) {
      if (heroImageValue.startsWith("http") || heroImageValue.startsWith("/")) {
        heroImageSrc = heroImageValue;
        heroImageHint = item.frontmatter.imageAlt || item.frontmatter.title;
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

    const readingListItem = {
      slug: item.slug,
      title: item.frontmatter.title,
      description: item.frontmatter.description,
      href: `${linkPrefix}/${isBlog ? "blog" : "notes"}/${item.slug}`,
      type: type,
    };

    if (isBlog) {
      const multicolor = getMulticolorTheme(
        getMulticolorSeed(item.slug, item.frontmatter.category, item.frontmatter.title),
      );

      return (
        <div
          key={item.slug}
          className="group relative transition-all duration-500 hover:-translate-y-1"
        >
          <Link href={readingListItem.href} className="block">
            <div className={cn(
              "relative w-full aspect-8/5 overflow-hidden rounded-xl mb-4 shadow-sm transition-all duration-500 border border-primary/5 ring-1 ring-transparent",
              multicolor.hoverRing,
              multicolor.hoverShadow,
            )}>
              {heroImageSrc ? (
                <RevealImage
                  src={heroImageSrc}
                  alt={item.frontmatter.imageAlt || item.frontmatter.title}
                  fill
                  className="transition-transform duration-700 group-hover:scale-110"
                  wrapperClassName="absolute inset-0"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                  holdUntilLoaded
                  showSkeleton
                  data-ai-hint={heroImageHint}
                />
              ) : (
                <StickyNote className="h-12 w-12 text-primary/20 transition-transform duration-700 group-hover:scale-110" />
              )}
              <div className={cn("absolute inset-0 bg-linear-to-t opacity-0 transition-opacity duration-500 group-hover:opacity-100", multicolor.overlayGradient)} />
              <div className={cn("absolute bottom-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover:opacity-100", multicolor.accentBar)} />
              <AddToReadingListButton
                item={readingListItem}
                showText={false}
                dictionary={dictionary}
                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
              />
            </div>

            <div className="mb-2">
              <CategoryBadge category={item.frontmatter.category} type={type} size="xs" />
            </div>
            <h3 className={cn("font-display text-base sm:text-lg font-semibold tracking-tight text-primary transition-colors leading-tight mb-2", multicolor.hoverTitle)}>
              {item.frontmatter.title}
            </h3>
            <time className="text-[10px] font-medium text-muted-foreground block opacity-60">
              {formatRelativeTime(new Date(item.frontmatter.date), locale)}
            </time>
          </Link>
        </div>
      );
    }

    // Note Style Card — matching notes-list-client.tsx (with multicolor system)
    const noteMulticolor = getMulticolorTheme(
      getMulticolorSeed(item.slug, item.frontmatter.title),
    );

    return (
      <div
        key={item.slug}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 h-full ring-1 ring-transparent",
          noteMulticolor.hoverRing,
          noteMulticolor.hoverShadow,
        )}
      >
        {/* Top accent bar — opsi 1, same as notes-list-client */}
        <div className={cn("absolute top-0 left-0 right-0 h-0.75 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10", noteMulticolor.accentBar)} />

        <div className="p-6 pb-0 flex flex-row justify-between items-start space-y-0">
          <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
            <StickyNote className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <AddToReadingListButton
            item={readingListItem}
            showText={false}
            dictionary={dictionary}
            className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shrink-0"
          />
        </div>

        <div className="p-6 pt-4 flex-1">
          <Link href={readingListItem.href} className="block group/link">
            <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
              {formatDate(new Date(item.frontmatter.date))}
            </time>
            <h3
              className={cn(
                "font-display font-bold tracking-tight text-primary transition-colors mb-2 leading-tight",
                noteMulticolor.hoverTitle,
              )}
              style={{ fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)" }}
            >
              {item.frontmatter.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.frontmatter.description}
            </p>
          </Link>
        </div>

        <div className="px-6 py-4 border-t bg-muted/5">
          <div className="flex flex-wrap gap-2">
            {item.frontmatter.tags &&
              item.frontmatter.tags
                .slice(0, 2)
                .map((tag: string) => (
                  <CategoryBadge key={tag} category={tag} size="xs" />
                ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t mt-16">
      <ScrollReveal direction="up">
        <h2
          className="text-3xl font-black font-display tracking-tighter leading-tight text-primary mb-12 text-center"
        >
          {dictionary.post.relatedContent}
        </h2>
      </ScrollReveal>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
        {allRelated.map((item, index) => (
          <ScrollReveal key={item.slug} delay={index * 0.1} direction="up">
            {renderCard(item)}
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
