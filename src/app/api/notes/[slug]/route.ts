import { getNoteData, getNoteTranslation } from "@/lib/notes";
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

  // Build translation availability map.
  // Default locale always has the note (the fallback source).
  // Other locales are checked via getNoteTranslation using the translationKey.
  const translationAvailable: string[] = [i18n.defaultLocale];
  const translationUrls: Record<string, string> = {
    [i18n.defaultLocale]: `/api/notes/${note.slug}?locale=${i18n.defaultLocale}`,
  };

  if (note.frontmatter.translationKey) {
    await Promise.all(
      i18n.locales
        .filter((loc) => loc !== i18n.defaultLocale)
        .map(async (loc) => {
          if (loc === locale && !note.isFallback) {
            // Non-default locale was requested directly and isn't a fallback — it exists
            translationAvailable.push(loc);
            translationUrls[loc] = `/api/notes/${note.slug}?locale=${loc}`;
          } else {
            const translation = await getNoteTranslation(
              note.frontmatter.translationKey,
              loc,
            );
            if (translation) {
              translationAvailable.push(loc);
              translationUrls[loc] = `/api/notes/${translation.slug}?locale=${loc}`;
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
      slug: note.slug,
      locale,
      isFallback: note.isFallback ?? false,
      translationAvailable,
      translationUrls,
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
