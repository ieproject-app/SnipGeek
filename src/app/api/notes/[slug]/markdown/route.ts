import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getNoteData } from "@/lib/notes";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale: Locale = i18n.locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : i18n.defaultLocale;

  const note = await getNoteData(slug, locale);
  if (!note) {
    return new Response("Note not found", {
      status: 404,
      headers: {
        "X-Robots-Tag": "noindex",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const canonicalPath =
    locale === i18n.defaultLocale
      ? `/notes/${note.slug}`
      : `/${locale}/notes/${note.slug}`;

  const body = [
    `# ${note.frontmatter.title}`,
    "",
    `Canonical: https://snipgeek.com${canonicalPath}`,
    `Locale: ${locale}`,
    `Description: ${note.frontmatter.description ?? ""}`,
    `Date: ${note.frontmatter.date ?? ""}`,
    `Updated: ${note.frontmatter.updated ?? ""}`,
    `Tags: ${(note.frontmatter.tags ?? []).join(", ")}`,
    `JSON: https://snipgeek.com/api/notes/${note.slug}?locale=${locale}`,
    "",
    "---",
    "",
    note.content ?? "",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}