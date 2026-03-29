import { NextResponse } from "next/server";
import { getAllTags } from "@/lib/tags";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch tags from the primary locale (en) — tags are locale-agnostic in SnipGeek
  const tags = await getAllTags("en");

  return NextResponse.json({ tags });
}
