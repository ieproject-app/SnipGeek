#!/usr/bin/env node
/**
 * Git pre-commit hook for SnipGeek.
 *
 * Checks if staged MDX files reference images that are NOT staged AND NOT
 * already tracked by git. This prevents accidentally committing a post without
 * its images, while avoiding false positives for images that already exist in
 * the repository (e.g. when only updating tags/frontmatter on existing posts).
 *
 * What it does:
 *  1. Find all staged .mdx files
 *  2. Extract image paths from frontmatter (heroImage) and body (![alt](/images/...), src="/images/...")
 *  3. Check if those image files exist on disk but are NEITHER staged NOR already tracked in git
 *  4. Also check if the image directory has any untracked files
 *  5. Warn (or block) if images are missing from the commit
 *
 * Exit code 0 = OK, exit code 1 = blocked.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
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

/**
 * Returns all files already tracked by git (committed at any point in history).
 * These files don't need to be re-staged — they're already in the repo.
 */
function getTrackedFiles() {
  const out = git("git ls-files");
  return out ? new Set(out.split("\n").map((f) => f.trim()).filter(Boolean)) : new Set();
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
const tracked = getTrackedFiles(); // files already committed in git history

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

  // Check each referenced image.
  // An image is only a problem if it exists on disk but is NEITHER:
  //   a) staged in this commit, NOR
  //   b) already tracked in git (committed in a previous commit)
  const missingFromStage = [];
  for (const imgPath of imagePaths) {
    const onDisk = existsSync(join(ROOT, imgPath));
    const isStaged = staged.has(imgPath);
    const isTracked = tracked.has(imgPath);

    if (onDisk && !isStaged && !isTracked) {
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
}

// ── Bilingual filename sync check ─────────────────────────────────────────────
// Rule: EN and ID versions of the same post MUST have identical filenames.
// We check every staged _posts/ MDX file: if its translationKey matches a file
// in the other locale directory, those two files must share the same basename.

/**
 * Recursively find all .mdx files under dir.
 * Returns [{ filePath, slug }] where slug = basename without .mdx extension.
 */
function getAllMdxFilesInDir(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMdxFilesInDir(full));
    } else if (entry.name.endsWith(".mdx")) {
      results.push({ filePath: full, slug: entry.name.replace(/\.mdx$/, "") });
    }
  }
  return results;
}

/**
 * Extract translationKey from MDX frontmatter (fast regex, no YAML parser needed).
 */
function extractTranslationKey(content) {
  const m = content.match(/^translationKey:\s*['"]?([^\s'"]+)['"]?/m);
  return m ? m[1].trim() : null;
}

function isPublished(content) {
  const m = content.match(/^published:\s*(true|false)\s*$/m);
  return m ? m[1] === "true" : false;
}

const POSTS_DIR = join(ROOT, "_posts");
const LOCALES = ["en", "id"];

const stagedPosts = [...staged].filter(
  (f) => f.startsWith("_posts/") && f.endsWith(".mdx"),
);

let bilingualErrors = 0;
let unpublishedErrors = 0;
let missingPairErrors = 0;

if (stagedPosts.length > 0) {
  console.log("🌐 Pre-commit: checking staged post publish + bilingual rules...\n");

  // Build a lookup: translationKey → { locale, slug, filePath } for all on-disk posts
  const diskIndex = new Map(); // translationKey → Map<locale, slug>
  for (const locale of LOCALES) {
    const localeDir = join(POSTS_DIR, locale);
    for (const { filePath, slug } of getAllMdxFilesInDir(localeDir)) {
      const content = readFileSync(filePath, "utf8");
      const key = extractTranslationKey(content);
      if (!key) continue;
      if (!diskIndex.has(key)) diskIndex.set(key, new Map());
      diskIndex.get(key).set(locale, slug);
    }
  }

  for (const stagedFile of stagedPosts) {
    // Determine locale from path: _posts/<locale>/...
    const parts = stagedFile.split("/");
    const locale = parts[1]; // _posts / <locale> / ...
    if (!LOCALES.includes(locale)) continue;

    const content = readFileSync(join(ROOT, stagedFile), "utf8");
    const translationKey = extractTranslationKey(content);
    const published = isPublished(content);

    if (!published) {
      console.log(`  ❌ Unpublished post cannot be committed: ${stagedFile}`);
      console.log("     Fix: set published: true only when the article is ready to ship.\n");
      unpublishedErrors++;
    }

    if (!translationKey) continue;

    const stagedSlug = basename(stagedFile, ".mdx");
    const byLocale = diskIndex.get(translationKey);
    if (!byLocale) continue;

    const missingLocales = LOCALES.filter((targetLocale) => !byLocale.has(targetLocale));
    if (missingLocales.length > 0) {
      console.log(`  ❌ Missing locale pair detected in: ${stagedFile}`);
      console.log(`     translationKey: "${translationKey}"`);
      console.log(`     Missing locale(s): ${missingLocales.join(", ")}`);
      console.log("     Fix: add the counterpart article with the same filename in the missing locale directory.\n");
      missingPairErrors++;
    }

    // Check every other locale that has a matching translationKey on disk
    for (const [otherLocale, otherSlug] of byLocale) {
      if (otherLocale === locale) continue;
      if (otherSlug !== stagedSlug) {
        console.log(`  ❌ Filename mismatch detected in: ${stagedFile}`);
        console.log(`     translationKey: "${translationKey}"`);
        console.log(`     ${locale.padEnd(3)} filename : ${stagedSlug}.mdx`);
        console.log(`     ${otherLocale.padEnd(3)} filename : ${otherSlug}.mdx`);
        console.log(`     Fix: rename one file so both locales share the same filename.\n`);
        bilingualErrors++;
      }
    }
  }

  if (bilingualErrors === 0 && unpublishedErrors === 0 && missingPairErrors === 0) {
    console.log("✅ All post publish & bilingual rules passed.\n");
  }
}

const totalErrors = bilingualErrors + unpublishedErrors + missingPairErrors;

if (totalErrors > 0) {
  if (bilingualErrors > 0) console.log(`❌ ${bilingualErrors} bilingual filename mismatch(es) found.`);
  if (unpublishedErrors > 0) console.log(`❌ ${unpublishedErrors} unpublished post(s) found.`);
  if (missingPairErrors > 0) console.log(`❌ ${missingPairErrors} missing locale pair(s) found.`);
  
  console.log(`   Please fix these issues before committing.`);
  console.log(`   Or skip this check with: git commit --no-verify\n`);
  process.exit(1);
}

process.exit(0);
