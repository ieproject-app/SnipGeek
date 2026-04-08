#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = path.resolve(process.cwd(), "public/images");
const MIN_BYTES = 250 * 1024;
const DEFAULT_EXTS = new Set([".webp", ".jpg", ".jpeg"]);
const INCLUDE_PNG = process.argv.includes("--include-png");
const CONVERT_PNG_TO_WEBP = process.argv.includes("--convert-png-to-webp");
if (INCLUDE_PNG) DEFAULT_EXTS.add(".png");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(abs);
      return [abs];
    }),
  );
  return files.flat();
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function fmtPct(before, after) {
  if (before === 0) return "0.00%";
  const pct = ((before - after) / before) * 100;
  return `${pct.toFixed(2)}%`;
}

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = await fs.stat(filePath);
  const before = stat.size;

  if (!DEFAULT_EXTS.has(ext) || before < MIN_BYTES) {
    return { skipped: true, before, after: before, filePath, reason: "filtered" };
  }

  const input = sharp(filePath, { failOn: "none" });
  let buffer;

  if (ext === ".webp") {
    buffer = await input
      .webp({ quality: 72, effort: 6, smartSubsample: true })
      .toBuffer();
  } else if (ext === ".jpg" || ext === ".jpeg") {
    buffer = await input
      .jpeg({ quality: 76, mozjpeg: true, progressive: true })
      .toBuffer();
  } else if (ext === ".png") {
    buffer = await input
      .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 9, palette: false })
      .toBuffer();
  } else {
    return { skipped: true, before, after: before, filePath, reason: "unsupported" };
  }

  const after = buffer.length;

  // Avoid noisy rewrites when gain is tiny.
  const minGain = Math.max(8 * 1024, before * 0.03);
  if (before - after < minGain) {
    return { skipped: true, before, after: before, filePath, reason: "small-gain" };
  }

  await fs.writeFile(filePath, buffer);
  return { skipped: false, before, after, filePath, reason: "optimized" };
}

async function convertPngToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".png") {
    return { skipped: true, before: 0, after: 0, filePath, reason: "not-png" };
  }

  const stat = await fs.stat(filePath);
  const before = stat.size;
  if (before < MIN_BYTES) {
    return { skipped: true, before, after: before, filePath, reason: "filtered" };
  }

  const webpPath = filePath.replace(/\.png$/i, ".webp");

  const webpBuffer = await sharp(filePath, { failOn: "none" })
    .webp({ quality: 72, effort: 6, smartSubsample: true })
    .toBuffer();

  const after = webpBuffer.length;
  const minGain = Math.max(8 * 1024, before * 0.03);
  if (before - after < minGain) {
    return { skipped: true, before, after: before, filePath, reason: "small-gain" };
  }

  await fs.writeFile(webpPath, webpBuffer);
  return {
    skipped: false,
    before,
    after,
    filePath,
    reason: "converted",
    outputPath: webpPath,
  };
}

async function main() {
  const allFiles = await walk(ROOT_DIR);
  const results = [];

  if (CONVERT_PNG_TO_WEBP) {
    for (const filePath of allFiles) {
      try {
        const result = await convertPngToWebp(filePath);
        results.push(result);
        if (!result.skipped) {
          const output = result.outputPath || filePath;
          console.log(
            `converted ${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), output)} | ${fmtKB(result.before)} -> ${fmtKB(result.after)} (${fmtPct(result.before, result.after)})`,
          );
        }
      } catch (error) {
        console.error(`error ${path.relative(process.cwd(), filePath)}:`, error);
      }
    }

    const converted = results.filter((r) => !r.skipped);
    const totalBefore = converted.reduce((sum, r) => sum + r.before, 0);
    const totalAfter = converted.reduce((sum, r) => sum + r.after, 0);

    console.log("\n=== PNG to WebP Summary ===");
    console.log(`scanned: ${results.length}`);
    console.log(`converted: ${converted.length}`);
    console.log(`saved: ${fmtKB(totalBefore - totalAfter)} (${fmtPct(totalBefore, totalAfter)})`);
    return;
  }

  for (const filePath of allFiles) {
    try {
      const result = await optimizeFile(filePath);
      results.push(result);
      if (!result.skipped) {
        console.log(
          `optimized ${path.relative(process.cwd(), filePath)} | ${fmtKB(result.before)} -> ${fmtKB(result.after)} (${fmtPct(result.before, result.after)})`,
        );
      }
    } catch (error) {
      console.error(`error ${path.relative(process.cwd(), filePath)}:`, error);
    }
  }

  const optimized = results.filter((r) => !r.skipped);
  const totalBefore = optimized.reduce((sum, r) => sum + r.before, 0);
  const totalAfter = optimized.reduce((sum, r) => sum + r.after, 0);

  console.log("\n=== Image Compression Summary ===");
  console.log(`scanned: ${results.length}`);
  console.log(`optimized: ${optimized.length}`);
  console.log(`saved: ${fmtKB(totalBefore - totalAfter)} (${fmtPct(totalBefore, totalAfter)})`);
  console.log(`mode: ${INCLUDE_PNG ? "webp,jpg,jpeg,png" : "webp,jpg,jpeg"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
