import { getPostData, getPostTranslation } from "@/lib/posts";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { NextRequest } from "next/server";

/**
 * GET /api/posts/[slug]?locale=en
 *
 * Returns raw article data as JSON for AI crawlers and HTTP fetchers
 * that cannot execute JavaScript.
 *
 * Query params:
 *   locale — "en" (default) or "id"
 *
 * If the requested locale is not found, falls back to the default locale ("en").
 * The `isFallback` field in the response indicates when this happens.
 *
 * This route is intentionally noindex — the canonical page is /blog/[slug].
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const localeParam = searchParams.get("locale");

  // Validate locale — fall back to default if invalid or missing
  const locale: Locale = i18n.locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : i18n.defaultLocale;

  const post = await getPostData(slug, locale);

  if (!post) {
    return Response.json(
      { error: "Post not found", slug },
      {
        status: 404,
        headers: {
          "X-Robots-Tag": "noindex",
        },
      },
    );
  }

  // Build translation availability map.
  // Default locale always has the article (the fallback source).
  // Other locales are checked via getPostTranslation using the translationKey.
  const translationAvailable: string[] = [i18n.defaultLocale];
  const translationUrls: Record<string, string> = {
    [i18n.defaultLocale]: `/api/posts/${post.slug}?locale=${i18n.defaultLocale}`,
  };

  if (post.frontmatter.translationKey) {
    await Promise.all(
      i18n.locales
        .filter((loc) => loc !== i18n.defaultLocale)
        .map(async (loc) => {
          if (loc === locale && !post.isFallback) {
            // Non-default locale was requested directly and isn't a fallback — it exists
            translationAvailable.push(loc);
            translationUrls[loc] = `/api/posts/${post.slug}?locale=${loc}`;
          } else {
            const translation = await getPostTranslation(
              post.frontmatter.translationKey,
              loc,
            );
            if (translation) {
              translationAvailable.push(loc);
              translationUrls[loc] = `/api/posts/${translation.slug}?locale=${loc}`;
            }
          }
        }),
    );
  }

  // Sort to match i18n.locales order: ["en", "id"]
  translationAvailable.sort(
    (a, b) =>
      [...i18n.locales].indexOf(a as Locale) -
      [...i18n.locales].indexOf(b as Locale),
  );

  return Response.json(
    {
      slug: post.slug,
      locale,
      isFallback: post.isFallback ?? false,
      translationAvailable,
      translationUrls,
      title: post.frontmatter.title,
      description: post.frontmatter.description ?? null,
      date: post.frontmatter.date ?? null,
      updated: post.frontmatter.updated ?? null,
      tags: post.frontmatter.tags ?? [],
      category: post.frontmatter.category ?? null,
      content: post.content ?? "",
    },
    {
      headers: {
        "X-Robots-Tag": "noindex",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
