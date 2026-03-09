"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatRelativeTime } from "@/lib/utils";
import { AddToReadingListButton } from "@/components/layout/add-to-reading-list-button";
import { ChevronRight } from "lucide-react";
import { HomeTutorials } from "@/components/home/home-tutorials";
import { HomeTopics } from "@/components/home/home-topics";
import { HomeUpdates } from "@/components/home/home-updates";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLatest } from "@/components/home/home-latest";
import { CategoryBadge } from "@/components/layout/category-badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function HomeClient({
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

  const featuredPosts = allPosts
    .filter((post) => post.frontmatter.published && post.frontmatter.featured)
    .slice(0, 4);
  const featuredSlugs = new Set(featuredPosts.map((p) => p.slug));

  const latestPosts = allPosts
    .filter(
      (post) => post.frontmatter.published && !featuredSlugs.has(post.slug),
    )
    .slice(0, 6);

  const sliderCategory = "Tutorial";
  const sliderPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.category?.toLowerCase() ===
        sliderCategory.toLowerCase(),
    )
    .slice(0, 6);

  const topicTag = "Windows";
  const topicPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.tags?.some(
          (tag: string) => tag.toLowerCase() === "windows",
        ),
    )
    .slice(0, 8);

  const updateTag = "Android";
  const updatePosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.tags?.some(
          (tag: string) => tag.toLowerCase() === updateTag.toLowerCase(),
        ),
    )
    .slice(0, 6);

  return (
    <div className="w-full">
      <HomeHero
        posts={featuredPosts as any}
        dictionary={dictionary}
        locale={locale}
        linkPrefix={linkPrefix}
      />

      <HomeLatest
        posts={latestPosts as any}
        dictionary={dictionary}
        locale={locale}
        linkPrefix={linkPrefix}
      />

      {sliderPosts.length > 0 && (
        <HomeTutorials
          posts={sliderPosts as any}
          title={dictionary.home.sliderAndShadow.title}
          viewMoreText={dictionary.home.sliderAndShadow.viewMore}
          dictionary={dictionary}
          locale={locale}
          tag={sliderCategory}
        />
      )}

      {topicPosts.length > 0 && (
        <HomeTopics
          posts={topicPosts as any}
          title={dictionary.home.specialTagSectionTitle}
          breadcrumbHome={dictionary.home.breadcrumbHome}
          viewAllText={dictionary.home.viewAllPosts}
          dictionary={dictionary}
          locale={locale}
          linkPrefix={linkPrefix}
          tag={topicTag}
        />
      )}

      {updatePosts.length > 0 && (
        <HomeUpdates
          posts={updatePosts as any}
          title={dictionary.home.softwareUpdateSlider.title}
          viewMoreText={dictionary.home.softwareUpdateSlider.viewMore}
          dictionary={dictionary}
          locale={locale}
          tag={updateTag}
        />
      )}
    </div>
  );
}
