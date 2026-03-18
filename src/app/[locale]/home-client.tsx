"use client";

import React, { useMemo } from "react";
import { HomeTutorials } from "@/components/home/home-tutorials";
import { HomeTopics } from "@/components/home/home-topics";
import { HomeUpdates } from "@/components/home/home-updates";
import { HomeNotes } from "@/components/home/home-notes";
import { HomeTransitionNote } from "@/components/home/home-transition-note";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLatest } from "@/components/home/home-latest";
import type { Post, PostFrontmatter } from "@/lib/posts";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";

export function HomeClient({
  initialPosts,
  initialNotes,
  dictionary,
  locale,
}: {
  initialPosts: Post<PostFrontmatter>[];
  initialNotes: Note<NoteFrontmatter>[];
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

  const latestNotes = useMemo(() => {
    return [...initialNotes]
      .sort(
        (a, b) =>
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime(),
      )
      .slice(0, 6);
  }, [initialNotes]);

  // --- Deduplication: each section only shows articles not yet shown above ---
  const seenSlugs = new Set<string>();

  const featuredPosts = allPosts
    .filter((post) => post.frontmatter.published && post.frontmatter.featured)
    .slice(0, 4);
  featuredPosts.forEach((p) => seenSlugs.add(p.slug));

  const latestPosts = allPosts
    .filter(
      (post) => post.frontmatter.published && !seenSlugs.has(post.slug),
    )
    .slice(0, 6);
  latestPosts.forEach((p) => seenSlugs.add(p.slug));

  const sliderCategory = "Tutorial";
  const sliderPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        !seenSlugs.has(post.slug) &&
        post.frontmatter.category?.toLowerCase() === sliderCategory.toLowerCase(),
    )
    .slice(0, 6);
  sliderPosts.forEach((p) => seenSlugs.add(p.slug));

  const topicTag = "Windows";
  const topicPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        !seenSlugs.has(post.slug) &&
        post.frontmatter.tags?.some(
          (tag: string) => windowsUbuntuTags.has(tag.toLowerCase()),
        ),
    )
    .slice(0, 8);
  topicPosts.forEach((p) => seenSlugs.add(p.slug));

  const updateTag = "Ubuntu";
  const primaryUpdatePosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        !seenSlugs.has(post.slug) &&
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
      !seenSlugs.has(post.slug) &&
      post.frontmatter.tags?.some((tag: string) => windowsUbuntuTags.has(tag.toLowerCase())),
  );

  const updatePosts = [
    ...primaryUpdatePosts,
    ...updateFallback.filter(
      (post) => !primaryUpdatePosts.some((picked) => picked.slug === post.slug),
    ),
  ].slice(0, 6);

  const focusTopicsTitle = locale === "id" ? "Sorotan Windows & Ubuntu" : "Windows & Ubuntu Highlights";
  const updatesTitle = locale === "id" ? "Update Penting Sistem" : "Important System Updates";
  const updatesViewMore = locale === "id" ? "lihat update" : "view updates";
  const notesTitle = locale === "id" ? "Catatan Teknis Terbaru" : "Latest Technical Notes";
  const notesViewMore = locale === "id" ? "Selengkapnya" : "View Notes";
  const transitionEyebrow = locale === "id" ? "Catatan Redaksi" : "Editorial Note";
  const transitionTitle = locale === "id" ? "Masuk Ke Alur Yang Lebih Fokus" : "Entering A More Focused Flow";
  const transitionSubtitle = locale === "id"
    ? "Ringkasan singkat sebelum berlanjut ke section berikutnya"
    : "A short context before continuing to the next sections";
  const transitionDescription = locale === "id"
    ? "Bagian selanjutnya disusun dari praktik ke konteks: tutorial, sorotan topik, update penting, lalu catatan teknis ringkas. Tujuannya agar urutan baca lebih natural, bukan sekadar feed acak."
    : "The next sections are arranged from practice to context: tutorials, topic highlights, key updates, and concise technical notes. This keeps the reading order intentional instead of feeling like a random feed.";
  const transitionCta = locale === "id" ? "Lanjut ke Tutorial" : "Continue to Tutorials";

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

      <HomeTransitionNote
        eyebrow={transitionEyebrow}
        title={transitionTitle}
        subtitle={transitionSubtitle}
        description={transitionDescription}
        ctaText={transitionCta}
        ctaHref={`${linkPrefix}/tags/tutorial`}
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
          viewAllText={dictionary.home.viewAllPosts}
          dictionary={dictionary}
          locale={locale}
          linkPrefix={linkPrefix}
          tag={topicTag}
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

      {latestNotes.length > 0 && (
        <HomeNotes
          notes={latestNotes}
          title={notesTitle}
          viewMoreText={notesViewMore}
          dictionary={dictionary}
          locale={locale}
          linkPrefix={linkPrefix}
          viewMoreHref={`${linkPrefix}/notes`}
        />
      )}
    </div>
  );
}
