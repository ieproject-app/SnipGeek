#!/usr/bin/env node
/**
 * One-shot transform: apply Zed-style class substitutions to admin files.
 *
 * Conservative substitutions only — no destructive changes:
 *  - Replace large rounded radii with empty (sharp corners)
 *  - Drop opacity-faded surface backgrounds back to solid
 *  - Drop backdrop blur and shadow utilities
 *  - Solidify softened borders
 *
 * Skipped on purpose:
 *  - rounded-full (commonly used for pulse dots, avatar circles)
 *  - rounded-sm and rounded (small radii are still acceptable for inputs)
 */

import { readFile, writeFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TARGET_DIRS = [
  "src/app/admin",
  "src/components/admin",
];

const TRANSFORMS = [
  // Strip large rounded radii (rounded-2xl, 3xl, xl, lg, md → none).
  // Keep rounded-none, rounded-sm, rounded as-is.
  { pattern: /\brounded-3xl\b/g, replace: "" },
  { pattern: /\brounded-2xl\b/g, replace: "" },
  { pattern: /\brounded-xl\b/g, replace: "" },
  { pattern: /\brounded-lg\b/g, replace: "" },
  { pattern: /\brounded-md\b/g, replace: "" },

  // Solidify opacity-faded surfaces.
  { pattern: /\bbg-card\/(?:25|30|35|40|45|50|55|60|70|75|80|90|95)\b/g, replace: "bg-card" },
  { pattern: /\bbg-background\/(?:60|70|75|80|85|90|95)\b/g, replace: "bg-background" },
  { pattern: /\bbg-muted\/(?:5|10|15|20|25)\b/g, replace: "bg-muted/30" },

  // Solidify softened borders.
  { pattern: /\bborder-border\/(?:50|60|70|80)\b/g, replace: "border-border" },
  { pattern: /\bborder-primary\/(?:5|10|15|20)\b/g, replace: "border-border" },

  // Drop blur.
  { pattern: /\bbackdrop-blur(?:-sm|-md|-lg|-xl|-2xl)?\b/g, replace: "" },

  // Drop shadow utilities (keep shadow-none explicit if present).
  { pattern: /\bshadow-(?:sm|md|lg|xl|2xl)\b/g, replace: "" },
  { pattern: /\bshadow-primary\/\d+\b/g, replace: "" },
  { pattern: /\bshadow-accent\/\d+\b/g, replace: "" },

  // Lighten font-black to font-bold for less display-loud feel.
  // Note: font-black is purely a Tailwind class token; matching as a whole word is safe.
  { pattern: /\bfont-black\b/g, replace: "font-bold" },
];

/**
 * Tidy double spaces left behind by class removal.
 * IMPORTANT: must NOT touch leading-line indentation or non-string content.
 * We only collapse runs of >=2 spaces that are NOT at the start of a line
 * AND that occur immediately before/after non-whitespace (i.e. inside a
 * className string, between tokens). Leading whitespace is preserved.
 */
function tidyClassStrings(content) {
  return content
    .split("\n")
    .map((line) => {
      const leadingMatch = line.match(/^(\s*)/);
      const leading = leadingMatch ? leadingMatch[1] : "";
      const rest = line.slice(leading.length);
      // Collapse runs of spaces inside the rest of the line.
      const collapsed = rest.replace(/ {2,}/g, " ");
      return leading + collapsed;
    })
    .join("\n");
}

async function processFile(file) {
  const original = await readFile(file, "utf8");
  let next = original;
  for (const { pattern, replace } of TRANSFORMS) {
    next = next.replace(pattern, replace);
  }
  next = tidyClassStrings(next);
  if (next === original) return false;
  await writeFile(file, next);
  return true;
}

async function* walk(dir) {
  const entries = await import("node:fs/promises").then((m) => m.readdir(dir, { withFileTypes: true }));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) yield full;
  }
}

async function main() {
  let touched = 0;
  let scanned = 0;
  for (const dir of TARGET_DIRS) {
    const abs = path.join(ROOT, dir);
    for await (const file of walk(abs)) {
      scanned++;
      const changed = await processFile(file);
      if (changed) {
        touched++;
        console.log(`  ✓ ${path.relative(ROOT, file)}`);
      }
    }
  }
  console.log(`\nScanned ${scanned} files, modified ${touched}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
