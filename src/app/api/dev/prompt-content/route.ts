import { NextResponse } from "next/server";
import { getPostData } from "@/lib/posts";
import { getNoteData } from "@/lib/notes";
import { i18n, type Locale } from "@/i18n-config";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  const localeParam = searchParams.get("locale");

  if (!slug || (type !== "blog" && type !== "note")) {
    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 },
    );
  }

  const locale =
    localeParam && i18n.locales.includes(localeParam as Locale)
      ? (localeParam as Locale)
      : i18n.defaultLocale;

  const data =
    type === "blog"
      ? await getPostData(slug, locale)
      : await getNoteData(slug, locale);

  if (!data) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: data.slug,
    type,
    locale: data.locale,
    title: data.frontmatter.title,
    published: data.frontmatter.published === true,
    date: data.frontmatter.date,
    content: data.content,
  });
}
