import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Post, PostFrontmatter } from "@/lib/posts";

function resolveHomeImageSrc(heroImage?: string): string | undefined {
  if (!heroImage) return undefined;

  if (heroImage.startsWith("http") || heroImage.startsWith("/")) {
    return heroImage;
  }

  return PlaceHolderImages.find((item) => item.id === heroImage)?.imageUrl;
}

function toLocalOptimizerUrl(src: string): string {
  if (src.startsWith("/images/")) {
    const params = new URLSearchParams({ src, w: "640", q: "68" });
    return `/api/img?${params.toString()}`;
  }

  if (/^https?:\/\//i.test(src)) {
    try {
      const parsed = new URL(src);
      if (parsed.pathname.startsWith("/images/")) {
        const normalizedSrc = `${parsed.pathname}${parsed.search}`;
        const params = new URLSearchParams({
          src: normalizedSrc,
          w: "640",
          q: "68",
        });
        return `/api/img?${params.toString()}`;
      }
    } catch {
      return src;
    }
  }

  return src;
}

export function getFirstLatestPostImageHref(
  posts: Post<PostFrontmatter>[],
): string | null {
  const linuxTags = new Set(["linux", "ubuntu"]);
  const windowsTags = new Set(["windows", "windows-11"]);

  const featuredLinuxPosts = posts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.featured &&
        post.frontmatter.tags?.some((tag) => linuxTags.has(tag.toLowerCase())),
    )
    .slice(0, 2);

  const featuredWindowsPosts = posts
    .filter(
      (post) =>
        post.frontmatter.published &&
        post.frontmatter.featured &&
        post.frontmatter.tags?.some((tag) => windowsTags.has(tag.toLowerCase())),
    )
    .slice(0, 2);

  const seenSlugs = new Set<string>();
  [...featuredLinuxPosts, ...featuredWindowsPosts].forEach((post) => {
    seenSlugs.add(post.slug);
  });

  const latestPosts = posts
    .filter((post) => post.frontmatter.published && !seenSlugs.has(post.slug))
    .slice(0, 6);

  const firstLatest = latestPosts[0];
  if (!firstLatest) return null;

  const resolvedSrc = resolveHomeImageSrc(firstLatest.frontmatter.heroImage);
  if (!resolvedSrc) return null;

  return toLocalOptimizerUrl(resolvedSrc);
}