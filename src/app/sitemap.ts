import { MetadataRoute } from "next";
import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";

// Cache sitemap for 1 hour to avoid recomputing on every crawler request
export const revalidate = 3600;

const DOMAIN = "https://snipgeek.com";

// Fixed date for static pages — update manually when page content changes
const STATIC_LAST_MODIFIED = new Date("2026-04-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Content/discovery pages — change whenever new posts or notes are added
  // Note: /tags is excluded because tag pages have noindex meta (sitemap/noindex conflict)
  const contentRoutes = ["", "/blog", "/notes"];

  // Info pages — rarely change; no need to signal weekly crawl
  const infoRoutes = ["/about", "/contact", "/privacy", "/terms", "/disclaimer"];

  // Tools routes yang ingin diindeks
  const toolRoutes = [
    "laptop-service-estimator",
    "bios-keys-boot-menu",
    "spin-wheel",
    "random-name-picker",
    "image-crop",
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

      return posts
        .map((post) => {
          const lastModified = safeDate(
            post.frontmatter.updated || post.frontmatter.date,
          );
          // Skip entries where the date is unresolvable — avoids Invalid Date
          // producing malformed <lastmod> output in the sitemap XML.
          if (!lastModified) return null;

          return {
            url: `${DOMAIN}${localePrefix}/blog/${post.slug}`.trim(),
            lastModified,
            changeFrequency: "monthly" as const,
            priority: post.frontmatter.featured ? 0.8 : 0.6,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    }),
  );

  // 3. Notes
  const noteEntries = await Promise.all(
    i18n.locales.map(async (locale) => {
      const notes = await getSortedNotesData(locale);
      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;

      return notes
        .map((note) => {
          const lastModified = safeDate(
            note.frontmatter.updated || note.frontmatter.date,
          );
          if (!lastModified) return null;

          return {
            url: `${DOMAIN}${localePrefix}/notes/${note.slug}`.trim(),
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.5,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    }),
  );

  // Tags are intentionally excluded from sitemap because tag pages have noindex meta.
  // Including them would create a sitemap/noindex conflict that wastes crawl budget.
  // Tags are still accessible via navigation and internal links for users.

  return [
    ...staticEntries,
    ...blogEntries.flat(),
    ...noteEntries.flat(),
  ];
}

/**
 * Safely parse a date string from MDX frontmatter.
 *
 * gray-matter parses YAML dates as Date objects or strings; either way,
 * trim whitespace before passing to the Date constructor to prevent
 * trailing newlines (e.g. "2026-04-28\n") from producing Invalid Date,
 * which would cause the Next.js sitemap serializer to emit empty <lastmod>
 * tags or malformed XML structure.
 *
 * Returns null if the value is falsy or unparseable.
 */
function safeDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}
