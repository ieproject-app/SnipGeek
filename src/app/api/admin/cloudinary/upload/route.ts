import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { v2 as cloudinary } from "cloudinary";

// ── Cloudinary SDK config (server-side only) ─────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── POST /api/admin/cloudinary/upload ────────────────────────────────────────
//
// Accepts a multipart/form-data body with:
//   file      : image file (binary)
//   slug      : article slug, e.g. "cara-install-wsl"
//   type      : content type — "_posts" | "_notes"
//   category  : (optional) category folder, e.g. "windows11"
//
// Uploads to Cloudinary under:
//   snipgeek/images/{type}/{category?}/{slug}/{original-filename-no-ext}
//
// Returns: { ok: true, url: string, publicId: string, bytes: number }
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth guard ──
  const guard = await requireAdmin(req);
  if (guard) return guard;

  // ── Parse multipart form ──
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body." }, { status: 400 });
  }

  const fileField = formData.get("file");
  const slug = (formData.get("slug") as string | null)?.trim();
  const type = (formData.get("type") as string | null)?.trim();
  const category = (formData.get("category") as string | null)?.trim();

  // ── Validate required fields ──
  if (!fileField || !(fileField instanceof Blob)) {
    return NextResponse.json({ error: "Missing required field: file (must be a Blob/File)." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "Missing required field: slug." }, { status: 400 });
  }
  if (!type || !["_posts", "_notes"].includes(type)) {
    return NextResponse.json({ error: "Field 'type' must be '_posts' or '_notes'." }, { status: 400 });
  }

  // ── Build the Cloudinary folder path ──
  // Pattern: snipgeek/images/{type}/{category?}/{slug}
  const segments = ["snipgeek", "images", type];
  if (category) segments.push(category);
  segments.push(slug);
  const folder = segments.join("/");

  // ── Derive public_id from original filename (strip extension) ──
  const file = fileField as File;
  const originalName = file.name || "image";
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, "");
  // Sanitize: lowercase, replace spaces/special chars with hyphens
  const safePublicId = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";

  const publicId = `${folder}/${safePublicId}`;

  // ── Convert Blob → Buffer for Cloudinary upload ──
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ── Upload ──
  try {
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      bytes: number;
      width: number;
      height: number;
      format: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
          // Preserve uploaded WebP as-is; let Cloudinary handle format via f_auto at delivery
          format: "webp",
          // Store original quality — delivery transformation handles q_auto
          quality: "auto",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed with no result."));
          } else {
            resolve(result as typeof result & { secure_url: string; public_id: string; bytes: number; width: number; height: number; format: string });
          }
        },
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
      folder,
    });
  } catch (error) {
    console.error("[cloudinary/upload POST] Upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
