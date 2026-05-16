import { getSortedPostsData } from "./posts";
import { getSortedNotesData } from "./notes";
import { slugify } from "./slugify";

export type CategoryInfo = {
  slug: string;
  name: string;
  count: number;
  type: "blog" | "note" | "both";
};

type CategoryAccumulator = {
  name: string;
  count: number;
  types: Set<"blog" | "note">;
};

export function normalizeCategorySlug(value: string): string {
  return slugify(decodeURIComponent(value).trim().toLowerCase());
}

export async function getAllCategories(locale: string): Promise<CategoryInfo[]> {
  const posts = await getSortedPostsData(locale);
  const notes = await getSortedNotesData(locale);

  const categoryMap = new Map<string, CategoryAccumulator>();

  const processCategory = (
    rawCategory: string | undefined,
    type: "blog" | "note",
  ) => {
    if (typeof rawCategory !== "string") return;
    const normalizedName = rawCategory.trim();
    if (!normalizedName) return;

    const slug = normalizeCategorySlug(normalizedName);
    if (!slug) return;

    const existing = categoryMap.get(slug) ?? {
      name: normalizedName,
      count: 0,
      types: new Set<"blog" | "note">(),
    };

    if (!existing.name) {
      existing.name = normalizedName;
    }

    existing.count += 1;
    existing.types.add(type);
    categoryMap.set(slug, existing);
  };

  posts.forEach((post) => processCategory(post.frontmatter.category, "blog"));
  notes.forEach((note) => processCategory(note.frontmatter.category, "note"));

  return Array.from(categoryMap.entries())
    .map(([slug, data]) => {
      let type: CategoryInfo["type"] = "note";
      if (data.types.has("blog") && data.types.has("note")) {
        type = "both";
      } else if (data.types.has("blog")) {
        type = "blog";
      }

      return {
        slug,
        name: data.name,
        count: data.count,
        type,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
