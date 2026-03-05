import { getSortedPostsData } from "@/lib/posts";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { BlogListClient } from "./blog-list-client";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const currentPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const canonicalPath = `${currentPrefix}/blog`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/blog`;
  });

  return {
    title: dictionary.blog.title,
    description: dictionary.blog.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const initialPosts = await getSortedPostsData(locale);
  const dictionary = await getDictionary(locale);

  return (
    <BlogListClient
      initialPosts={initialPosts as any}
      dictionary={dictionary}
      locale={locale}
    />
  );
}
