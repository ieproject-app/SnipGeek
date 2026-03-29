import { getSortedPostsData } from "@/lib/posts";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { BlogListClient } from "./blog-list-client";
import type { Metadata } from "next";
import { getLinkPrefix } from "@/lib/utils";

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
  const linkPrefix = getLinkPrefix(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: dictionary.blog.title,
            description: dictionary.blog.description,
            url: `https://snipgeek.com${linkPrefix}/blog`,
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
                name: dictionary.navigation.blog,
                item: `https://snipgeek.com${linkPrefix}/blog`,
              },
            ],
          }),
        }}
      />
      <BlogListClient
        initialPosts={initialPosts}
        dictionary={dictionary}
        locale={locale}
      />
    </>
  );
}
