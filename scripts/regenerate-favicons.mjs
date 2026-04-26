#!/usr/bin/env node
/**
 * Regenerate raster favicon/PWA assets from public/images/logo/logo.svg.
 *
 * Outputs (overwrites):
 *   - favicon-96x96.png
 *   - apple-touch-icon.png (180x180)
 *   - web-app-manifest-192x192.png
 *   - web-app-manifest-512x512.png
 *   - favicon.ico (multi-size: 16, 32, 48, PNG-encoded)
 *
 * Usage: node scripts/regenerate-favicons.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOGO_DIR = path.join(ROOT, "public", "images", "logo");
const SOURCE_SVG = path.join(LOGO_DIR, "logo.svg");

/** Render the source SVG to a PNG buffer at the given square size. */
async function renderPng(size) {
  const svg = await readFile(SOURCE_SVG);
  return sharp(svg, { density: Math.max(96, size * 4) })
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Build a multi-size ICO file with PNG-encoded entries.
 * ICO file = ICONDIR (6 bytes) + N * ICONDIRENTRY (16 bytes) + N PNG payloads.
 */
function buildIco(pngs /* Array<{size:number, buf:Buffer}> */) {
  const count = pngs.length;
  const headerSize = 6 + 16 * count;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = headerSize;
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // colors in palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buf.length, 8); // size of image data
    e.writeUInt32LE(offset, 12); // offset to image data
    entries.push(e);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

async function main() {
  console.log(`Source: ${SOURCE_SVG}`);

  const targets = [
    { name: "favicon-96x96.png", size: 96 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "web-app-manifest-192x192.png", size: 192 },
    { name: "web-app-manifest-512x512.png", size: 512 },
  ];

  for (const { name, size } of targets) {
    const buf = await renderPng(size);
    const out = path.join(LOGO_DIR, name);
    await writeFile(out, buf);
    console.log(`  ✓ ${name} (${size}x${size}, ${buf.length} bytes)`);
  }

  // favicon.ico — pack 16, 32, 48 px PNGs
  const icoSizes = [16, 32, 48];
  const icoEntries = [];
  for (const size of icoSizes) {
    icoEntries.push({ size, buf: await renderPng(size) });
  }
  const icoBuf = buildIco(icoEntries);
  const icoOut = path.join(LOGO_DIR, "favicon.ico");
  await writeFile(icoOut, icoBuf);
  console.log(`  ✓ favicon.ico (${icoSizes.join(", ")} px, ${icoBuf.length} bytes)`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
