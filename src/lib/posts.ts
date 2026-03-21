import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { i18n, type Locale } from "@/i18n-config";

const postsDirectory = path.join(process.cwd(), "_posts");

// Recursively collect every .mdx file under a directory.
// Returns { filePath, slug } where slug = bare filename without extension.
function getAllMdxFiles(
  dir: string,
): { filePath: string; slug: string }[] {
  if (!fs.existsSync(dir)) return [];
  const results: { filePath: string; slug: string }[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllMdxFiles(fullPath));
      } else if (entry.name.endsWith(".mdx")) {
        results.push({
          filePath: fullPath,
          slug: entry.name.replace(/\.mdx$/, ""),
        });
      }
    }
  } catch (err) {
    console.error("Error reading directory:", dir, err);
  }
  return results;
}

// Search recursively for a single slug (filename without .mdx) under dir.
function findMdxFilePath(dir: string, slug: string): string | null {
  if (!fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findMdxFilePath(fullPath, slug);
        if (found) return found;
      } else if (entry.name === `${slug}.mdx`) {
        return fullPath;
      }
    }
  } catch (err) {
    console.error("Error finding file:", slug, err);
  }
  return null;
}

export type PostFrontmatter = {
  title: string;
  date: string;
  updated?: string;
  description: string;
  heroImage: string;
  imageAlt?: string;
  translationKey: string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
  category?: string;
  authorId?: string;
  [key: string]: unknown;
};

export type Post<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};

type GetPostsOptions = {
  includeDrafts?: boolean;
};

export async function getSortedPostsData(
  locale?: string,
  options: GetPostsOptions = {},
): Promise<Post<PostFrontmatter>[]> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const { includeDrafts = false } = options;
  const localeDirectory = path.join(postsDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) {
    return [];
  }

  const mdxFiles = getAllMdxFiles(localeDirectory);

  const allPostsData = mdxFiles
    .map(({ filePath, slug }) => {
      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContents);

        if (!data.heroImage) {
          data.heroImage = "footer-about";
        }

        return {
          slug,
          frontmatter: data as PostFrontmatter,
          locale: targetLocale!,
        };
      } catch {
        return null;
      }
    })
    .filter((p): p is Post<PostFrontmatter> => p !== null)
    .filter((post) => includeDrafts || post.frontmatter.published === true);

  const postsWithKeys = new Map<string, Post<PostFrontmatter>>();
  const postsWithoutKeys: Post<PostFrontmatter>[] = [];

  for (const post of allPostsData) {
    const key = post.frontmatter.translationKey;
    if (key) {
      if (
        !postsWithKeys.has(key) ||
        new Date(post.frontmatter.date) >
          new Date(postsWithKeys.get(key)!.frontmatter.date)
      ) {
        postsWithKeys.set(key, post);
      }
    } else {
      postsWithoutKeys.push(post);
    }
  }

  const uniquePosts = [
    ...Array.from(postsWithKeys.values()),
    ...postsWithoutKeys,
  ];

  return uniquePosts.sort((a, b) => {
    if (new Date(a.frontmatter.date) < new Date(b.frontmatter.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}


export type PostData = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  locale: string;
  isFallback?: boolean;
};

export async function getPostData(
  slug: string,
  locale?: string,
): Promise<PostData | null> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  // Search recursively inside locale sub-folders (e.g. 2026-H1/, 2026-H2/)
  const localeDir = path.join(postsDirectory, targetLocale!);
  const foundPath = findMdxFilePath(localeDir, slug);

  // If file not found in requested locale, fallback to default locale (EN)
  const fallbackDir = path.join(postsDirectory, i18n.defaultLocale);
  const fallbackFound = findMdxFilePath(fallbackDir, slug);

  const resolvedPath = foundPath
    ? { path: foundPath, locale: targetLocale! }
    : fallbackFound
      ? { path: fallbackFound, locale: i18n.defaultLocale }
      : null;

  if (!resolvedPath) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(resolvedPath.path, "utf8");
    const { data, content } = matter(fileContents);
    const isPublished = data.published === true;

    if (!isPublished && process.env.NODE_ENV !== "development") {
      return null;
    }

    if (!data.heroImage) {
      data.heroImage = "footer-about";
    }

    return {
      slug,
      frontmatter: data as PostFrontmatter,
      content,
      locale: resolvedPath.locale,
      isFallback: resolvedPath.locale !== targetLocale,
    };
  } catch {
    return null;
  }
}

export async function getAllPostSlugs(locale?: string) {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const localeDirectory = path.join(postsDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) return [];

  const mdxFiles = getAllMdxFiles(localeDirectory);

  return mdxFiles
    .map(({ filePath, slug }) => {
      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContents);
        if (data.published === true) {
          return { slug };
        }
        return null;
      } catch {
        return null;
      }
    })
    .filter((slug) => slug !== null);
}

export async function getPostTranslation(
  translationKey: string,
  targetLocale: string,
): Promise<Post<PostFrontmatter> | null> {
  const allPosts = await getSortedPostsData(targetLocale);
  const translatedPost = allPosts.find(
    (p) => p.frontmatter.translationKey === translationKey,
  );
  return translatedPost || null;
}

export async function getAllLocales() {
  try {
    if (!fs.existsSync(postsDirectory)) return [];
    return fs
      .readdirSync(postsDirectory)
      .filter((item) =>
        fs.statSync(path.join(postsDirectory, item)).isDirectory(),
      );
  } catch {
    return [];
  }
}

export type TranslationsMap = {
  [key: string]: {
    locale: string;
    slug: string;
  }[];
};

export async function getAllTranslationsMap(): Promise<TranslationsMap> {
  const allLocales = await getAllLocales();
  const translationsMap: TranslationsMap = {};

  for (const locale of allLocales) {
    const localeDirectory = path.join(postsDirectory, locale);

    if (!fs.existsSync(localeDirectory)) continue;

    const mdxFiles = getAllMdxFiles(localeDirectory);

    for (const { filePath, slug } of mdxFiles) {
      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContents);
        const frontmatter = data as PostFrontmatter;

        const key = frontmatter.translationKey;
        if (!key) continue;

        if (!translationsMap[key]) {
          translationsMap[key] = [];
        }

        const existing = translationsMap[key].find((t) => t.locale === locale);
        if (!existing) {
          translationsMap[key].push({ locale, slug });
        }
      } catch {}
    }
  }
  return translationsMap;
}
