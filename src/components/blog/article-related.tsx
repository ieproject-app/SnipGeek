"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { StickyNote } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
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
        const itemTags = item.frontmatter.tags || [];
        const itemCategory = item.frontmatter.category;

        if (
          type === "blog" &&
          currentCategory &&
          itemCategory &&
          currentCategory === itemCategory
        ) {
          score += 5;
        }

        currentTags.forEach((tag) => {
          if (itemTags.includes(tag)) {
            score += 1;
          }
        });

        return { ...item, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3);
  }, [currentCategory, currentSlug, currentTags, initialRelatedContent, type]);

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
      return (
        <div
          key={item.slug}
          className="group relative transition-all duration-500 hover:-translate-y-1"
        >
          <Link href={readingListItem.href} className="block">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl mb-4 shadow-sm border border-primary/5 bg-primary/5 flex items-center justify-center">
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
            <h3
              className="font-display font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight"
              style={{ fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)" }}
            >
              {item.frontmatter.title}
            </h3>
            <time className="text-[10px] font-medium text-muted-foreground mt-2 block opacity-60">
              {formatRelativeTime(new Date(item.frontmatter.date), locale)}
            </time>
          </Link>
        </div>
      );
    }

    // Note Style Card matching notes-list-client.tsx
    return (
      <div
        key={item.slug}
        className="group relative flex flex-col overflow-hidden rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 h-full"
      >
        <div className="p-6 pb-0 flex flex-row justify-between items-start space-y-0">
          <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
            <StickyNote className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <AddToReadingListButton
            item={readingListItem}
            showText={false}
            dictionary={dictionary}
            className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          />
        </div>

        <div className="p-6 pt-4 flex-1">
          <Link href={readingListItem.href} className="block group/link">
            <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
              {formatDate(new Date(item.frontmatter.date))}
            </time>
            <h3
              className="font-display font-bold tracking-tight text-primary transition-colors group-hover/link:text-accent mb-2 leading-tight"
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
                  <CategoryBadge key={tag} category={tag} />
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
