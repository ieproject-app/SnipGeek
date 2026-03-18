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
  const windowsUbuntuTags = new Set(["windows", "ubuntu", "linux", "dual-boot"]);

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
          (tag: string) => windowsUbuntuTags.has(tag.toLowerCase()),
        ),
    )
    .slice(0, 8);

  const updateTag = "Ubuntu";
  const primaryUpdatePosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.tags?.some((tag: string) => windowsUbuntuTags.has(tag.toLowerCase())) &&
        ((post.frontmatter.category || "").toLowerCase().includes("update") ||
          post.frontmatter.tags?.some((tag: string) => {
            const normalized = tag.toLowerCase();
            return normalized === "update" || normalized === "news";
          })),
    )
    .slice(0, 6);

  const updateFallback = allPosts.filter(
    (post) =>
      post.frontmatter.published &&
      post.frontmatter.tags?.some((tag: string) => windowsUbuntuTags.has(tag.toLowerCase())),
  );

  const updatePosts = [
    ...primaryUpdatePosts,
    ...updateFallback.filter(
      (post) => !primaryUpdatePosts.some((picked) => picked.slug === post.slug),
    ),
  ].slice(0, 6);

  const focusTopicsTitle = locale === "id" ? "Fokus Windows + Ubuntu" : "Windows + Ubuntu Focus";
  const updatesTitle = locale === "id" ? "Update Penting Sistem" : "Important System Updates";
  const updatesViewMore = locale === "id" ? "lihat update" : "view updates";

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
          title={focusTopicsTitle}
          breadcrumbHome={dictionary.home.breadcrumbHome}
          viewAllText={dictionary.home.viewAllPosts}
          dictionary={dictionary}
          locale={locale}
          linkPrefix={linkPrefix}
          tag={topicTag}
          breadcrumbTagLabel={locale === "id" ? "Windows + Ubuntu" : "Windows + Ubuntu"}
          viewAllHref={`${linkPrefix}/blog`}
        />
      )}

      {updatePosts.length > 0 && (
        <HomeUpdates
          posts={updatePosts}
          title={updatesTitle}
          viewMoreText={updatesViewMore}
          dictionary={dictionary}
          locale={locale}
          tag={updateTag}
          viewMoreHref={`${linkPrefix}/blog`}
        />
      )}
    </div>
  );
}
