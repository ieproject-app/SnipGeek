import { getNoteData } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { NextRequest } from "next/server";

/**
 * GET /api/notes/[slug]?locale=en
 *
 * Returns raw note data as JSON for AI crawlers and HTTP fetchers
 * that cannot execute JavaScript.
 *
 * Query params:
 *   locale — "en" (default) or "id"
 *
 * If the requested locale is not found, falls back to the default locale ("en").
 * The `isFallback` field in the response indicates when this happens.
 *
 * This route is intentionally noindex — the canonical page is /notes/[slug].
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

  const note = await getNoteData(slug, locale);

  if (!note) {
    return Response.json(
      { error: "Note not found", slug },
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
      slug: note.slug,
      locale,
      isFallback: note.isFallback ?? false,
      title: note.frontmatter.title,
      description: note.frontmatter.description ?? null,
      date: note.frontmatter.date ?? null,
      updated: note.frontmatter.updated ?? null,
      tags: note.frontmatter.tags ?? [],
      content: note.content ?? "",
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
