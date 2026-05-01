import {
  getPostData,
  getAllPostSlugs,
  getAllLocales,
  getSortedPostsData,
  getPostTranslation,
} from "@/lib/posts";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx-components";
import { ArticleComments } from "@/components/blog/article-comments";
import { ArticleMeta } from "@/components/blog/article-meta";
import { ArticleShare } from "@/components/blog/article-share";
import { ArticleRelated } from "@/components/blog/article-related";
import { ArticleTOC } from "@/components/blog/article-toc";
import { ArticleTags } from "@/components/blog/article-tags";
import { ArticleLead } from "@/components/blog/article-lead";
import { RevealImage } from "@/components/ui/reveal-image";
import { extractHeadings, stripMdxSyntax } from "@/lib/mdx-utils";
import { LayoutBreadcrumbs } from "@/components/layout/layout-breadcrumbs";
import { resolveHeroImage, getLinkPrefix } from "@/lib/utils";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";

// Only pre-render known published slugs; unknown/removed slugs should return 404.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getPostData(slug, locale);

  if (!post) return {};

  const linkPrefix = getLinkPrefix(locale);
  const canonicalPath = `${linkPrefix}/blog/${slug}`;
  const jsonAlternate = `https://snipgeek.com/api/posts/${post.slug}?locale=${locale}`;
  const markdownAlternate = `https://snipgeek.com/api/posts/${post.slug}/markdown?locale=${locale}`;

  // Build hreflang alternates by checking if translations exist for each locale
  const languages: Record<string, string> = {};
  await Promise.all(
    i18n.locales.map(async (loc) => {
      const prefix = getLinkPrefix(loc);
      if (loc === locale) {
        languages[loc] = `${prefix}/blog/${slug}`;
      } else {
        const translation = await getPostTranslation(
          post.frontmatter.translationKey,
          loc,
        );
        if (translation) {
          languages[loc] = `${prefix}/blog/${translation.slug}`;
        }
      }
    }),
  );

  // Resolve hero image for OpenGraph social preview
  const heroSource = resolveHeroImage(
    post.frontmatter.heroImage,
    post.frontmatter.imageAlt,
    post.frontmatter.title,
  );
  const ogImageUrl = heroSource
    ? heroSource.src.startsWith("http")
      ? heroSource.src
      : `https://snipgeek.com${heroSource.src}`
    : "https://snipgeek.com/images/blank/blank.webp";

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    keywords: post.frontmatter.tags?.length ? post.frontmatter.tags : undefined,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
      types: {
        "application/json": jsonAlternate,
        "text/markdown": markdownAlternate,
      },
    },
    openGraph: {
      type: "article",
      url: `https://snipgeek.com${canonicalPath}`,
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.frontmatter.title,
        },
      ],
      publishedTime: new Date(post.frontmatter.date).toISOString(),
      modifiedTime: new Date(post.frontmatter.updated ?? post.frontmatter.date).toISOString(),
      authors: ["Iwan Efendi"],
      tags: post.frontmatter.tags?.length ? post.frontmatter.tags : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [ogImageUrl],
    },
    other: {
      "og:locale": locale === "id" ? "id_ID" : "en_US",
      "article:author": "https://snipgeek.com/about",
      "ai:content-json": jsonAlternate,
      "ai:content-markdown": markdownAlternate,
    },
  };
}

