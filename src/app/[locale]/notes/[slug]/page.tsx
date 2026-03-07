import {
  getNoteData,
  getAllNoteSlugs,
  getAllLocales,
  getSortedNotesData,
  getNoteTranslation,
} from "@/lib/notes";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx-components";
import { PostMeta } from "@/components/blog/post-meta";
import { ShareButtons } from "@/components/blog/share-buttons";
import { RelatedPosts } from "@/components/blog/related-posts";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ArticleTopics } from "@/components/blog/article-topics";
import { extractHeadings } from "@/lib/mdx-utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PostComments } from "@/components/blog/post-comments";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";
import { resolveHeroImage, getLinkPrefix } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const note = await getNoteData(slug, locale);

  if (!note) return {};

  const linkPrefix = getLinkPrefix(locale);
  const canonicalPath = `${linkPrefix}/notes/${slug}`;

  // Build hreflang alternates by checking if translations exist for each locale
  const languages: Record<string, string> = {};
  await Promise.all(
    i18n.locales.map(async (loc) => {
      const prefix = getLinkPrefix(loc);
      if (loc === locale) {
        languages[loc] = `${prefix}/notes/${slug}`;
      } else {
        const translation = await getNoteTranslation(
          note.frontmatter.translationKey,
          loc,
        );
        if (translation) {
          languages[loc] = `${prefix}/notes/${translation.slug}`;
        }
      }
    }),
  );

  // Notes don't have heroImages but use a generic OG image
  const heroSource = resolveHeroImage(
    note.frontmatter.heroImage,
    undefined,
    note.frontmatter.title,
  );
  const ogImageUrl = heroSource
    ? heroSource.src.startsWith("http")
      ? heroSource.src
      : `https://snipgeek.com${heroSource.src}`
    : "https://snipgeek.com/images/footer/about.webp";

  return {
    title: note.frontmatter.title,
    description: note.frontmatter.description,
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
      title: note.frontmatter.title,
      description: note.frontmatter.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: note.frontmatter.title,
        },
      ],
      publishedTime: note.frontmatter.date,
      modifiedTime: note.frontmatter.updated ?? note.frontmatter.date,
    },
    twitter: {
      card: "summary_large_image",
      title: note.frontmatter.title,
      description: note.frontmatter.description,
      images: [ogImageUrl],
    },
  };
}

export async function generateStaticParams() {
  const locales = await getAllLocales();
  const allSlugs = await Promise.all(
    locales.map(async (locale) => {
      const slugs = await getAllNoteSlugs(locale);
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
  const initialNote = await getNoteData(slug, locale);
  const dictionary = await getDictionary(locale);

  if (!initialNote) {
    notFound();
  }

  const linkPrefix = getLinkPrefix(locale);
  const headings = extractHeadings(initialNote.content || "");
  const wordCount = (initialNote.content || "").trim().split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const itemForMeta = {
    slug: initialNote.slug,
    title: initialNote.frontmatter.title,
    description: initialNote.frontmatter.description,
    href: `${linkPrefix}/notes/${initialNote.slug}`,
    type: "note" as const,
  };

  const breadcrumbSegments = [
    { label: dictionary.home.breadcrumbHome, href: linkPrefix || "/" },
    { label: dictionary.navigation.notes, href: `${linkPrefix}/notes` },
  ];

  const allNotes = await getSortedNotesData(locale);
  const initialRelatedContent = allNotes
    .filter((n) => n.slug !== slug)
    .slice(0, 10);

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <article>
          <header className="mb-12 text-center">
            <Breadcrumbs
              segments={breadcrumbSegments}
              className="mb-6 justify-center"
            />
            <h1 className="font-headline text-display-sm font-extrabold tracking-tighter text-primary mb-6 max-w-3xl mx-auto">
              {initialNote.frontmatter.title}
            </h1>
            <PostMeta
              frontmatter={initialNote.frontmatter}
              item={itemForMeta}
              locale={locale}
              dictionary={dictionary}
              readingTime={readingTime}
              isOverlay={false}
              isCentered={true}
            />
          </header>

          <div className="max-w-3xl mx-auto">
            <TableOfContents
              headings={headings}
              title={dictionary.post.toc}
              locale={locale}
            />
            <div className="text-lg text-foreground/80 prose-content">
              <MDXRemote
                source={initialNote.content || ""}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [[rehypeShiki, { theme: "github-dark" }]],
                  },
                }}
              />
            </div>

            <ArticleTopics
              tags={initialNote.frontmatter.tags ?? []}
              linkPrefix={linkPrefix}
              title={
                locale === "id" ? "Topik dalam catatan" : "Topics in this note"
              }
              description={
                locale === "id"
                  ? "Jelajahi pembahasan serupa lewat topik-topik terkait berikut."
                  : "Explore related ideas through the topics connected to this note."
              }
            />

            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
              <h3 className="text-lg font-semibold tracking-tight text-primary">
                {dictionary.post.shareArticle}
              </h3>
              <ShareButtons title={initialNote.frontmatter.title} />
            </div>
            <PostComments
              article={{
                slug: initialNote.slug,
                title: initialNote.frontmatter.title,
              }}
              type="note"
              locale={locale}
            />
          </div>
        </article>
      </main>
      <RelatedPosts
        type="note"
        locale={locale}
        currentSlug={initialNote.slug}
        currentTags={initialNote.frontmatter.tags}
        initialRelatedContent={initialRelatedContent}
        dictionary={dictionary}
      />
    </div>
  );
}
