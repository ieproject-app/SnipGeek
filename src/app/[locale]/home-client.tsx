"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
// Above-fold sections: loaded immediately
import { HomeHero } from "@/components/home/home-hero";
import { HomeLatest } from "@/components/home/home-latest";
import type { Post, PostFrontmatter } from "@/lib/posts";
import type { Note, NoteFrontmatter } from "@/lib/notes";
import type { Dictionary } from "@/lib/get-dictionary";

// Below-fold sections: code-split so their JS is not in the initial bundle
function SectionPlaceholder({ minHeight, children }: { minHeight: string; children?: React.ReactNode }) {
  return (
    <div style={{ minHeight }}>
      {children}
    </div>
  );
}

const createSectionLoader = (minHeight: string) => {
  function SectionLoader() {
    return <SectionPlaceholder minHeight={minHeight} />;
  }

  return SectionLoader;
};

const HomeTransitionNote = dynamic(
  () =>
    import("@/components/home/home-transition-note").then((m) => ({
      default: m.HomeTransitionNote,
    })),
  { loading: createSectionLoader("120px") }
);
const HomeTutorials = dynamic(
  () =>
    import("@/components/home/home-tutorials").then((m) => ({
      default: m.HomeTutorials,
    })),
  { loading: createSectionLoader("400px") }
);
const HomeTopics = dynamic(
  () =>
    import("@/components/home/home-topics").then((m) => ({
      default: m.HomeTopics,
    })),
  { loading: createSectionLoader("400px") }
);
const HomeUpdates = dynamic(
  () =>
    import("@/components/home/home-updates").then((m) => ({
      default: m.HomeUpdates,
    })),
  { loading: createSectionLoader("400px") }
);
const HomeNotes = dynamic(
  () =>
    import("@/components/home/home-notes").then((m) => ({
      default: m.HomeNotes,
    })),
  { loading: createSectionLoader("400px") }
);

/**
 * Defers rendering children until the element is close to entering the
 * viewport. This prevents JavaScript for below-fold sections from being
 * evaluated during the critical loading window.
 */
