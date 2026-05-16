import sitemap from "../src/app/sitemap";
import { i18n } from "../src/i18n-config";
import { getAllCategories, normalizeCategorySlug } from "../src/lib/categories";
import { getSortedNotesData } from "../src/lib/notes";
import { getSortedPostsData } from "../src/lib/posts";

const DOMAIN = "https://snipgeek.com";

function getLocalePrefix(locale: string) {
  return locale === i18n.defaultLocale ? "" : `/${locale}`;
}

function categoryUrl(locale: string, slug: string) {
  return `${DOMAIN}${getLocalePrefix(locale)}/category/${encodeURIComponent(slug)}`;
}

async function main() {
  console.log("Validating category archives...\n");

  const issues: string[] = [];
  const expectedCategoryUrls = new Set<string>();
  const expectedCategoryIndexUrls = new Set<string>();

  for (const locale of i18n.locales) {
    const [categories, posts, notes] = await Promise.all([
      getAllCategories(locale),
      getSortedPostsData(locale),
      getSortedNotesData(locale),
    ]);

    const actualCounts = new Map<string, number>();

    posts.forEach((post) => {
      if (!post.frontmatter.category) return;
      const slug = normalizeCategorySlug(post.frontmatter.category);
      if (!slug) return;
      actualCounts.set(slug, (actualCounts.get(slug) ?? 0) + 1);
    });

    notes.forEach((note) => {
      if (!note.frontmatter.category) return;
      const slug = normalizeCategorySlug(note.frontmatter.category);
      if (!slug) return;
      actualCounts.set(slug, (actualCounts.get(slug) ?? 0) + 1);
    });

    if (categories.length > 0) {
      expectedCategoryIndexUrls.add(`${DOMAIN}${getLocalePrefix(locale)}/category`);
    }

    categories.forEach((category) => {
      const actualCount = actualCounts.get(category.slug) ?? 0;

      if (category.count <= 0 || actualCount <= 0) {
        issues.push(
          `[${locale}] Category "${category.slug}" has no published content.`,
        );
      }

      if (category.count !== actualCount) {
        issues.push(
          `[${locale}] Category "${category.slug}" count mismatch: getAllCategories=${category.count}, actual=${actualCount}.`,
        );
      }

      expectedCategoryUrls.add(categoryUrl(locale, category.slug));
    });

    actualCounts.forEach((count, slug) => {
      const exists = categories.some((category) => category.slug === slug);
      if (!exists && count > 0) {
        issues.push(
          `[${locale}] Published content exists for category "${slug}" but getAllCategories() did not return it.`,
        );
      }
    });

    console.log(
      `[${locale}] ${categories.length} categories, ${Array.from(actualCounts.values()).reduce((sum, count) => sum + count, 0)} categorized items`,
    );
  }

  const sitemapEntries = await sitemap();
  const sitemapUrls = new Set(sitemapEntries.map((entry) => entry.url));
  const categoryUrlPattern = /^https:\/\/snipgeek\.com(?:\/id)?\/category(?:\/([^/]+))?$/;

  expectedCategoryIndexUrls.forEach((url) => {
    if (!sitemapUrls.has(url)) {
      issues.push(`Sitemap is missing category index: ${url}`);
    }
  });

  expectedCategoryUrls.forEach((url) => {
    if (!sitemapUrls.has(url)) {
      issues.push(`Sitemap is missing category archive: ${url}`);
    }
  });

  sitemapUrls.forEach((url) => {
    const match = url.match(categoryUrlPattern);
    if (!match) return;

    const isIndex = typeof match[1] === "undefined";
    if (isIndex && !expectedCategoryIndexUrls.has(url)) {
      issues.push(`Sitemap includes empty category index: ${url}`);
    }

    if (!isIndex && !expectedCategoryUrls.has(url)) {
      issues.push(`Sitemap includes category archive without content: ${url}`);
    }
  });

  if (issues.length > 0) {
    console.log("\nCategory archive issues found:\n");
    issues.forEach((issue) => console.log(`- ${issue}`));
    console.log("\nCategory archive validation failed");
    process.exit(1);
  }

  console.log("\nAll category archives have content and sitemap entries are clean");
}

main().catch((error) => {
  console.error("Category archive validation crashed:", error);
  process.exit(1);
});
