import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";
import type { Post, PostFrontmatter } from "@/lib/posts";

function resolveHomeImageSrc(heroImage?: string): string | undefined {
  if (!heroImage) return undefined;

  if (heroImage.startsWith("http") || heroImage.startsWith("/")) {
    return heroImage;
  }

  return PlaceHolderImages.find((item) => item.id === heroImage)?.imageUrl;
}

function toLocalOptimizerUrl(src: string): string {
  if (src.startsWith("/images/")) {
    const params = new URLSearchParams({ src, w: "640", q: "68" });
    return `/api/img?${params.toString()}`;
  }

  if (/^https?:\/\//i.test(src)) {
    try {
      const parsed = new URL(src);
      if (parsed.pathname.startsWith("/images/")) {
        const normalizedSrc = `${parsed.pathname}${parsed.search}`;
        const params = new URLSearchParams({
          src: normalizedSrc,
          w: "640",
          q: "68",
        });
        return `/api/img?${params.toString()}`;
      }
    } catch {
      return src;
    }
  }

  return src;
}

function getFirstLatestPostImageHref(posts: Post<PostFrontmatter>[]): string | null {
  const linuxTags = new Set(["linux", "ubuntu"]);
  const windowsTags = new Set(["windows", "windows-11"]);

  const featuredLinuxPosts = posts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.featured &&
        post.frontmatter.tags?.some((tag) => linuxTags.has(tag.toLowerCase())),
    )
    .slice(0, 2);

  const featuredWindowsPosts = posts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.featured &&
        post.frontmatter.tags?.some((tag) => windowsTags.has(tag.toLowerCase())),
    )
    .slice(0, 2);

  const seenSlugs = new Set<string>();
  [...featuredLinuxPosts, ...featuredWindowsPosts].forEach((post) => {
    seenSlugs.add(post.slug);
  });

  const latestPosts = posts
    .filter((post) => post.frontmatter.published && !seenSlugs.has(post.slug))
    .slice(0, 6);

  const firstLatest = latestPosts[0];
  if (!firstLatest) return null;

  const resolvedSrc = resolveHomeImageSrc(firstLatest.frontmatter.heroImage);
  if (!resolvedSrc) return null;

  return toLocalOptimizerUrl(resolvedSrc);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const canonicalPath = locale === i18n.defaultLocale ? "/" : `/${locale}`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    languages[loc] = loc === i18n.defaultLocale ? "/" : `/${loc}`;
  });

  return {
    title: dictionary.home.title,
    description: dictionary.home.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || "/",
      },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const initialPosts = await getSortedPostsData(locale);
  const initialNotes = await getSortedNotesData(locale);
  const dictionary = await getDictionary(locale);
  const canonicalUrl =
    locale === i18n.defaultLocale ? "https://snipgeek.com" : `https://snipgeek.com/${locale}`;
  const firstLatestPostImageHref = getFirstLatestPostImageHref(initialPosts);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SnipGeek",
    "url": "https://snipgeek.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://snipgeek.com/blog?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SnipGeek",
    "url": "https://snipgeek.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://snipgeek.com/images/logo/logo.svg",
      "width": 512,
      "height": 512,
    },
    "sameAs": [
      "https://github.com/ieproject-app",
    ],
    "founder": {
      "@type": "Person",
      "name": "Iwan Efendi",
      "url": "https://snipgeek.com/about",
    },
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "name": dictionary.home.title,
    "description": dictionary.home.description,
    "isPartOf": { "@type": "WebSite", "url": "https://snipgeek.com" },
    "inLanguage": locale === "id" ? "id-ID" : "en-US",
  };

  return (
    <>
      {firstLatestPostImageHref && (
        <link
          rel="preload"
          as="image"
          href={firstLatestPostImageHref}
          fetchPriority="high"
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <HomeClient
        initialPosts={initialPosts}
        initialNotes={initialNotes}
        dictionary={dictionary}
        locale={locale}
      />
    </>
  );
}
