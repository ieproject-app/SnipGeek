#!/usr/bin/env node
/**
 * Pre-deploy check script for SnipGeek.
 *
 * Checks performed:
 *  1. Image file size — all images under public/images must be <= MAX_IMAGE_KB
 *  2. MDX frontmatter — required fields must be present in every published post/note
 *  3. TypeScript — runs tsc --noEmit to catch type errors
 *
 * Exit code 0 = all checks passed, exit code 1 = one or more checks failed.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const PUBLIC_IMAGES_DIR = join(ROOT, "public", "images");
const POSTS_DIR = join(ROOT, "_posts");
const NOTES_DIR = join(ROOT, "_notes");

const MAX_IMAGE_KB = 130;
const MAX_IMAGE_BYTES = MAX_IMAGE_KB * 1024;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"]);

const REQUIRED_POST_FIELDS = ["title", "date", "description", "translationKey", "published"];
const REQUIRED_NOTE_FIELDS = ["title", "date", "description", "translationKey", "published"];

const isStrict = process.argv.includes("--strict");
let hasErrors = false;
let hasWarnings = false;

function error(msg) {
  console.error(`  ✗ ${msg}`);
  hasErrors = true;
}

function warn(msg) {
  console.warn(`  ⚠ ${msg}`);
  hasWarnings = true;
  if (isStrict) hasErrors = true;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function section(title) {
  console.log(`\n▶ ${title}`);
}

// ─── Helper: collect all files recursively ───────────────────────────────────
function walkDir(dir, filterFn) {
  const results = [];
  if (!statSync(dir, { throwIfNoEntry: false })) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, filterFn));
    } else if (entry.isFile() && filterFn(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Helper: parse frontmatter from MDX (gray-matter not imported; manual) ───
function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawValue = line.slice(colonIdx + 1).trim();
    if (key) fm[key] = rawValue;
  }
  return fm;
}

// ─── CHECK 1: Image file sizes ───────────────────────────────────────────────
section(`Image size check (max ${MAX_IMAGE_KB} KB)`);

const imageFiles = walkDir(PUBLIC_IMAGES_DIR, (name) =>
  IMAGE_EXTENSIONS.has(extname(name).toLowerCase()),
);

let imageSizeErrors = 0;
for (const filePath of imageFiles) {
  const { size } = statSync(filePath);
  if (size > MAX_IMAGE_BYTES) {
    const kb = (size / 1024).toFixed(1);
    error(`${relative(ROOT, filePath)} — ${kb} KB (limit: ${MAX_IMAGE_KB} KB)`);
    imageSizeErrors++;
  }
}

if (imageSizeErrors === 0) {
  ok(`All ${imageFiles.length} images are within the ${MAX_IMAGE_KB} KB limit`);
} else {
  error(`${imageSizeErrors} image(s) exceed the ${MAX_IMAGE_KB} KB limit — compress them before deploying`);
}

// ─── CHECK 2: MDX frontmatter completeness ───────────────────────────────────
section("MDX frontmatter check");

function checkMdxFiles(dir, requiredFields, label) {
  const mdxFiles = walkDir(dir, (name) => name.endsWith(".mdx"));
  let mdxErrors = 0;

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, "utf8");
    const fm = parseFrontmatter(content);

    if (fm.published !== "true") continue;

    for (const field of requiredFields) {
      if (!fm[field] || fm[field] === "") {
        error(`${relative(ROOT, filePath)} — missing required field: "${field}"`);
        mdxErrors++;
      }
    }

    if (fm.title && (fm.title.length < 10 || fm.title.length > 80)) {
      warn(
        `${relative(ROOT, filePath)} — title length ${fm.title.length} chars (recommended: 10–80)`,
      );
    }

    if (fm.description && (fm.description.length < 50 || fm.description.length > 165)) {
      warn(
        `${relative(ROOT, filePath)} — description length ${fm.description.length} chars (recommended: 50–165, use --strict to block deploy)`,
      );
    }
  }

  if (mdxErrors === 0) {
    ok(`All ${mdxFiles.length} ${label} MDX files have valid frontmatter`);
  }

  return mdxErrors;
}

checkMdxFiles(POSTS_DIR, REQUIRED_POST_FIELDS, "post");
checkMdxFiles(NOTES_DIR, REQUIRED_NOTE_FIELDS, "note");

// ─── CHECK 3: TypeScript ──────────────────────────────────────────────────────
section("TypeScript check (tsc --noEmit)");

try {
  execSync("npx tsc --noEmit", { cwd: ROOT, stdio: "pipe" });
  ok("No TypeScript errors");
} catch (e) {
  const output = e.stdout?.toString() || e.stderr?.toString() || "";
  console.error(output.trim());
  warn("TypeScript errors found (use --strict to block deploy on TS errors)");
}

// ─── Result ───────────────────────────────────────────────────────────────────
if (hasErrors) {
  console.error("\n❌ Pre-deploy check FAILED — fix the errors above before deploying.\n");
  process.exit(1);
} else if (hasWarnings) {
  console.warn(`\n⚠  Pre-deploy check passed with warnings. Run with --strict to treat warnings as errors.\n`);
  process.exit(0);
} else {
  console.log("\n✅ All pre-deploy checks passed!\n");
  process.exit(0);
}
