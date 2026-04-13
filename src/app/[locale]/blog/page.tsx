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
  const canonicalPath = `${getLinkPrefix(locale)}/blog`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    languages[loc] = `${getLinkPrefix(loc)}/blog`;
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
    openGraph: {
      type: "website",
      url: `https://snipgeek.com${canonicalPath}`,
      title: dictionary.blog.title,
      description: dictionary.blog.description,
      images: [
        {
          url: "https://snipgeek.com/images/logo/logo.svg",
          width: 512,
          height: 512,
          alt: "SnipGeek Blog",
        },
      ],
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
  const itemListElement = initialPosts.map((post, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `https://snipgeek.com${linkPrefix}/blog/${post.slug}`,
    name: post.frontmatter.title,
  }));

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
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: itemListElement.length,
              itemListElement,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: dictionary.blog.title,
            numberOfItems: itemListElement.length,
            itemListElement,
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
