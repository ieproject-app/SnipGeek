import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "_posts");
const notesDirectory = path.join(process.cwd(), "_notes");

// Recursively collect every .mdx file under a directory.
function getAllMdxFiles(dir: string): { filePath: string; slug: string }[] {
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

function extractTagsFromDirectory(dir: string): Map<string, { files: string[]; count: number }> {
  const mdxFiles = getAllMdxFiles(dir);
  const tagMap = new Map<string, { files: string[]; count: number }>();

  for (const { filePath } of mdxFiles) {
    try {
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContents);
      const tags = data.tags as string[] | undefined;

      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          if (typeof tag !== "string") continue;
          const normalizedTag = tag.trim().toLowerCase();
          if (!normalizedTag) continue;

          const existing = tagMap.get(normalizedTag) || { files: [], count: 0 };
          existing.files.push(filePath);
          existing.count += 1;
          tagMap.set(normalizedTag, existing);
        }
      }
    } catch (err) {
      console.error("Error processing file:", filePath, err);
    }
  }

  return tagMap;
}

function main() {
  console.log("🔍 Validating tags...\n");

  const postsTags = extractTagsFromDirectory(postsDirectory);
  const notesTags = extractTagsFromDirectory(notesDirectory);

  // Combine all tags
  const allTags = new Map<string, { files: string[]; count: number; type: string[] }>();

  postsTags.forEach((data, tag) => {
    allTags.set(tag, { ...data, type: ["blog"] });
  });

  notesTags.forEach((data, tag) => {
    const existing = allTags.get(tag);
    if (existing) {
      existing.files.push(...data.files);
      existing.count += data.count;
      existing.type.push("note");
    } else {
      allTags.set(tag, { ...data, type: ["note"] });
    }
  });

  // Check for potential issues
  const issues: string[] = [];

  // 1. Tags with inconsistent casing
  const tagCaseMap = new Map<string, string[]>();
  allTags.forEach((_, tag) => {
    const lower = tag.toLowerCase();
    if (!tagCaseMap.has(lower)) {
      tagCaseMap.set(lower, []);
    }
    tagCaseMap.get(lower)!.push(tag);
  });

  tagCaseMap.forEach((variants, lowerTag) => {
    const uniqueVariants = [...new Set(variants)];
    if (uniqueVariants.length > 1) {
      issues.push(`⚠️  Tag casing inconsistency: "${uniqueVariants.join('" vs "')}"`);
    }
  });

  // 2. Tags with very low count (might be typos)
  const lowCountTags = Array.from(allTags.entries())
    .filter(([_, data]) => data.count === 1)
    .map(([tag, data]) => ({ tag, files: data.files }));

  if (lowCountTags.length > 0) {
    issues.push(`⚠️  Tags with only 1 article (possible typos):\n${lowCountTags.map(t => `   - "${t.tag}" in ${t.files[0]}`).join("\n")}`);
  }

  // 3. Check for common typos
  const commonTypos = [
    "aplikasi", "application", // Should use consistent naming
    "windwos", "windos", "ubunut", "ubunntu", // Common OS typos
  ];

  const foundTypos = Array.from(allTags.keys()).filter(tag =>
    commonTypos.some(typo => tag.includes(typo))
  );

  if (foundTypos.length > 0) {
    issues.push(`⚠️  Possible typos detected: ${foundTypos.map(t => `"${t}"`).join(", ")}`);
  }

  // Print results
  console.log(`📊 Total unique tags: ${allTags.size}`);
  console.log(`📝 Total tag occurrences: ${Array.from(allTags.values()).reduce((sum, d) => sum + d.count, 0)}`);

  if (issues.length > 0) {
    console.log("\n⚠️  Issues found:\n");
    issues.forEach(issue => console.log(issue));
    console.log("\n❌ Validation failed");
    process.exit(1);
  } else {
    console.log("\n✅ All tags are valid");
    process.exit(0);
  }
}

main();
