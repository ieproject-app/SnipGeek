import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

type UsageKind = "frontmatter.heroImage" | "markdown.image" | "html.img" | "mdx.src";

export type ImageUsage = {
  filePath: string;
  count: number;
  kinds: UsageKind[];
};

export type ImageCandidate = {
  imagePath: string;
  folder: string;
  fileName: string;
  usageCount: number;
  usages: ImageUsage[];
  existsInPublic: boolean;
  publicFilePath: string;
};

export type ImageMigrationInventory = {
  candidates: ImageCandidate[];
  articles: ArticleCandidate[];
  articleGroups: ArticleGroupCandidate[];
  summary: {
    totalUnmigratedImages: number;
    totalUnmigratedArticles: number;
    totalUnmigratedArticleGroups: number;
    totalProjectLevelImages: number;
  };
  generatedAt: string;
};

export type ArticleCandidate = {
  id: string;
  filePath: string;
  type: "post" | "note";
  slug: string;
  title: string;
  date: string;
  published: boolean;
  imageCount: number;
  imagePaths: string[];
};

export type ArticleGroupCandidate = {
  id: string;
  type: "post" | "note";
  translationKey: string;
  title: string;
  date: string;
  published: boolean;
  imageCount: number;
  imagePaths: string[];
  localeEntries: Array<{
    locale: string;
    filePath: string;
    slug: string;
    title: string;
    date: string;
  }>;
};

type MutableUsage = {
  filePath: string;
  count: number;
  kinds: Set<UsageKind>;
};

const CANDIDATE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
]);

function normalizeImagePath(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (raw.startsWith("public/images/")) {
    return `/${raw.slice("public/".length)}`;
  }
  if (raw.startsWith("/images/")) {
    return raw;
  }
  return null;
}

function isSupportedImagePath(imagePath: string): boolean {
  const ext = path.extname(imagePath).toLowerCase();
  return CANDIDATE_EXTENSIONS.has(ext);
}

function addUsage(
  usageMap: Map<string, Map<string, MutableUsage>>,
  imagePath: string,
  filePath: string,
  kind: UsageKind,
) {
  if (!isSupportedImagePath(imagePath)) return;

  const fileMap = usageMap.get(imagePath) ?? new Map<string, MutableUsage>();
  const entry = fileMap.get(filePath) ?? {
    filePath,
    count: 0,
    kinds: new Set<UsageKind>(),
  };

  entry.count += 1;
  entry.kinds.add(kind);

  fileMap.set(filePath, entry);
  usageMap.set(imagePath, fileMap);
}

function relativeFromRoot(fullPath: string): string {
  return path.relative(process.cwd(), fullPath).replaceAll(path.sep, "/");
}

function collectFromMdx(source: string, fullPath: string, usageMap: Map<string, Map<string, MutableUsage>>) {
  const relativePath = relativeFromRoot(fullPath);
  const parsed = matter(source);
  const heroImage = parsed.data?.heroImage;

  if (typeof heroImage === "string") {
    const normalized = normalizeImagePath(heroImage);
    if (normalized) {
      addUsage(usageMap, normalized, relativePath, "frontmatter.heroImage");
    }
  }

  const markdownImageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  const htmlImgRegex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  const mdxSrcRegex = /\bsrc=["']([^"']+)["']/g;

  let match: RegExpExecArray | null = null;

  while ((match = markdownImageRegex.exec(parsed.content))) {
    const normalized = normalizeImagePath(match[1] ?? "");
    if (normalized) {
      addUsage(usageMap, normalized, relativePath, "markdown.image");
    }
  }

  while ((match = htmlImgRegex.exec(parsed.content))) {
    const normalized = normalizeImagePath(match[1] ?? "");
    if (normalized) {
      addUsage(usageMap, normalized, relativePath, "html.img");
    }
  }

  while ((match = mdxSrcRegex.exec(parsed.content))) {
    const normalized = normalizeImagePath(match[1] ?? "");
    if (normalized) {
      addUsage(usageMap, normalized, relativePath, "mdx.src");
    }
  }
}

