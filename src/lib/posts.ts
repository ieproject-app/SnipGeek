import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { i18n, type Locale } from "@/i18n-config";

const postsDirectory = path.join(process.cwd(), "_posts");

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

export async function getSortedPostsData(
  locale?: string,
): Promise<Post<PostFrontmatter>[]> {
  const targetLocale = i18n.locales.includes(locale as Locale)
    ? locale
    : i18n.defaultLocale;
  const localeDirectory = path.join(postsDirectory, targetLocale!);

  if (!fs.existsSync(localeDirectory)) {
    return [];
  }

  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    console.error("Error reading posts directory:", err);
    return [];
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
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
    .filter((post) => post.frontmatter.published === true);

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
  const fullPath = path.join(postsDirectory, targetLocale!, `${slug}.mdx`);

  // If file not found in requested locale, fallback to default locale (EN)
  const fallbackPath = path.join(
    postsDirectory,
    i18n.defaultLocale,
    `${slug}.mdx`,
  );
  const resolvedPath = fs.existsSync(fullPath)
    ? { path: fullPath, locale: targetLocale! }
    : fs.existsSync(fallbackPath)
      ? { path: fallbackPath, locale: i18n.defaultLocale }
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

  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch {
    return [];
  }

  return fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);
        if (data.published === true) {
          return {
            slug: fileName.replace(/\.mdx$/, ""),
          };
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

    let fileNames: string[];
    try {
      fileNames = fs.readdirSync(localeDirectory);
    } catch {
      continue;
    }

    for (const fileName of fileNames) {
      if (!fileName.endsWith(".mdx")) continue;

      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(localeDirectory, fileName);
      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
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
