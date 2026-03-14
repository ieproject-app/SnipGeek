import { MetadataRoute } from "next";
import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";

const DOMAIN = "https://snipgeek.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/blog",
    "/notes",
    "/tools",
    "/tools/spin-wheel",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
  ];

  // 1. Static Routes
  const staticEntries: MetadataRoute.Sitemap = i18n.locales.flatMap(
    (locale) => {
      return routes.map((route) => {
        const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
        return {
          url: `${DOMAIN}${localePrefix}${route}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: route === "" ? 1 : 0.8,
        };
      });
    },
  );

  // 2. Blog Posts
  const blogEntries = await Promise.all(
    i18n.locales.map(async (locale) => {
      const posts = await getSortedPostsData(locale);
      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;

      return posts.map((post) => ({
        url: `${DOMAIN}${localePrefix}/blog/${post.slug}`,
        lastModified: new Date(
          post.frontmatter.updated || post.frontmatter.date,
        ),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }),
  );

  // 3. Notes
  const noteEntries = await Promise.all(
    i18n.locales.map(async (locale) => {
      const notes = await getSortedNotesData(locale);
      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;

      return notes.map((note) => ({
        url: `${DOMAIN}${localePrefix}/notes/${note.slug}`,
        lastModified: new Date(
          note.frontmatter.updated || note.frontmatter.date,
        ),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    }),
  );

  // 4. Tags (Selective indexing)
  const highValueTags = [
    "windows 11",
    "epson",
    "printer",
    "hardware",
    "ram",
    "tutorial",
    "linux",
    "sap",
    "telegram",
    "android",
    "firebase",
  ];

  const tagEntries = await Promise.all(
    i18n.locales.map(async (locale) => {
      const posts = await getSortedPostsData(locale);
      const notes = await getSortedNotesData(locale);
      const allItems = [...posts, ...notes];

      const tagCounts: Record<string, number> = {};
      allItems.forEach((item) => {
        item.frontmatter.tags?.forEach((tag: string) => {
          const lowerTag = tag.toLowerCase();
          tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
        });
      });

      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;

      return Object.entries(tagCounts)
        .filter(([tag, count]) => count >= 3 || highValueTags.includes(tag))
        .map(([tag]) => ({
          url: `${DOMAIN}${localePrefix}/tags/${encodeURIComponent(tag)}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.4,
        }));
    }),
  );

  return [
    ...staticEntries,
    ...blogEntries.flat(),
    ...noteEntries.flat(),
    ...tagEntries.flat(),
  ];
}
