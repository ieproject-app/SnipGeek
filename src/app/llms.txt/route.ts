import { i18n } from "@/i18n-config";
import { getSortedNotesData } from "@/lib/notes";
import { getSortedPostsData } from "@/lib/posts";

const DOMAIN = "https://snipgeek.com";

function withLocalePrefix(locale: string) {
  return locale === i18n.defaultLocale ? "" : `/${locale}`;
}

export async function GET() {
  const sections = await Promise.all(
    i18n.locales.map(async (locale) => {
      const [posts, notes] = await Promise.all([
        getSortedPostsData(locale),
        getSortedNotesData(locale),
      ]);
      const localePrefix = withLocalePrefix(locale);
      const localeLabel = locale === "id" ? "Indonesian" : "English";

      const postLines = posts.map(
        (post) =>
          `- ${post.frontmatter.title}\n  HTML: ${DOMAIN}${localePrefix}/blog/${post.slug}\n  JSON: ${DOMAIN}/api/posts/${post.slug}?locale=${locale}\n  Markdown: ${DOMAIN}/api/posts/${post.slug}/markdown?locale=${locale}`,
      );

      const noteLines = notes.map(
        (note) =>
          `- ${note.frontmatter.title}\n  HTML: ${DOMAIN}${localePrefix}/notes/${note.slug}\n  JSON: ${DOMAIN}/api/notes/${note.slug}?locale=${locale}\n  Markdown: ${DOMAIN}/api/notes/${note.slug}/markdown?locale=${locale}`,
      );

      return [
        `## ${localeLabel} blog posts`,
        ...postLines,
        "",
        `## ${localeLabel} notes`,
        ...noteLines,
      ].join("\n");
    }),
  );

  const body = [
    "# SnipGeek",
    "",
    "SnipGeek is a bilingual technology site focused on Windows, Ubuntu, troubleshooting, practical tutorials, and concise technical notes.",
    "",
    "## Preferred sources",
    `- Sitemap: ${DOMAIN}/sitemap.xml`,
    `- Blog index: ${DOMAIN}/blog`,
    `- Notes index: ${DOMAIN}/notes`,
    `- Machine-readable articles: ${DOMAIN}/api/posts/{slug}?locale={locale}`,
    `- Machine-readable notes: ${DOMAIN}/api/notes/{slug}?locale={locale}`,
    `- Plain Markdown articles: ${DOMAIN}/api/posts/{slug}/markdown?locale={locale}`,
    `- Plain Markdown notes: ${DOMAIN}/api/notes/{slug}/markdown?locale={locale}`,
    "",
    ...sections,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}