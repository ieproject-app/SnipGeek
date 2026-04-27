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
  sectionIcons?: Record<string, string>;
  [key: string]: unknown;
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

const altLocaleLabels: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

export function getStaticPageAltLocale(
  slug: StaticPageSlug,
  locale: string,
): { href: string; label: string } | undefined {
  const current = resolveLocale(locale);
  const alt = i18n.locales.find((l) => l !== current);
  if (!alt) return undefined;

  const href =
    alt === i18n.defaultLocale ? `/${slug}` : `/${alt}/${slug}`;
  const label = altLocaleLabels[alt] ?? alt.toUpperCase();

  return { href, label };
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
    openGraph: {
      type: "website",
      url: `https://snipgeek.com${canonicalPath}`,
      title: title || "SnipGeek",
      description: description,
      images: [
        {
          url: "https://snipgeek.com/opengraph-image",
          width: 1200,
          height: 630,
          alt: title || "SnipGeek",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title || "SnipGeek",
      description: description,
      images: ["https://snipgeek.com/opengraph-image"],
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