function collectFromPlaceholderJson(usageMap: Map<string, Map<string, MutableUsage>>) {
  const placeholderPath = path.join(process.cwd(), "src/lib/placeholder-images.json");
  if (!existsSync(placeholderPath)) return;

  const raw = readFileSync(placeholderPath, "utf8");
  const parsed = JSON.parse(raw) as
    | Array<{ imageUrl?: unknown }>
    | { placeholderImages?: Array<{ imageUrl?: unknown }> };
  const filePath = "src/lib/placeholder-images.json";

  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.placeholderImages)
      ? parsed.placeholderImages
      : [];

  for (const item of rows) {
    if (typeof item?.imageUrl !== "string") continue;
    const normalized = normalizeImagePath(item.imageUrl);
    if (normalized) {
      addUsage(usageMap, normalized, filePath, "mdx.src");
    }
  }
}

async function walkMdxFiles(dirPath: string): Promise<string[]> {
  if (!existsSync(dirPath)) return [];
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMdxFiles(fullPath)));
    } else if (entry.isFile() && fullPath.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

type ArticleMeta = {
  id: string;
  filePath: string;
  type: "post" | "note";
  locale: string;
  translationKey: string;
  slug: string;
  title: string;
  date: string;
  published: boolean;
};

function extractArticleMeta(relativePath: string, source: string): ArticleMeta | null {
  if (!relativePath.startsWith("_posts/") && !relativePath.startsWith("_notes/")) {
    return null;
  }

  const parsed = matter(source);
  const title = typeof parsed.data?.title === "string" ? parsed.data.title.trim() : "";
  const dateValue =
    typeof parsed.data?.date === "string"
      ? parsed.data.date.trim()
      : parsed.data?.date instanceof Date
        ? parsed.data.date.toISOString()
        : "";
  const slugValue = typeof parsed.data?.slug === "string" ? parsed.data.slug.trim() : "";
  const translationKeyValue =
    typeof parsed.data?.translationKey === "string" ? parsed.data.translationKey.trim() : "";
  const publishedValue = parsed.data?.published === true;
  const type: "post" | "note" = relativePath.startsWith("_posts/") ? "post" : "note";
  const localeMatch = relativePath.match(/^_(posts|notes)\/([^/]+)\//);
  const locale = localeMatch?.[2] ?? "unknown";
  const slugFromPath = path.posix.basename(relativePath, ".mdx");
  const slug = slugValue || slugFromPath;
  const translationKey = translationKeyValue || slug;
  const id = `${type}:${slug}:${relativePath}`;

  return {
    id,
    filePath: relativePath,
    type,
    locale,
    translationKey,
    slug,
    title: title || slug,
    date: dateValue || "1970-01-01",
    published: publishedValue,
  };
}

export async function buildImageMigrationInventory(): Promise<ImageMigrationInventory> {
  const usageMap = new Map<string, Map<string, MutableUsage>>();
  const articleMetaMap = new Map<string, ArticleMeta>();
  const articleImagePathMap = new Map<string, Set<string>>();

  const mdxRoots = [
    path.join(process.cwd(), "_posts"),
    path.join(process.cwd(), "_notes"),
  ];

  for (const root of mdxRoots) {
    const files = await walkMdxFiles(root);
    for (const fullPath of files) {
      const source = readFileSync(fullPath, "utf8");
      collectFromMdx(source, fullPath, usageMap);
      const relativePath = relativeFromRoot(fullPath);
      const articleMeta = extractArticleMeta(relativePath, source);
      if (articleMeta) {
        articleMetaMap.set(relativePath, articleMeta);
      }
    }
  }

  collectFromPlaceholderJson(usageMap);

  const candidates: ImageCandidate[] = [];

  for (const [imagePath, fileUsage] of usageMap.entries()) {
    const folder = path.posix.dirname(imagePath);
    const fileName = path.posix.basename(imagePath);
    const usageEntries = [...fileUsage.values()]
      .sort((a, b) => a.filePath.localeCompare(b.filePath))
      .map((entry) => ({
        filePath: entry.filePath,
        count: entry.count,
        kinds: [...entry.kinds].sort(),
      }));
    const usageCount = usageEntries.reduce((sum, item) => sum + item.count, 0);
    const publicFilePath = path.join(process.cwd(), "public", imagePath.slice(1));

    candidates.push({
      imagePath,
      folder,
      fileName,
      usageCount,
      usages: usageEntries,
      existsInPublic: existsSync(publicFilePath),
      publicFilePath: path.relative(process.cwd(), publicFilePath).replaceAll(path.sep, "/"),
    });

    for (const usage of usageEntries) {
      const meta = articleMetaMap.get(usage.filePath);
      if (!meta) continue;
      const imageSet = articleImagePathMap.get(meta.filePath) ?? new Set<string>();
      imageSet.add(imagePath);
      articleImagePathMap.set(meta.filePath, imageSet);
    }
  }

  candidates.sort((a, b) => {
    if (a.folder !== b.folder) return a.folder.localeCompare(b.folder);
    return a.fileName.localeCompare(b.fileName);
  });

  const articles: ArticleCandidate[] = [];
  for (const [filePath, imageSet] of articleImagePathMap.entries()) {
    const meta = articleMetaMap.get(filePath);
    if (!meta) continue;
    const imagePaths = [...imageSet].sort((a, b) => a.localeCompare(b));
    articles.push({
      ...meta,
      imageCount: imagePaths.length,
      imagePaths,
    });
  }

  const normalizeDateRank = (value: string): number => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // Primary order: oldest published date first. Tie-breaker: fewer images first.
  articles.sort((a, b) => {
    const dateDiff = normalizeDateRank(a.date) - normalizeDateRank(b.date);
    if (dateDiff !== 0) return dateDiff;
    if (a.imageCount !== b.imageCount) return a.imageCount - b.imageCount;
    return a.slug.localeCompare(b.slug);
  });

  const groupMap = new Map<string, ArticleGroupCandidate>();
  for (const article of articles) {
    const meta = articleMetaMap.get(article.filePath);
    if (!meta) continue;
    const groupId = `${article.type}:${meta.translationKey}`;
    const existing = groupMap.get(groupId);

    if (!existing) {
      groupMap.set(groupId, {
        id: groupId,
        type: article.type,
        translationKey: meta.translationKey,
        title: article.title,
        date: article.date,
        published: article.published,
        imageCount: article.imageCount,
        imagePaths: [...article.imagePaths],
        localeEntries: [
          {
            locale: meta.locale,
            filePath: article.filePath,
            slug: article.slug,
            title: article.title,
            date: article.date,
          },
        ],
      });
      continue;
    }

    existing.localeEntries.push({
      locale: meta.locale,
      filePath: article.filePath,
      slug: article.slug,
      title: article.title,
      date: article.date,
    });

    for (const imagePath of article.imagePaths) {
      if (!existing.imagePaths.includes(imagePath)) existing.imagePaths.push(imagePath);
    }
    existing.imagePaths.sort((a, b) => a.localeCompare(b));
    existing.imageCount = existing.imagePaths.length;

    const existingDate = normalizeDateRank(existing.date);
    const incomingDate = normalizeDateRank(article.date);
    if (incomingDate < existingDate) {
      existing.date = article.date;
      existing.title = article.title;
    }
    existing.published = existing.published || article.published;
  }

  const articleGroups = [...groupMap.values()];
  articleGroups.forEach((group) => {
    group.localeEntries.sort((a, b) => a.locale.localeCompare(b.locale));
  });
  articleGroups.sort((a, b) => {
    const dateDiff = normalizeDateRank(a.date) - normalizeDateRank(b.date);
    if (dateDiff !== 0) return dateDiff;
    if (a.imageCount !== b.imageCount) return a.imageCount - b.imageCount;
    return a.translationKey.localeCompare(b.translationKey);
  });

  const articleImagePathSet = new Set<string>();
  for (const article of articles) {
    for (const imagePath of article.imagePaths) {
      articleImagePathSet.add(imagePath);
    }
  }

  const totalProjectLevelImages = candidates.filter(
    (item) => !articleImagePathSet.has(item.imagePath),
  ).length;

  return {
    candidates,
    articles,
    articleGroups,
    summary: {
      totalUnmigratedImages: articleImagePathSet.size,
      totalUnmigratedArticles: articles.length,
      totalUnmigratedArticleGroups: articleGroups.length,
      totalProjectLevelImages,
    },
    generatedAt: new Date().toISOString(),
  };
}
