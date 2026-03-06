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
import Image from "next/image";
import Link from "next/link";
import { mdxComponents } from "@/components/mdx-components";
import { PostComments } from "@/components/blog/post-comments";
import { PostMeta } from "@/components/blog/post-meta";
import { ShareButtons } from "@/components/blog/share-buttons";
import { RelatedPosts } from "@/components/blog/related-posts";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { extractHeadings } from "@/lib/mdx-utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { resolveHeroImage, getLinkPrefix } from "@/lib/utils";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";

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
    : "https://snipgeek.com/images/footer/about.webp";

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
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
      publishedTime: post.frontmatter.date,
      modifiedTime: post.frontmatter.updated ?? post.frontmatter.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [ogImageUrl],
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
    : undefined;

  const headings = extractHeadings(initialPost.content || "");
  const wordCount = (initialPost.content || "").trim().split(/\s+/).length || 0;
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
    { label: initialPost.frontmatter.category || "Blog" },
  ];

  const allPosts = await getSortedPostsData(locale);
  const initialRelatedContent = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 10);

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
        <article>
          <header className="mb-12 text-center">
            <Breadcrumbs
              segments={breadcrumbSegments}
              className="mb-6 justify-center"
            />

            <h1 className="font-headline text-display-sm font-extrabold tracking-tighter text-primary mb-6 max-w-3xl mx-auto">
              {initialPost.frontmatter.title}
            </h1>

            <PostMeta
              frontmatter={initialPost.frontmatter}
              item={itemForMeta}
              locale={locale}
              dictionary={dictionary}
              readingTime={readingTime}
              isOverlay={false}
              isCentered={true}
            />

            <div className="relative mt-8 mb-12 rounded-xl overflow-hidden shadow-2xl bg-muted group ring-1 ring-primary/5">
              {heroSource ? (
                <Image
                  src={heroSource.url}
                  alt={imageAlt || initialPost.frontmatter.title}
                  width={1200}
                  height={630}
                  className="w-full h-auto aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                  data-ai-hint={heroSource.hint}
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-primary/5">
                  <span className="text-primary/20 font-headline text-6xl font-black">
                    SnipGeek
                  </span>
                </div>
              )}
            </div>
          </header>

          <div className="max-w-3xl mx-auto">
            <TableOfContents headings={headings} title={dictionary.post.toc} />

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

            {initialPost.frontmatter.tags &&
              initialPost.frontmatter.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap justify-center gap-3">
                  {initialPost.frontmatter.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`${linkPrefix}/tags/${tag.toLowerCase()}`}
                    >
                      <span className="text-sm font-bold text-accent hover:text-primary transition-all duration-300">
                        #{tag}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
              <h3 className="text-lg font-semibold tracking-tight text-primary">
                {dictionary.post.shareArticle}
              </h3>
              <ShareButtons
                title={initialPost.frontmatter.title}
                imageUrl={heroSource?.url}
              />
            </div>

            <PostComments
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
      <RelatedPosts
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
