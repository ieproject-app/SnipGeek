import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";

const INDEXNOW_KEY = "a8f4c92b7d1e635f80b2a1c4e7d9f36b";
const HOST = "snipgeek.com";
const KEY_LOCATION = `https://${HOST}/verification/${INDEXNOW_KEY}.txt`;

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const urlList = body.urlList;

    if (!Array.isArray(urlList) || urlList.length === 0) {
      return NextResponse.json({ error: "urlList must be a non-empty array of strings." }, { status: 400 });
    }

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    };

    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // IndexNow API returns 200 OK or 202 Accepted on success
    if (res.status === 200 || res.status === 202) {
      return NextResponse.json({ ok: true, submitted: urlList.length });
    }

    // Attempt to parse error response if not successful
    const text = await res.text();
    console.error("[indexnow POST] Bing API Error:", res.status, text);
    
    return NextResponse.json({ error: `IndexNow API Error: ${res.status} ${text}` }, { status: res.status });
  } catch (error) {
    console.error("[indexnow POST]", error);
    const message = error instanceof Error ? error.message : "Failed to submit to IndexNow.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
