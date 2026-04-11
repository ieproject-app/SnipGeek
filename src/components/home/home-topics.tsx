"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { RevealImage } from "@/components/ui/reveal-image";
import type { Dictionary } from "@/lib/get-dictionary";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

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

interface HomeTopicsProps {
  posts: TopicPost[];
  title: string;
  viewAllText: string;
  dictionary: Dictionary;
  locale: string;
  linkPrefix: string;
  tag: string;
  viewAllHref?: string;
}

/**
 * HomeTopics - Standardized with pb-12 sm:pb-16 to prevent padding stacking.
 */
export function HomeTopics({
  posts,
  title,
  viewAllText,
  dictionary,
  locale,
  linkPrefix,
  tag,
  viewAllHref,
}: HomeTopicsProps) {
  const renderHorizontalCard = (post: TopicPost, index: number) => {
    const heroImageValue = post.frontmatter.heroImage;
    let heroImageSrc = "/images/blank/blank.webp";
    if (heroImageValue) {
      if (heroImageValue.startsWith("http") || heroImageValue.startsWith("/")) {
        heroImageSrc = heroImageValue;
      } else {
        const placeholder = PlaceHolderImages.find(
          (p) => p.id === heroImageValue,
        );
        if (placeholder) heroImageSrc = placeholder.imageUrl;
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
        <div className="group relative flex items-center gap-4 py-3 border-b border-primary/5 transition-all duration-300 hover:bg-primary/[0.02]">
          <Link
            href={`${linkPrefix}/blog/${post.slug}`}
            className="flex items-center gap-4 flex-1 min-w-0"
          >
            <div className="relative w-30 h-20 sm:w-36 sm:h-24 shrink-0 overflow-hidden rounded-lg shadow-sm border border-primary/5">
              <RevealImage
                src={heroImageSrc}
                alt={post.frontmatter.imageAlt || post.frontmatter.title}
                fill
                className="object-cover transition-transform duration-500"
                sizes="(max-width: 640px) 120px, 144px"
                quality={64}
              />
              <AddToReadingListButton
                item={item}
                dictionary={dictionary}
                showText={false}
                className="absolute top-1 right-1 z-20 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity h-6 w-6"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-display text-[15px] sm:text-base font-medium text-primary leading-snug transition-colors group-hover:text-accent">
                {post.frontmatter.title}
              </h3>
            </div>
          </Link>
        </div>
      </ScrollReveal>
    );
  };

  const breadcrumbSegments = [
    { label: linkPrefix || "/" },
    { label: tag },
  ];

  return (
    <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 overflow-hidden">
      <ScrollReveal direction="left">
        <div className="mb-8 text-left">
          <h2 className="text-sm font-medium font-display text-primary mb-2 italic">
            {title}
          </h2>
          <div className="w-full h-0.5 bg-[linear-gradient(to_right,#0078D4,#E95420,transparent)]" />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
        {posts.map((post, index) => renderHorizontalCard(post, index))}
      </div>

      <ScrollReveal direction="up" delay={0.3}>
        <footer className="mt-10 flex justify-center">
          <Link
            href={viewAllHref || `${linkPrefix}/tags/${tag.toLowerCase()}`}
            className="flex items-center gap-2 bg-accent/5 px-3 py-1.5 rounded-full border border-accent/30 hover:bg-accent/10 transition-all group"
          >
            <div className="flex items-center gap-1 pr-2.5 border-r border-accent/20">
              <div className="h-1 w-5 bg-accent rounded-full" />
              <div className="h-0.75 w-0.75 bg-accent rounded-full" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-accent/90 group-hover:text-accent transition-all flex items-center gap-1">
              {viewAllText}
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </footer>
      </ScrollReveal>
    </section>
  );
}
