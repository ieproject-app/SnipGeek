import crypto from "crypto";
import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { toolsRegistry } from "@/lib/tools-registry";
import { i18n } from "@/i18n-config";

const DOMAIN = "https://snipgeek.com";

export type ContentType = "blog" | "note" | "tool";

export type InventoryItem = {
  /** Stable identity for Firestore document id (sha1 of `url`). */
  id: string;
  /** Absolute URL on production. */
  url: string;
  /** Path portion of the URL (without domain). */
  path: string;
  /** Content type — used for filtering & weekly target counting. */
  type: ContentType;
  /** Locale: "en" or "id". Tools appear for every locale. */
  locale: string;
  /** Slug portion (filename for MDX; slug from registry for tools). */
  slug: string;
  /** Display title for the table. */
  title: string;
  /** ISO date for publish date (only for blog/note). Tools have no date. */
  date?: string;
  /** True for draft blog/note, or devOnly tools. */
  draft?: boolean;
  /** Explicit opt-out for index monitoring, even when the URL is public. */
  excludeFromIndexMonitoring?: boolean;
  /** Tools gated behind login are not indexable — used to mark noIndex. */
  requiresAuth?: boolean;
  /** True when a blog article has matching sibling files in the other locales. */
  hasLocalePair?: boolean;
  /** Other locales that are still missing for this blog article. */
  missingPairLocales?: string[];
};

export function hashUrl(url: string): string {
  return crypto.createHash("sha1").update(url).digest("hex");
}

function makePath(locale: string, segment: string, slug?: string): string {
  const prefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  return slug ? `${prefix}${segment}/${slug}` : `${prefix}${segment}`;
}

/**
 * Build the full content inventory from disk + registry.
 * Server-only — must be called from API routes, not client components.
 */
export async function buildContentInventory(
  options: { includeDrafts?: boolean } = {},
): Promise<InventoryItem[]> {
  const { includeDrafts = false } = options;
  const items: InventoryItem[] = [];
  const postsByLocale = new Map<
    string,
    Awaited<ReturnType<typeof getSortedPostsData>>
  >();
  const blogSlugSetByLocale = new Map<string, Set<string>>();

  for (const locale of i18n.locales) {
    const posts = await getSortedPostsData(locale, { includeDrafts });
    postsByLocale.set(locale, posts);
    blogSlugSetByLocale.set(locale, new Set(posts.map((post) => post.slug)));
  }

  for (const locale of i18n.locales) {
    // ── Blog posts
    const posts = postsByLocale.get(locale) ?? [];
    for (const p of posts) {
      const path = makePath(locale, "/blog", p.slug);
      const url = `${DOMAIN}${path}`;
      const missingPairLocales = i18n.locales.filter(
        (targetLocale) =>
          targetLocale !== locale &&
          !blogSlugSetByLocale.get(targetLocale)?.has(p.slug),
      );
      items.push({
        id: hashUrl(url),
        url,
        path,
        type: "blog",
        locale,
        slug: p.slug,
        title: p.frontmatter.title,
        date: p.frontmatter.date,
        draft: p.frontmatter.published !== true,
        excludeFromIndexMonitoring:
          p.frontmatter.excludeFromIndexMonitoring === true,
        hasLocalePair: missingPairLocales.length === 0,
        missingPairLocales,
      });
    }

    // ── Notes
    const notes = await getSortedNotesData(locale, { includeDrafts });
    for (const n of notes) {
      const path = makePath(locale, "/notes", n.slug);
      const url = `${DOMAIN}${path}`;
      items.push({
        id: hashUrl(url),
        url,
        path,
        type: "note",
        locale,
        slug: n.slug,
        title: n.frontmatter.title,
        date: n.frontmatter.date,
        draft: n.frontmatter.published !== true,
        excludeFromIndexMonitoring:
          n.frontmatter.excludeFromIndexMonitoring === true,
      });
    }

    // ── Tools (one entry per locale — same registry list)
    for (const tool of toolsRegistry) {
      const path = makePath(locale, "/tools", tool.slug);
      const url = `${DOMAIN}${path}`;
      items.push({
        id: hashUrl(url),
        url,
        path,
        type: "tool",
        locale,
        slug: tool.slug,
        title: tool.label,
        requiresAuth: tool.requiresAuth,
        draft: tool.devOnly,
        excludeFromIndexMonitoring: tool.excludeFromIndexMonitoring,
      });
    }
  }

  return items;
}
