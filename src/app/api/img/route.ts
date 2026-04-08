import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
const MIN_WIDTH = 32;
const MAX_WIDTH = 2400;

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const normalizeQuality = (value: string | null) => {
  const quality = parseNumber(value, 68);
  return Math.min(95, Math.max(35, quality));
};

const normalizeWidth = (value: string | null) => {
  const width = parseNumber(value, 640);
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
};

const sanitizeSrc = (src: string | null) => {
  if (!src || !src.startsWith("/images/")) return null;
  if (src.includes("..")) return null;
  return src;
};

export async function GET(request: NextRequest) {
  const src = sanitizeSrc(request.nextUrl.searchParams.get("src"));
  if (!src) {
    return NextResponse.json({ error: "Invalid image source" }, { status: 400 });
  }

  const quality = normalizeQuality(request.nextUrl.searchParams.get("q"));
  const width = normalizeWidth(request.nextUrl.searchParams.get("w"));

  const filePath = path.resolve(PUBLIC_DIR, `.${src}`);
  if (!filePath.startsWith(IMAGES_DIR + path.sep) && filePath !== IMAGES_DIR) {
    return NextResponse.json({ error: "Forbidden image path" }, { status: 403 });
  }

  let inputBuffer: Buffer;
  try {
    inputBuffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  try {
    const optimized = await sharp(inputBuffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(optimized, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(inputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
}
