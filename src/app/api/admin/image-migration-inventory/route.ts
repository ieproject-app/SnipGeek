import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { buildImageMigrationInventory } from "@/lib/admin-image-migration";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const inventory = await buildImageMigrationInventory();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("[image-migration-inventory]", error);
    const message =
      error instanceof Error ? error.message : "Failed to build image migration inventory.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