function SectionPreview({
  title,
  description,
  href,
  hrefLabel,
  items,
  minHeight,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  items: Array<{ title: string; href: string; meta?: string }>;
  minHeight: string;
}) {
  return (
    <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14" style={{ minHeight }}>
      <div className="rounded-2xl border border-primary/10 bg-card/40 px-5 py-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {href && hrefLabel && (
            <Link
              href={href}
              className="text-sm font-medium text-accent transition-colors hover:text-primary"
            >
              {hrefLabel}
            </Link>
          )}
        </div>

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-primary/8 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <span className="block text-sm font-semibold text-primary">
                  {item.title}
                </span>
                {item.meta && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.meta}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TransitionPreview({
  eyebrow,
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  minHeight,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  minHeight: string;
}) {
  return (
    <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14" style={{ minHeight }}>
      <div className="rounded-2xl border border-dashed border-primary/20 bg-card/50 px-5 py-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent/85">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-primary">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/85">
          {description}
        </p>
        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-4 inline-flex text-sm font-medium text-accent transition-colors hover:text-primary"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}

function LazySection({
  children,
  minHeight,
  fallback,
}: {
  children: React.ReactNode;
  minHeight?: string;
  fallback?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? children : <SectionPlaceholder minHeight={minHeight ?? "200px"}>{fallback}</SectionPlaceholder>}
    </div>
  );
}

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
    return [...initialPosts]
      .filter((post) => !post.frontmatter.hideFromHome)
      .sort(
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

  // --- Featured Posts: 2 Linux + 2 Windows 11 ---
  const linuxTags = new Set(["linux", "ubuntu"]);
  const windowsTags = new Set(["windows", "windows-11"]);
  
  const featuredLinuxPosts = allPosts
    .filter((post) => 
      post.frontmatter.published && 
      post.frontmatter.featured &&
      post.frontmatter.tags?.some((tag: string) => linuxTags.has(tag.toLowerCase()))
    )
    .slice(0, 2);
  
  const featuredWindowsPosts = allPosts
    .filter((post) => 
      post.frontmatter.published && 
      post.frontmatter.featured &&
      post.frontmatter.tags?.some((tag: string) => windowsTags.has(tag.toLowerCase()))
    )
    .slice(0, 2);
  
  const featuredPosts = [...featuredLinuxPosts, ...featuredWindowsPosts];
  featuredPosts.forEach((p) => seenSlugs.add(p.slug));

  const latestPosts = allPosts
    .filter(
      (post) => post.frontmatter.published && !seenSlugs.has(post.slug),
    )
    .slice(0, 6);
  latestPosts.forEach((p) => seenSlugs.add(p.slug));

  // --- Manual Tutorial Posts for Modular Learning ---
  const manualTutorialSlugs = [
    "how-to-create-windows-11-bootable-usb-rufus",
    "clean-install-windows-11-step-by-step-guide", 
    "to-do-after-install-windows11"
  ];
  
  const manualTutorialPosts = allPosts.filter(
    (post) => post.frontmatter.published && manualTutorialSlugs.includes(post.slug)
  );
  manualTutorialPosts.forEach((p) => seenSlugs.add(p.slug));

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
  const tutorialTitle = locale === "id" ? "Panduan Instalasi Windows 11" : "Windows 11 Installation Guide";
  const tutorialViewMore = locale === "id" ? "lihat panduan lengkap" : "view complete guide";
  const transitionCta = locale === "id" ? "Lanjut ke Tutorial" : "Continue to Tutorials";
  const previewPosts = (posts: Post<PostFrontmatter>[], limit = 3) =>
    posts.slice(0, limit).map((post) => ({
      title: post.frontmatter.title,
      href: `${linkPrefix}/blog/${post.slug}`,
      meta: post.frontmatter.category || post.frontmatter.description,
    }));
  const previewNotes = (notes: Note<NoteFrontmatter>[], limit = 3) =>
    notes.slice(0, limit).map((note) => ({
      title: note.frontmatter.title,
      href: `${linkPrefix}/notes/${note.slug}`,
      meta: note.frontmatter.description,
    }));

  return (
    <div className="w-full">
      {/* ── ABOVE FOLD: loaded in initial bundle ── */}
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

      {/* ── BELOW FOLD: code-split + deferred until near viewport ── */}
      <LazySection
        minHeight="120px"
        fallback={
          <TransitionPreview
            eyebrow={transitionEyebrow}
            title={transitionTitle}
            subtitle={transitionSubtitle}
            description={transitionDescription}
            ctaText={transitionCta}
            ctaHref={`${linkPrefix}/tags/tutorial`}
            minHeight="120px"
          />
        }
      >
        <HomeTransitionNote
          eyebrow={transitionEyebrow}
          title={transitionTitle}
          subtitle={transitionSubtitle}
          description={transitionDescription}
          ctaText={transitionCta}
          ctaHref={`${linkPrefix}/tags/tutorial`}
        />
      </LazySection>

      {manualTutorialPosts.length > 0 && (
        <LazySection
          minHeight="400px"
          fallback={
            <SectionPreview
              title={tutorialTitle}
              description={locale === "id" ? "Pratinjau cepat artikel tutorial yang sudah tersedia tanpa menunggu interaksi JavaScript." : "Quick server-rendered preview of tutorial articles before the interactive section loads."}
              href={`${linkPrefix}/blog`}
              hrefLabel={tutorialViewMore}
              items={previewPosts(manualTutorialPosts)}
              minHeight="400px"
            />
          }
        >
          <HomeTutorials
            posts={manualTutorialPosts}
            title={tutorialTitle}
            viewMoreText={tutorialViewMore}
            dictionary={dictionary}
            locale={locale}
            tag="Installation Guide"
          />
        </LazySection>
      )}

      {topicPosts.length > 0 && (
        <LazySection
          minHeight="400px"
          fallback={
            <SectionPreview
              title={focusTopicsTitle}
              description={locale === "id" ? "Sorotan artikel bertopik Windows dan Ubuntu yang tetap muncul di HTML server-rendered." : "Highlighted Windows and Ubuntu articles that remain visible in the server-rendered HTML."}
              href={`${linkPrefix}/blog`}
              hrefLabel={dictionary.home.viewAllPosts}
              items={previewPosts(topicPosts)}
              minHeight="400px"
            />
          }
        >
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
        </LazySection>
      )}

      {updatePosts.length > 0 && (
        <LazySection
          minHeight="400px"
          fallback={
            <SectionPreview
              title={updatesTitle}
              description={locale === "id" ? "Artikel pembaruan sistem yang dipublikasikan sebagai preview SSR untuk crawler dan pembaca cepat." : "System update articles exposed as SSR previews for crawlers and fast readers."}
              href={`${linkPrefix}/blog`}
              hrefLabel={updatesViewMore}
              items={previewPosts(updatePosts)}
              minHeight="400px"
            />
          }
        >
          <HomeUpdates
            posts={updatePosts}
            title={updatesTitle}
            viewMoreText={updatesViewMore}
            dictionary={dictionary}
            locale={locale}
            tag={updateTag}
            viewMoreHref={`${linkPrefix}/blog`}
          />
        </LazySection>
      )}

      {latestNotes.length > 0 && (
        <LazySection
          minHeight="400px"
          fallback={
            <SectionPreview
              title={notesTitle}
              description={locale === "id" ? "Catatan teknis terbaru tetap terlihat di HTML awal meski section interaktif ditunda." : "Latest technical notes stay visible in the initial HTML even while the interactive section is deferred."}
              href={`${linkPrefix}/notes`}
              hrefLabel={notesViewMore}
              items={previewNotes(latestNotes)}
              minHeight="400px"
            />
          }
        >
          <HomeNotes
            notes={latestNotes}
            title={notesTitle}
            viewMoreText={notesViewMore}
            dictionary={dictionary}
            locale={locale}
            linkPrefix={linkPrefix}
            viewMoreHref={`${linkPrefix}/notes`}
          />
        </LazySection>
      )}
    </div>
  );
}
