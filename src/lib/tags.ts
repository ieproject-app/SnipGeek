import { getSortedPostsData } from "./posts";
import { getSortedNotesData } from "./notes";

export type TagInfo = {
    name: string;
    count: number;
    type: "blog" | "note" | "both";
};

export const INDEXABLE_TAGS = [
    "windows",
    "windows-11",
    "nextjs",
    "debugging",
    "ubuntu",
    "ubuntu-25-10",
    "android",
    "hardware",
    "tutorial",
    "linux",
    "firebase",
    "printer",
    "driver",
    "ram",
    "version-control",
    "github",
    "git",
    "network",
    "security",
    "performance",
    "dual-boot",
    "grub",
    "uefi",
    "secure-boot",
    "partition",
    "recovery",
] as const;

export function shouldIndexTag(tag: string, count: number) {
    const normalizedTag = tag.toLowerCase();
    // Never index empty tag archives even if they are strategically listed.
    if (count <= 0) {
        return false;
    }

    if (INDEXABLE_TAGS.includes(normalizedTag as (typeof INDEXABLE_TAGS)[number])) {
        return true;
    }

    return count >= 3;
}

export async function getAllTags(locale: string): Promise<TagInfo[]> {
    const posts = await getSortedPostsData(locale);
    const notes = await getSortedNotesData(locale);

    const tagMap = new Map<string, { count: number; types: Set<string> }>();

    const processTags = (tags: any[] | undefined, type: "blog" | "note") => {
        if (tags && Array.isArray(tags)) {
            tags.forEach((tag) => {
                if (typeof tag !== "string") return;
                const normalizedTag = tag.trim().toLowerCase();
                if (!normalizedTag) return;

                const existing = tagMap.get(normalizedTag) || { count: 0, types: new Set() };
                existing.count += 1;
                existing.types.add(type);
                tagMap.set(normalizedTag, existing);
            });
        }
    };

    posts.forEach((post) => processTags(post.frontmatter.tags, "blog"));
    notes.forEach((note) => processTags(note.frontmatter.tags, "note"));

    return Array.from(tagMap.entries())
        .map(([name, data]) => ({
            name: name, // Using the normalized lowercase name
            count: data.count,
            type: data.types.has("blog") && data.types.has("note")
                ? "both"
                : data.types.has("blog")
                    ? "blog"
                    : "note" as TagInfo["type"]
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
