import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/api-helpers";
import { buildContentInventory } from "@/lib/content-inventory";

/**
 * GET  /api/admin/index-status
 *   Returns every document in the `indexStatus` collection.
 *
 * POST /api/admin/index-status
 *   Body: { id, url, type, locale, title, status, notes, lastCheckedAt?, lastGSCResult? }
 *   Upserts a document keyed by `id` (SHA-1 hash of the URL).
 */

export type IndexStatusValue =
  | "unknown"
  | "not_submitted"
  | "submitted"
  | "indexed"
  | "excluded";

export type IndexStatusDoc = {
  url: string;
  type: "blog" | "note" | "tool";
  locale: string;
  title?: string;
  status: IndexStatusValue;
  notes?: string;
  lastCheckedAt?: string;
  lastGSCResult?: string;
  updatedAt: string;
};

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const db = getAdminDb();
    const snap = await db.collection("indexStatus").get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as IndexStatusDoc) }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[index-status GET]", error);
    const message = error instanceof Error ? error.message : "Failed to read index status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = (await req.json()) as Partial<IndexStatusDoc> & { id?: string };

    if (!body?.id || !body?.url || !body?.type || !body?.locale) {
      return NextResponse.json(
        { error: "Required: id, url, type, locale." },
        { status: 400 },
      );
    }

    const validStatuses: IndexStatusValue[] = [
      "unknown",
      "not_submitted",
      "submitted",
      "indexed",
      "excluded",
    ];
    const status = (body.status ?? "unknown") as IndexStatusValue;
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    if (body.type === "blog" && (status === "submitted" || status === "indexed")) {
      const inventory = await buildContentInventory({ includeDrafts: true });
      const match = inventory.find((item) => item.id === body.id || item.url === body.url);

      if (match?.hasLocalePair === false) {
        const missingLocalesLabel = match.missingPairLocales?.length
          ? match.missingPairLocales.join(", ")
          : "required locale";

        return NextResponse.json(
          {
            error: `Cannot mark unpaired blog article as ${status}. Missing locale pair: ${missingLocalesLabel}.`,
          },
          { status: 409 },
        );
      }
    }

    const db = getAdminDb();
    const payload = {
      url: body.url,
      type: body.type,
      locale: body.locale,
      status,
      notes: body.notes ?? "",
      updatedAt: new Date().toISOString(),
      ...(body.title ? { title: body.title } : {}),
      ...(body.lastCheckedAt ? { lastCheckedAt: body.lastCheckedAt } : {}),
      ...(body.lastGSCResult ? { lastGSCResult: body.lastGSCResult } : {}),
    };

    await db.collection("indexStatus").doc(body.id).set(payload, { merge: true });

    return NextResponse.json({ ok: true, id: body.id });
  } catch (error) {
    console.error("[index-status POST]", error);
    const message = error instanceof Error ? error.message : "Failed to update index status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
