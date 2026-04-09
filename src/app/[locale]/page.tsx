import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";

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
