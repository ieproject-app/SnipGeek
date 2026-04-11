import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData as getRawNotes } from "@/lib/notes";
import { i18n, type Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { TagListClient } from "./tag-list-client";
import type { Metadata } from "next";
import { shouldIndexTag, getAllTags } from "@/lib/tags";
import { getLinkPrefix } from "@/lib/utils";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  const decodedTag = decodeURIComponent(tag).toUpperCase();
  const dictionary = await getDictionary(locale as Locale);
  const canonicalPath =
    locale === i18n.defaultLocale ? `/tags/${tag}` : `/${locale}/tags/${tag}`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tags/${tag}`;
  });

  const allPosts = await getSortedPostsData(locale);
  const postsCount = allPosts.filter((p) =>
    p.frontmatter.tags?.some((t) => t.trim().toLowerCase() === decodedTag.toLowerCase()),
  ).length;

  const notes = await getRawNotes(locale);
  const notesCount = notes.filter((n) =>
    n.frontmatter.tags?.some((t) => t.trim().toLowerCase() === decodedTag.toLowerCase()),
  ).length;

  const totalItems = postsCount + notesCount;
  const shouldIndex = shouldIndexTag(decodedTag, totalItems);

  return {
    title: dictionary.tags.title.replace("{tag}", decodedTag),
    description: dictionary.tags.description.replace("{tag}", decodedTag),
    robots: {
      index: shouldIndex,
      follow: true,
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export async function generateStaticParams() {
  const tags = await getAllTags(i18n.defaultLocale);
  return i18n.locales.flatMap((locale) =>
    tags.map((tag) => ({ locale, tag: tag.name })),
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await params;
  const decodedTag = decodeURIComponent(tag).toLowerCase();
  const dictionary = await getDictionary(locale as Locale);

  const allPosts = await getSortedPostsData(locale);
  const posts = allPosts.filter((p) =>
    p.frontmatter.tags?.some((t) => t.trim().toLowerCase() === decodedTag),
  );

  const notes = await getRawNotes(locale);
  const filteredNotes = notes.filter((n) =>
    n.frontmatter.tags?.some((t) => t.trim().toLowerCase() === decodedTag),
  );

  // Return 404 if tag has no articles
  if (posts.length === 0 && filteredNotes.length === 0) {
    notFound();
  }

  const linkPrefix = getLinkPrefix(locale);
  const canonicalUrl = `https://snipgeek.com${linkPrefix}/tags/${tag}`;
  const displayTag = decodedTag.toUpperCase();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: dictionary.tags.title.replace("{tag}", displayTag),
            description: dictionary.tags.description.replace("{tag}", displayTag),
            url: canonicalUrl,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: dictionary.home.breadcrumbHome,
                item: "https://snipgeek.com" + (linkPrefix || "/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: dictionary.tags.allTagsTitle,
                item: `https://snipgeek.com${linkPrefix}/tags`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: displayTag,
                item: canonicalUrl,
              },
            ],
          }),
        }}
      />
      <TagListClient
        posts={posts}
        notes={filteredNotes}
        dictionary={dictionary}
        locale={locale}
        decodedTag={decodedTag}
      />
    </>
  );
}
