"use client";

import React, { useMemo } from "react";
import { HomeTutorials } from "@/components/home/home-tutorials";
import { HomeTopics } from "@/components/home/home-topics";
import { HomeUpdates } from "@/components/home/home-updates";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLatest } from "@/components/home/home-latest";
import type { Post, PostFrontmatter } from "@/lib/posts";
import type { Dictionary } from "@/lib/get-dictionary";

export function HomeClient({
  initialPosts,
  dictionary,
  locale,
}: {
  initialPosts: Post<PostFrontmatter>[];
  dictionary: Dictionary;
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
        posts={featuredPosts}
        dictionary={dictionary}
        locale={locale}
        linkPrefix={linkPrefix}
      />

      <HomeLatest
        posts={latestPosts}
        dictionary={dictionary}
        locale={locale}
        linkPrefix={linkPrefix}
      />

      {sliderPosts.length > 0 && (
        <HomeTutorials
          posts={sliderPosts}
          title={dictionary.home.sliderAndShadow.title}
          viewMoreText={dictionary.home.sliderAndShadow.viewMore}
          dictionary={dictionary}
          locale={locale}
          tag={sliderCategory}
        />
      )}

      {topicPosts.length > 0 && (
        <HomeTopics
          posts={topicPosts}
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
          posts={updatePosts}
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
