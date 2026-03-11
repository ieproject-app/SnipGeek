import { i18n, type Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { getPageContent } from "@/lib/pages";

export type StaticPageSlug =
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "disclaimer";

export type StaticPageFrontmatter = {
  title?: string;
  description?: string;
  lastUpdated?: string;
  seoTitle?: string;
  badgeLabel?: string;
  icon?: string;
  [key: string]: string | number | boolean | string[] | null | undefined;
};

export type StaticPageData = {
  frontmatter: StaticPageFrontmatter;
  content: string;
};

export function isValidLocale(value: string): value is Locale {
  return i18n.locales.includes(value as Locale);
}

export function resolveLocale(locale?: string): Locale {
  if (locale && isValidLocale(locale)) {
    return locale;
  }

  return i18n.defaultLocale;
}

export function getStaticPageCanonicalPath(
  slug: StaticPageSlug,
  locale: string,
): string {
  const resolvedLocale = resolveLocale(locale);
  return resolvedLocale === i18n.defaultLocale
    ? `/${slug}`
    : `/${resolvedLocale}/${slug}`;
}

export function getStaticPageLanguageAlternates(
  slug: StaticPageSlug,
): Record<string, string> {
  const languages: Record<string, string> = {};

  i18n.locales.forEach((locale) => {
    languages[locale] =
      locale === i18n.defaultLocale ? `/${slug}` : `/${locale}/${slug}`;
  });

  return languages;
}

export async function getStaticPageData(
  slug: StaticPageSlug,
  locale?: string,
): Promise<StaticPageData> {
  const resolvedLocale = resolveLocale(locale);
  const page = await getPageContent(slug, resolvedLocale);

  return {
    frontmatter: (page.frontmatter ?? {}) as StaticPageFrontmatter,
    content: page.content,
  };
}

export async function generateStaticPageMetadata({
  slug,
  locale,
  fallbackTitle,
  fallbackDescription,
  robots,
}: {
  slug: StaticPageSlug;
  locale: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  robots?: Metadata["robots"];
}): Promise<Metadata> {
  const resolvedLocale = resolveLocale(locale);
  const { frontmatter } = await getStaticPageData(slug, resolvedLocale);

  const canonicalPath = getStaticPageCanonicalPath(slug, resolvedLocale);
  const languages = getStaticPageLanguageAlternates(slug);

  const title = frontmatter.seoTitle || frontmatter.title || fallbackTitle;
  const description = frontmatter.description || fallbackDescription;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(robots ? { robots } : {}),
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export function getStaticPageLastUpdated(
  frontmatter: StaticPageFrontmatter,
): string | undefined {
  return typeof frontmatter.lastUpdated === "string"
    ? frontmatter.lastUpdated
    : undefined;
}

export function getStaticPageTitle(
  frontmatter: StaticPageFrontmatter,
  fallback?: string,
): string | undefined {
  if (typeof frontmatter.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title;
  }

  return fallback;
}

export function getStaticPageDescription(
  frontmatter: StaticPageFrontmatter,
  fallback?: string,
): string | undefined {
  if (
    typeof frontmatter.description === "string" &&
    frontmatter.description.trim()
  ) {
    return frontmatter.description;
  }

  return fallback;
}