export async function generateStaticParams() {
  const locales = await getAllLocales();
  const allSlugs = await Promise.all(
    locales.map(async (locale) => {
      const slugs = await getAllPostSlugs(locale);
      return slugs.map((item) => ({ slug: item.slug, locale }));
    }),
  );
  return allSlugs.flat();
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const initialPost = await getPostData(slug, locale);
  const dictionary = await getDictionary(locale);

  if (!initialPost) {
    notFound();
  }

  const linkPrefix = getLinkPrefix(locale);
  const {
    heroImage: heroImageValue,
    imageAlt,
    title,
  } = initialPost.frontmatter;

  const resolved = resolveHeroImage(heroImageValue, imageAlt, title);
  const heroSource = resolved
    ? { url: resolved.src, hint: resolved.hint }
    : {
      url: "/images/blank/blank.webp",
      hint: "snipgeek default image",
    };

  const headings = extractHeadings(initialPost.content || "");
  const wordCount = stripMdxSyntax(initialPost.content || "").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const itemForMeta = {
    slug: initialPost.slug,
    title: initialPost.frontmatter.title,
    description: initialPost.frontmatter.description,
    href: `${linkPrefix}/blog/${initialPost.slug}`,
    type: "blog" as const,
  };

  const breadcrumbSegments = [
    { label: dictionary.home.breadcrumbHome, href: linkPrefix || "/" },
    { label: dictionary.navigation.blog, href: `${linkPrefix}/blog` },
    { label: initialPost.frontmatter.category || "Blog", href: initialPost.frontmatter.category ? `${linkPrefix}/blog?category=${encodeURIComponent(initialPost.frontmatter.category)}` : `${linkPrefix}/blog` },
    { label: initialPost.frontmatter.title },
  ];

  const allPosts = await getSortedPostsData(locale);
  const currentTags = initialPost.frontmatter.tags ?? [];
  const currentCategory = initialPost.frontmatter.category;
  const initialRelatedContent = allPosts
    .filter((p) => p.slug !== slug)
    .filter((p) => {
      if (currentCategory && p.frontmatter.category === currentCategory) return true;
      if (currentTags.length > 0 && p.frontmatter.tags?.some((t: string) => currentTags.includes(t))) return true;
      return false;
    });

  const ogImageUrl = heroSource.url.startsWith("http")
    ? heroSource.url
    : `https://snipgeek.com${heroSource.url}`;

  const canonicalPath =
    locale === i18n.defaultLocale ? `/blog/${slug}` : `/${locale}/blog/${slug}`;

  return (
    <div className="w-full">
      {initialPost.isFallback && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
            <span className="text-amber-600 text-xs">⚠</span>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              {locale === "id"
                ? "Artikel ini belum tersedia dalam Bahasa Indonesia. Menampilkan versi Bahasa Inggris."
                : "This article is not yet available in your language. Showing English version."}
            </p>
          </div>
        </div>
      )}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <article aria-label={initialPost.frontmatter.title}>
          <header className="mb-12 text-center">
            <LayoutBreadcrumbs
              segments={breadcrumbSegments}
              className="mb-6 justify-center"
            />

            <h1 className="font-display text-h1 font-extrabold tracking-tighter text-primary mb-6 max-w-3xl mx-auto">
              {initialPost.frontmatter.title}
            </h1>

            <ArticleMeta
              frontmatter={initialPost.frontmatter}
              item={itemForMeta}
              locale={locale}
              dictionary={dictionary}
              readingTime={readingTime}
              isOverlay={false}
              isCentered={true}
            />
          </header>

          {/* Hero image - full-width on mobile, rounded on desktop */}
          <div className="relative -mx-4 sm:-mx-6 lg:mx-0 mb-12">
            {heroSource ? (
              <div className="relative w-full lg:max-w-4xl lg:mx-auto lg:rounded-xl lg:overflow-hidden lg:shadow-xl">
                <RevealImage
                  src={heroSource.url}
                  alt={imageAlt || initialPost.frontmatter.title}
                  width={1200}
                  height={675}
                  className="w-full h-auto max-h-[65vh] object-contain"
                  wrapperClassName="w-full flex items-center justify-center focus:outline-none"
                  placeholderClassName="hidden"
                  showSkeleton
                  holdUntilLoaded
                  revealDurationMs={420}
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                  data-ai-hint={heroSource.hint}
                  style={{ width: "100%", height: "auto", objectFit: "contain", aspectRatio: "auto" }}
                />
              </div>
            ) : (
              <div className="w-full aspect-video lg:max-w-4xl lg:mx-auto lg:rounded-xl lg:overflow-hidden lg:shadow-xl flex items-center justify-center bg-primary/5 relative z-10">
                <span className="text-primary/20 font-display text-6xl font-black">
                  SnipGeek
                </span>
              </div>
            )}
          </div>

          <ArticleLead description={initialPost.frontmatter.description} />

          <div className="max-w-3xl mx-auto">
            <ArticleTOC
              headings={headings}
              title={dictionary.post.toc}
              locale={locale}
            />

            <div className="text-lg text-foreground/80 prose-content">
              <MDXRemote
                source={initialPost.content || ""}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [[rehypeShiki, { theme: "github-dark" }]],
                  },
                }}
              />
            </div>

            <ArticleTags
              tags={initialPost.frontmatter.tags || []}
              linkPrefix={linkPrefix}
              title={
                locale === "id"
                  ? "Topik dalam artikel"
                  : "Topics in this article"
              }
              description={
                locale === "id"
                  ? "Pilih topik untuk menemukan artikel lain dengan bahasan yang serupa."
                  : "Explore related topics and continue reading similar content."
              }
              className="mt-14 bg-muted/20"
            />

            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
              <h3 className="text-lg font-semibold tracking-tight text-primary">
                {dictionary.post.shareArticle}
              </h3>
              <ArticleShare
                title={initialPost.frontmatter.title}
                imageUrl={heroSource?.url}
              />
            </div>

            <ArticleComments
              article={{
                slug: initialPost.slug,
                title: initialPost.frontmatter.title,
              }}
              type="blog"
              locale={locale}
            />
          </div>
        </article>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": initialPost.frontmatter.title,
            "description": initialPost.frontmatter.description,
            "image": ogImageUrl,
            "datePublished": new Date(initialPost.frontmatter.date).toISOString(),
            "dateModified": new Date(initialPost.frontmatter.updated || initialPost.frontmatter.date).toISOString(),
            "inLanguage": locale === "id" ? "id" : "en",
            "wordCount": wordCount,
            ...(currentTags.length > 0 ? { "keywords": currentTags } : {}),
            "author": {
              "@type": "Person",
              "name": "Iwan Efendi",
              "url": "https://snipgeek.com/about",
            },
            "publisher": {
              "@type": "Organization",
              "name": "SnipGeek",
              "logo": {
                "@type": "ImageObject",
                "url": "https://snipgeek.com/images/logo/logo.svg",
              },
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://snipgeek.com${canonicalPath}`,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbSegments.map((segment, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": segment.label,
              "item": segment.href
                ? `https://snipgeek.com${segment.href}`
                : undefined,
            })),
          }),
        }}
      />
      {/* HowTo schema for tutorial articles — enables rich results in Google */}
      {(currentTags.some((t) => t.toLowerCase() === "tutorial") ||
        currentCategory?.toLowerCase() === "tutorial") &&
        headings.filter((h) => h.level === 2).length >= 2 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": initialPost.frontmatter.title,
              "description": initialPost.frontmatter.description,
              "image": ogImageUrl,
              "totalTime": `PT${readingTime}M`,
              "step": headings
                .filter((h) => h.level === 2)
                .map((h, i) => ({
                  "@type": "HowToStep",
                  "position": i + 1,
                  "name": h.text,
                  "url": `https://snipgeek.com${canonicalPath}#${h.id}`,
                })),
            }),
          }}
        />
      )}
      <ArticleRelated
        type="blog"
        locale={locale}
        currentSlug={initialPost.slug}
        currentTags={initialPost.frontmatter.tags}
        currentCategory={initialPost.frontmatter.category}
        initialRelatedContent={initialRelatedContent}
        dictionary={dictionary}
      />
    </div>
  );
}
