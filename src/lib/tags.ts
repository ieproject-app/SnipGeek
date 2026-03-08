import { getSortedPostsData } from "./posts";
import { getSortedNotesData } from "./notes";

export type TagInfo = {
    name: string;
    count: number;
    type: "blog" | "note" | "both";
};

export async function getAllTags(locale: string): Promise<TagInfo[]> {
    const posts = await getSortedPostsData(locale);
    const notes = await getSortedNotesData(locale);

    const tagMap = new Map<string, { count: number; types: Set<string> }>();

    posts.forEach((post) => {
        if (post.frontmatter.tags) {
            post.frontmatter.tags.forEach((tag) => {
                const existing = tagMap.get(tag) || { count: 0, types: new Set() };
                existing.count += 1;
                existing.types.add("blog");
                tagMap.set(tag, existing);
            });
        }
    });

    notes.forEach((note) => {
        if (note.frontmatter.tags) {
            note.frontmatter.tags.forEach((tag) => {
                const existing = tagMap.get(tag) || { count: 0, types: new Set() };
                existing.count += 1;
                existing.types.add("note");
                tagMap.set(tag, existing);
            });
        }
    });

    return Array.from(tagMap.entries())
        .map(([name, data]) => ({
            name,
            count: data.count,
            type: data.types.has("blog") && data.types.has("note")
                ? "both"
                : data.types.has("blog")
                    ? "blog"
                    : "note" as TagInfo["type"]
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
