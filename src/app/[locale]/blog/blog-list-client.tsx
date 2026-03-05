"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatRelativeTime } from "@/lib/utils";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function BlogListClient({
  initialPosts,
  dictionary,
  locale,
}: {
  initialPosts: any[];
  dictionary: any;
  locale: string;
}) {
  const linkPrefix = locale === "en" ? "" : `/${locale}`;

  const allPosts = useMemo(() => {
    return [...initialPosts].sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );
  }, [initialPosts]);

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16">
        <header className="mb-12 text-center">
          <h1 className="font-headline text-display-sm font-extrabold tracking-tighter text-primary mb-3">
            {dictionary.navigation.blog}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
            {dictionary.blog.description}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {allPosts.map((post, index) => {
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

            const item = {
              slug: post.slug,
              title: post.frontmatter.title,
              description: post.frontmatter.description,
              href: `${linkPrefix}/blog/${post.slug}`,
              type: "blog" as const,
            };

            return (
              <ScrollReveal key={post.slug} delay={index * 0.05} direction="up">
                <div className="group relative transition-all duration-500 hover:-translate-y-1">
                  <Link
                    href={`${linkPrefix}/blog/${post.slug}`}
                    className="block"
                    aria-label={`Read more about ${post.frontmatter.title}`}
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl mb-4 shadow-sm transition-all duration-500 border border-primary/5">
                      {heroImageSrc && (
                        <Image
                          src={heroImageSrc}
                          alt={
                            post.frontmatter.imageAlt || post.frontmatter.title
                          }
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
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
                    <h3 className="font-headline text-base font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight">
                      {post.frontmatter.title}
                    </h3>
                    <time className="text-[10px] font-medium text-muted-foreground mt-2 block opacity-60">
                      {formatRelativeTime(
                        new Date(post.frontmatter.date),
                        locale,
                      )}
                    </time>
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </section>
      </main>
    </div>
  );
}
