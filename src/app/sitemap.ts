import { MetadataRoute } from "next";
import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { shouldIndexTag } from "@/lib/tags";
import { i18n } from "@/i18n-config";

const DOMAIN = "https://snipgeek.com";

// Fixed date for static pages — update manually when page content changes
const STATIC_LAST_MODIFIED = new Date("2026-04-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/blog",
    "/notes",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
    "/tools",
  ];

  // Tools routes yang ingin diindeks
  const toolRoutes = [
    "laptop-service-estimator",
    "bios-keys-boot-menu",
    "spin-wheel",
    "random-name-picker",
  ];

  // 1. Static Routes
  const staticEntries: MetadataRoute.Sitemap = i18n.locales.flatMap(
    (locale) => {
      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
      const mainRoutes = routes.map((route) => ({
        url: `${DOMAIN}${localePrefix}${route}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : route === "/tools" ? 0.9 : 0.8,
      }));
      
      const toolPages = toolRoutes.map((tool) => ({
        url: `${DOMAIN}${localePrefix}/tools/${tool}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
      
      return [...mainRoutes, ...toolPages];
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
        priority: post.frontmatter.featured ? 0.8 : 0.6,
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
        .filter(([tag, count]) => shouldIndexTag(tag, count))
        .map(([tag]) => ({
          url: `${DOMAIN}${localePrefix}/tags/${encodeURIComponent(tag)}`,
          lastModified: STATIC_LAST_MODIFIED,
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
