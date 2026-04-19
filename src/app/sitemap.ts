import { MetadataRoute } from "next";
import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { shouldIndexTag } from "@/lib/tags";
import { i18n } from "@/i18n-config";

// Cache sitemap for 1 hour to avoid recomputing on every crawler request
export const revalidate = 3600;

const DOMAIN = "https://snipgeek.com";

// Fixed date for static pages — update manually when page content changes
const STATIC_LAST_MODIFIED = new Date("2026-04-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Content/discovery pages — change whenever new posts or notes are added
  const contentRoutes = ["", "/blog", "/notes", "/tags"];

  // Info pages — rarely change; no need to signal weekly crawl
  const infoRoutes = ["/about", "/contact", "/privacy", "/terms", "/disclaimer"];

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

      const contentPages = contentRoutes.map((route) => ({
        url: `${DOMAIN}${localePrefix}${route}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : 0.8,
      }));

      const infoPages = infoRoutes.map((route) => ({
        url: `${DOMAIN}${localePrefix}${route}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));

      const toolPages = toolRoutes.map((tool) => ({
        url: `${DOMAIN}${localePrefix}/tools/${tool}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }));

      return [...contentPages, ...infoPages, ...toolPages];
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

      const tagData: Record<string, { count: number; latestDate: Date }> = {};
      allItems.forEach((item) => {
        const itemDate = new Date(
          item.frontmatter.updated || item.frontmatter.date,
        );
        item.frontmatter.tags?.forEach((tag: string) => {
          const lowerTag = tag.toLowerCase();
          const existing = tagData[lowerTag];
          if (!existing) {
            tagData[lowerTag] = { count: 1, latestDate: itemDate };
          } else {
            existing.count += 1;
            if (itemDate > existing.latestDate) {
              existing.latestDate = itemDate;
            }
          }
        });
      });

      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;

      return Object.entries(tagData)
        .filter(([tag, { count }]) => shouldIndexTag(tag, count))
        .map(([tag, { latestDate }]) => ({
          url: `${DOMAIN}${localePrefix}/tags/${encodeURIComponent(tag)}`,
          lastModified: latestDate,
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
