import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { PromptBuilder } from "@/components/admin/prompt-generator";
import { getDictionary } from "@/lib/get-dictionary";
import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { getAllTags } from "@/lib/tags";
import { i18n, type Locale } from "@/i18n-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prompt Generator — Admin — SnipGeek",
  robots: { index: false, follow: false, nocache: true },
};

function resolveLocale(localeParam?: string): Locale {
  if (localeParam && i18n.locales.includes(localeParam as Locale)) {
    return localeParam as Locale;
  }

  return i18n.defaultLocale;
}

export default async function AdminPromptGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: localeParam } = await searchParams;
  const locale = resolveLocale(localeParam);
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.promptGenerator;

  const [posts, notes, allTags] = await Promise.all([
    getSortedPostsData(locale, { includeDrafts: true }),
    getSortedNotesData(locale, { includeDrafts: true }),
    getAllTags("en"),
  ]);

  const existingArticles = [
    ...posts.map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title,
      type: "blog" as const,
      published: post.frontmatter.published === true,
      date: post.frontmatter.date,
    })),
    ...notes.map((note) => ({
      slug: note.slug,
      title: note.frontmatter.title,
      type: "note" as const,
      published: note.frontmatter.published === true,
      date: note.frontmatter.date,
    })),
  ].sort((a, b) => {
    if (a.published !== b.published) {
      return a.published ? 1 : -1;
    }

    return a.title.localeCompare(b.title);
  });

  const availableTags = allTags.map(({ name, count }) => ({ name, count }));

  return (
    <AdminShell>
      <div className="min-h-screen bg-background px-4 py-5 md:px-6">
        <PromptBuilder
          dictionary={pageContent}
          fullDictionary={dictionary}
          existingArticles={existingArticles}
          availableTags={availableTags}
          locale={locale}
          adminRouteBase="/admin/prompt-generator"
          locales={i18n.locales}
        />
      </div>
    </AdminShell>
  );
}
