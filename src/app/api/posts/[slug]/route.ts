import { getPostData } from "@/lib/posts";
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

  return Response.json(
    {
      slug: post.slug,
      locale,
      isFallback: post.isFallback ?? false,
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
