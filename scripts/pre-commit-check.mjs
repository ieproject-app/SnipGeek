#!/usr/bin/env node
/**
 * Git pre-commit hook for SnipGeek.
 *
 * Checks if staged MDX files reference images that are NOT staged.
 * This prevents accidentally committing a post without its images.
 *
 * What it does:
 *  1. Find all staged .mdx files
 *  2. Extract image paths from frontmatter (heroImage) and body (![alt](/images/...), src="/images/...")
 *  3. Check if those image files exist on disk but are NOT staged
 *  4. Also check if the image directory has any untracked files
 *  5. Warn (or block) if images are missing from the commit
 *
 * Exit code 0 = OK, exit code 1 = blocked.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

// ── Helpers ──────────────────────────────────────────────────────────────────

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function getStagedFiles() {
  const out = git("git diff --cached --name-only --diff-filter=ACM");
  return out ? out.split("\n").map((f) => f.trim()).filter(Boolean) : [];
}

function getUntrackedFiles() {
  const out = git("git ls-files --others --exclude-standard");
  return out ? out.split("\n").map((f) => f.trim()).filter(Boolean) : [];
}

function getUnstagedModified() {
  const out = git("git diff --name-only");
  return out ? out.split("\n").map((f) => f.trim()).filter(Boolean) : [];
}

function walkDir(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      results.push(relative(ROOT, fullPath));
    }
  }
  return results;
}

// ── Extract image references from MDX ────────────────────────────────────────

function extractImagePaths(mdxContent) {
  const paths = new Set();

  // 1. Frontmatter heroImage: /images/...
  const heroMatch = mdxContent.match(/^heroImage:\s*['"]?([^\s'"]+)/m);
  if (heroMatch) paths.add(heroMatch[1]);

  // 2. Markdown images: ![alt](/images/...)
  const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = mdImgRegex.exec(mdxContent)) !== null) {
    paths.add(m[1]);
  }

  // 3. JSX src: src="/images/..." or src={"/images/..."}
  const srcRegex = /src=["'{]?["']?([^"'\s}]+\.(?:webp|png|jpg|jpeg|gif|avif|svg))/gi;
  while ((m = srcRegex.exec(mdxContent)) !== null) {
    paths.add(m[1]);
  }

  // Normalize: all should map to public/... on disk
  const normalized = new Set();
  for (const p of paths) {
    const clean = p.replace(/^\//, "");
    // Image paths in MDX are like /images/... which maps to public/images/...
    if (clean.startsWith("images/")) {
      normalized.add("public/" + clean);
    }
  }
  return normalized;
}

// ── Detect related image directories ─────────────────────────────────────────

function guessImageDirs(imagePaths) {
  const dirs = new Set();
  for (const p of imagePaths) {
    dirs.add(dirname(p));
  }
  return dirs;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const staged = new Set(getStagedFiles());
const untracked = new Set(getUntrackedFiles());
const unstaged = new Set(getUnstagedModified());

const stagedMdx = [...staged].filter((f) =>
  f.endsWith(".mdx") && (f.startsWith("_posts/") || f.startsWith("_notes/") || f.startsWith("_pages/"))
);

if (stagedMdx.length === 0) {
  process.exit(0); // No MDX files staged, nothing to check
}

let warnings = 0;

console.log("\n🔍 Pre-commit: checking images for staged MDX files...\n");

for (const mdxFile of stagedMdx) {
  const content = readFileSync(join(ROOT, mdxFile), "utf8");
  const imagePaths = extractImagePaths(content);

  if (imagePaths.size === 0) continue;

  // Check each referenced image
  const missingFromStage = [];
  for (const imgPath of imagePaths) {
    const onDisk = existsSync(join(ROOT, imgPath));
    const isStaged = staged.has(imgPath);

    if (onDisk && !isStaged) {
      missingFromStage.push(imgPath);
    }
  }

  // Also check: are there untracked files in the same image directories?
  const imgDirs = guessImageDirs(imagePaths);
  const untrackedInDirs = [];
  for (const dir of imgDirs) {
    const fullDir = join(ROOT, dir);
    if (!existsSync(fullDir)) continue;
    const allFiles = walkDir(fullDir);
    for (const f of allFiles) {
      if (untracked.has(f) && !imagePaths.has(f)) {
        untrackedInDirs.push(f);
      }
    }
  }

  if (missingFromStage.length > 0 || untrackedInDirs.length > 0) {
    console.log(`  📄 ${mdxFile}`);

    for (const img of missingFromStage) {
      console.log(`     ✗ Referenced but NOT staged: ${img}`);
      warnings++;
    }

    for (const img of untrackedInDirs) {
      console.log(`     ⚠ Untracked file in image dir: ${img}`);
      warnings++;
    }

    console.log("");
  }
}

if (warnings > 0) {
  console.log(`❌ Found ${warnings} image(s) that should probably be staged.`);
  console.log(`   Run: git add public/images/... to include them.`);
  console.log(`   Or skip this check with: git commit --no-verify\n`);
  process.exit(1);
} else {
  console.log("✅ All referenced images are staged. Good to go!\n");
  process.exit(0);
}
