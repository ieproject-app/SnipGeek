import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";
import { getLinkPrefix } from "@/lib/utils";

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
  const linkPrefix = getLinkPrefix(locale);
  const canonicalUrl =
    locale === i18n.defaultLocale ? "https://snipgeek.com" : `https://snipgeek.com/${locale}`;
  const windowsUbuntuTags = new Set(["windows", "ubuntu", "linux", "dual-boot"]);
  const linuxTags = new Set(["linux", "ubuntu"]);
  const windowsTags = new Set(["windows", "windows-11"]);

  const allPosts = [...initialPosts].sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  );
  const latestNotes = [...initialNotes]
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    )
    .slice(0, 6);
  const seenSlugs = new Set<string>();

  const featuredLinuxPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.featured &&
        post.frontmatter.tags?.some((tag: string) => linuxTags.has(tag.toLowerCase())),
    )
    .slice(0, 2);
  const featuredWindowsPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.featured &&
        post.frontmatter.tags?.some((tag: string) => windowsTags.has(tag.toLowerCase())),
    )
    .slice(0, 2);
  const featuredPosts = [...featuredLinuxPosts, ...featuredWindowsPosts];
  featuredPosts.forEach((post) => seenSlugs.add(post.slug));

  const latestPosts = allPosts
    .filter((post) => post.frontmatter.published && !seenSlugs.has(post.slug))
    .slice(0, 6);
  latestPosts.forEach((post) => seenSlugs.add(post.slug));

  const manualTutorialSlugs = [
    "how-to-create-windows-11-bootable-usb-rufus",
    "clean-install-windows-11-step-by-step-guide",
    "to-do-after-install-windows11",
  ];
  const manualTutorialPosts = allPosts.filter(
    (post) =>
      post.frontmatter.published && manualTutorialSlugs.includes(post.slug),
  );
  manualTutorialPosts.forEach((post) => seenSlugs.add(post.slug));

  const topicPosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        !seenSlugs.has(post.slug) &&
        post.frontmatter.tags?.some((tag: string) => windowsUbuntuTags.has(tag.toLowerCase())),
    )
    .slice(0, 8);
  topicPosts.forEach((post) => seenSlugs.add(post.slug));

  const primaryUpdatePosts = allPosts
    .filter(
      (post) =>
        post.frontmatter.published &&
        !seenSlugs.has(post.slug) &&
        post.frontmatter.tags?.some((tag: string) => windowsUbuntuTags.has(tag.toLowerCase())) &&
        (((post.frontmatter.category || "").toLowerCase().includes("update")) ||
          post.frontmatter.tags?.some((tag: string) => {
            const normalized = tag.toLowerCase();
            return normalized === "update" || normalized === "news";
          })),
    )
    .slice(0, 6);
  const updateFallback = allPosts.filter(
    (post) =>
      post.frontmatter.published &&
      !seenSlugs.has(post.slug) &&
      post.frontmatter.tags?.some((tag: string) => windowsUbuntuTags.has(tag.toLowerCase())),
  );
  const updatePosts = [
    ...primaryUpdatePosts,
    ...updateFallback.filter(
      (post) => !primaryUpdatePosts.some((picked) => picked.slug === post.slug),
    ),
  ].slice(0, 6);

  const toBlogItems = (posts: typeof allPosts, name: string, id: string) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonicalUrl}#${id}`,
    name,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://snipgeek.com${linkPrefix}/blog/${post.slug}`,
      name: post.frontmatter.title,
    })),
  });

  const latestNotesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonicalUrl}#latest-notes`,
    name: locale === "id" ? "Catatan Teknis Terbaru" : "Latest Technical Notes",
    numberOfItems: latestNotes.length,
    itemListElement: latestNotes.map((note, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://snipgeek.com${linkPrefix}/notes/${note.slug}`,
      name: note.frontmatter.title,
    })),
  };

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
    "mainEntity": [
      { "@id": `${canonicalUrl}#featured-posts` },
      { "@id": `${canonicalUrl}#latest-posts` },
      { "@id": `${canonicalUrl}#tutorial-posts` },
      { "@id": `${canonicalUrl}#topic-posts` },
      { "@id": `${canonicalUrl}#update-posts` },
      { "@id": `${canonicalUrl}#latest-notes` },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            toBlogItems(
              featuredPosts,
              locale === "id" ? "Artikel Unggulan" : "Featured Posts",
              "featured-posts",
            ),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            toBlogItems(
              latestPosts,
              dictionary.home.latestPosts,
              "latest-posts",
            ),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            toBlogItems(
              manualTutorialPosts,
              locale === "id" ? "Panduan Instalasi Windows 11" : "Windows 11 Installation Guide",
              "tutorial-posts",
            ),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            toBlogItems(
              topicPosts,
              locale === "id" ? "Sorotan Windows & Ubuntu" : "Windows & Ubuntu Highlights",
              "topic-posts",
            ),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            toBlogItems(
              updatePosts,
              locale === "id" ? "Update Penting Sistem" : "Important System Updates",
              "update-posts",
            ),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(latestNotesJsonLd) }}
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
