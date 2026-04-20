import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { buildContentInventory } from "@/lib/content-inventory";

/**
 * GET /api/admin/content-inventory
 *
 * Admin-only. Returns the full inventory of blog/note/tool URLs derived from
 * the filesystem + tools-registry. Drafts are included so they show up in the
 * dashboard (marked with `draft: true`), but tools that require auth keep
 * their `requiresAuth` flag so the UI can distinguish them.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const items = await buildContentInventory({ includeDrafts: true });
    return NextResponse.json({ items, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[content-inventory]", error);
    const message = error instanceof Error ? error.message : "Failed to build inventory.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
