import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData as getRawNotes } from "@/lib/notes";
import { i18n, type Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { TagListClient } from "./tag-list-client";
import type { Metadata } from "next";
import { shouldIndexTag } from "@/lib/tags";

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
    p.frontmatter.tags?.some((t) => t.toLowerCase() === decodedTag.toLowerCase()),
  ).length;

  const notes = await getRawNotes(locale);
  const notesCount = notes.filter((n) =>
    n.frontmatter.tags?.some((t) => t.toLowerCase() === decodedTag.toLowerCase()),
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
  const locales = i18n.locales;
  return locales.map((locale) => ({ locale, tag: "tutorial" }));
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
    p.frontmatter.tags?.some((t) => t.toLowerCase() === decodedTag),
  );

  const notes = await getRawNotes(locale);
  const filteredNotes = notes.filter((n) =>
    n.frontmatter.tags?.some((t) => t.toLowerCase() === decodedTag),
  );

  return (
    <TagListClient
      posts={posts}
      notes={filteredNotes}
      dictionary={dictionary}
      locale={locale}
      decodedTag={decodedTag}
    />
  );
}
