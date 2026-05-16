import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData as getRawNotes } from "@/lib/notes";
import { i18n, type Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { CategoryListClient } from "./category-list-client";
import type { Metadata } from "next";
import { getAllCategories, normalizeCategorySlug } from "@/lib/categories";
import { getLinkPrefix } from "@/lib/utils";
import { notFound } from "next/navigation";

// Only pre-render categories that currently exist in content.
export const dynamicParams = false;

function formatCategoryLabelFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

async function getCategoryAlternates(categorySlug: string) {
  const normalizedSlug = normalizeCategorySlug(categorySlug);
  const localizedEntries = await Promise.all(
    i18n.locales.map(async (locale) => {
      const categories = await getAllCategories(locale);
      const existing = categories.find((entry) => entry.slug === normalizedSlug);
      if (!existing) {
        return null;
      }

      const prefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
      return [
        locale,
        `${prefix}/category/${encodeURIComponent(existing.slug)}`,
      ] as const;
    }),
  );

  const languages: Record<string, string> = {};
  localizedEntries.forEach((entry) => {
    if (!entry) {
      return;
    }
    languages[entry[0]] = entry[1];
  });

  return languages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const normalizedSlug = normalizeCategorySlug(slug);
  const categories = await getAllCategories(locale);
  const match = categories.find((entry) => entry.slug === normalizedSlug);
  if (!match) {
    return {
      title: "Category Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  const displayCategory = match.name;
  const dictionary = await getDictionary(locale as Locale);
  const encodedSlug = encodeURIComponent(normalizedSlug);
  const canonicalPath =
    locale === i18n.defaultLocale
      ? `/category/${encodedSlug}`
      : `/${locale}/category/${encodedSlug}`;
  const languages = await getCategoryAlternates(slug);

  return {
    title: dictionary.categories.title.replace("{category}", displayCategory),
    description: dictionary.categories.description.replace(
      "{category}",
      displayCategory,
    ),
    robots: {
      index: true,
      follow: true,
    },
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
      title: dictionary.categories.title.replace("{category}", displayCategory),
      description: dictionary.categories.description.replace(
        "{category}",
        displayCategory,
      ),
      images: [
        {
          url: "https://snipgeek.com/opengraph-image",
          width: 1200,
          height: 630,
          alt: `SnipGeek category ${displayCategory}`,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  const localizedCategories = await Promise.all(
    i18n.locales.map(async (locale) => {
      const categories = await getAllCategories(locale);
      return categories.map((category) => ({ locale, slug: category.slug }));
    }),
  );

  return localizedCategories.flat();
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const normalizedSlug = normalizeCategorySlug(slug);
  const dictionary = await getDictionary(locale as Locale);

  const allPosts = await getSortedPostsData(locale);
  const posts = allPosts.filter((post) =>
    post.frontmatter.category
      ? normalizeCategorySlug(post.frontmatter.category) === normalizedSlug
      : false,
  );

  const notes = await getRawNotes(locale);
  const filteredNotes = notes.filter((note) =>
    note.frontmatter.category
      ? normalizeCategorySlug(note.frontmatter.category) === normalizedSlug
      : false,
  );

  if (posts.length === 0 && filteredNotes.length === 0) {
    notFound();
  }

  const categoryLabel =
    posts[0]?.frontmatter.category ||
    filteredNotes[0]?.frontmatter.category ||
    formatCategoryLabelFromSlug(normalizedSlug);

  const linkPrefix = getLinkPrefix(locale);
  const canonicalUrl = `https://snipgeek.com${linkPrefix}/category/${encodeURIComponent(normalizedSlug)}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: dictionary.categories.title.replace("{category}", categoryLabel),
            description: dictionary.categories.description.replace(
              "{category}",
              categoryLabel,
            ),
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
                name: dictionary.categories.allCategoriesTitle,
                item: `https://snipgeek.com${linkPrefix}/category`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: categoryLabel,
                item: canonicalUrl,
              },
            ],
          }),
        }}
      />
      <CategoryListClient
        posts={posts}
        notes={filteredNotes}
        dictionary={dictionary}
        locale={locale}
        categoryLabel={categoryLabel}
      />
    </>
  );
}
