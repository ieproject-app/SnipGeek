import { createSign } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/api-helpers";
import type {
  IndexStatusDoc,
  IndexStatusValue,
} from "@/app/api/admin/index-status/route";
import { buildContentInventory } from "@/lib/content-inventory";

/**
 * POST /api/admin/gsc/inspect
 *   Body: { id, url, force?: boolean }
 *
 * Calls the Google Search Console URL Inspection API to check indexing
 * status for a single URL, then caches the result in Firestore
 * (`indexStatus/{id}`) for 3 days to keep quota usage low.
 *
 * The actual API call is behind an env-guarded code path. When the service
 * account is not configured, this route responds with 501 Not Implemented
 * so the client can fall back to manual status updates.
 *
 * Required env (for full integration):
 *   - GSC_SERVICE_ACCOUNT_JSON  (base64 of service account JSON)
 *   - GSC_SITE_URL              (e.g. "https://snipgeek.com/" — must match
 *                                an owned GSC property)
 */

const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GSC_INSPECTION_URL =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type InspectionApiResponse = {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      robotsTxtState?: string;
      indexingState?: string;
      pageFetchState?: string;
      lastCrawlTime?: string;
    };
  };
  error?: {
    code?: number;
    message?: string;
  };
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function parseServiceAccountEnv(raw: string): ServiceAccountCredentials {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8");

  const parsed = JSON.parse(json) as Partial<ServiceAccountCredentials>;

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key.",
    );
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri || GOOGLE_TOKEN_URL,
  };
}

function buildJwtAssertion(serviceAccount: ServiceAccountCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: GSC_SCOPE,
      aud: serviceAccount.token_uri || GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );

  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();

  const signature = signer
    .sign(serviceAccount.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsigned}.${signature}`;
}

async function getAccessToken(
  serviceAccount: ServiceAccountCredentials,
): Promise<string> {
  const assertion = buildJwtAssertion(serviceAccount);
  const res = await fetch(serviceAccount.token_uri || GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description ||
        json.error ||
        "Failed to obtain Google OAuth token.",
    );
  }

  return json.access_token;
}

async function inspectUrlWithGsc(params: {
  accessToken: string;
  inspectionUrl: string;
  siteUrl: string;
}): Promise<InspectionApiResponse> {
  const res = await fetch(GSC_INSPECTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl: params.inspectionUrl,
      siteUrl: params.siteUrl,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as InspectionApiResponse;

  if (!res.ok) {
    throw new Error(
      json.error?.message || `GSC inspection failed (${res.status}).`,
    );
  }

  return json;
}

function mapInspectionToStatus(
  result: InspectionApiResponse,
): IndexStatusValue {
  const verdict =
    result.inspectionResult?.indexStatusResult?.verdict?.toUpperCase() || "";
  const coverageState =
    result.inspectionResult?.indexStatusResult?.coverageState?.toLowerCase() ||
    "";
  const indexingState =
    result.inspectionResult?.indexStatusResult?.indexingState?.toLowerCase() ||
    "";
  const pageFetchState =
    result.inspectionResult?.indexStatusResult?.pageFetchState?.toLowerCase() ||
    "";

  if (verdict === "PASS") {
    return "indexed";
  }

  if (
    coverageState.includes("currently not indexed") ||
    coverageState.includes("duplicate") ||
    coverageState.includes("excluded") ||
    coverageState.includes("blocked") ||
    coverageState.includes("soft 404") ||
    coverageState.includes("alternate page") ||
    coverageState.includes("redirect") ||
    pageFetchState.includes("soft 404") ||
    pageFetchState.includes("not found")
  ) {
    return "excluded";
  }

  if (coverageState.includes("submitted")) {
    return "submitted";
  }

  if (coverageState.includes("indexed") || indexingState.includes("indexed")) {
    return "indexed";
  }

  return "not_submitted";
}

function mergeInspectedStatus(
  existingStatus: IndexStatusValue | undefined,
  inspectedStatus: IndexStatusValue,
): IndexStatusValue {
  if (inspectedStatus === "indexed") return "indexed";
  if (inspectedStatus === "excluded") return "excluded";
  if (inspectedStatus === "submitted") return "submitted";

  if (existingStatus === "indexed" || existingStatus === "submitted") {
    return existingStatus;
  }

  return inspectedStatus;
}

function summarizeInspection(result: InspectionApiResponse): string {
  const index = result.inspectionResult?.indexStatusResult;
  return [
    index?.verdict && `verdict=${index.verdict}`,
    index?.coverageState && `coverage=${index.coverageState}`,
    index?.indexingState && `indexing=${index.indexingState}`,
    index?.pageFetchState && `fetch=${index.pageFetchState}`,
    index?.robotsTxtState && `robots=${index.robotsTxtState}`,
    index?.lastCrawlTime && `crawl=${index.lastCrawlTime}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

async function resolveInventoryMetadata(params: {
  id: string;
  url: string;
  type?: IndexStatusDoc["type"];
  locale?: string;
  title?: string;
}) {
  const inventory = await buildContentInventory({ includeDrafts: true });
  const match = inventory.find(
    (item) => item.id === params.id || item.url === params.url,
  );

  if (params.type && params.locale) {
    return {
      type: params.type,
      locale: params.locale,
      title: params.title || "",
      hasLocalePair: match?.hasLocalePair,
      missingPairLocales: match?.missingPairLocales || [],
    };
  }

  return {
    type: params.type || match?.type,
    locale: params.locale || match?.locale,
    title: params.title || match?.title || "",
    hasLocalePair: match?.hasLocalePair,
    missingPairLocales: match?.missingPairLocales || [],
  };
}

function isCacheFresh(lastCheckedAt?: string): boolean {
  if (!lastCheckedAt) return false;
  const t = new Date(lastCheckedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < CACHE_TTL_MS;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { id, url, force, type, locale, title } = (await req.json()) as {
      id?: string;
      url?: string;
      force?: boolean;
      type?: IndexStatusDoc["type"];
      locale?: string;
      title?: string;
    };

    if (!id || !url) {
      return NextResponse.json(
        { error: "Required: id, url." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const docRef = db.collection("indexStatus").doc(id);
    const snap = await docRef.get();
    const existing = snap.exists
      ? (snap.data() as Partial<IndexStatusDoc>)
      : null;

    // Serve from cache if fresh and not forced.
    if (!force && existing && isCacheFresh(existing.lastCheckedAt)) {
      return NextResponse.json({
        ok: true,
        cached: true,
        data: { id, ...existing },
      });
    }

    const hasServiceAccount = Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON);
    const siteUrl = process.env.GSC_SITE_URL;

    if (!hasServiceAccount || !siteUrl) {
      return NextResponse.json(
        {
          error:
            "GSC API not configured. Set GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL to enable auto-refresh.",
          configured: false,
        },
        { status: 501 },
      );
    }

    const resolvedMeta = await resolveInventoryMetadata({
      id,
      url,
      type: type || existing?.type,
      locale: locale || existing?.locale,
      title: title || existing?.title,
    });

    const resolvedType = resolvedMeta.type;
    const resolvedLocale = resolvedMeta.locale;
    const resolvedTitle = resolvedMeta.title;
    const hasLocalePair = resolvedMeta.hasLocalePair;
    const missingPairLocales = resolvedMeta.missingPairLocales || [];

    if (!resolvedType || !resolvedLocale) {
      return NextResponse.json(
        {
          error:
            "Missing content metadata. Provide type and locale for first-time GSC inspection.",
        },
        { status: 400 },
      );
    }

    if (resolvedType === "blog" && hasLocalePair === false) {
      const missingLocalesLabel = missingPairLocales.length
        ? missingPairLocales.join(", ")
        : "required locale";

      return NextResponse.json(
        {
          error: `Cannot push unpaired blog article to GSC. Missing locale pair: ${missingLocalesLabel}.`,
        },
        { status: 409 },
      );
    }

    const serviceAccount = parseServiceAccountEnv(
      process.env.GSC_SERVICE_ACCOUNT_JSON!,
    );
    const accessToken = await getAccessToken(serviceAccount);
    const inspection = await inspectUrlWithGsc({
      accessToken,
      inspectionUrl: url,
      siteUrl,
    });

    const inspectedStatus = mapInspectionToStatus(inspection);
    const status = mergeInspectedStatus(existing?.status, inspectedStatus);
    const lastCheckedAt = new Date().toISOString();
    const lastGSCResult = summarizeInspection(inspection);

    const payload: IndexStatusDoc = {
      url,
      type: resolvedType,
      locale: resolvedLocale,
      title: resolvedTitle,
      status,
      notes: existing?.notes ?? "",
      lastCheckedAt,
      lastGSCResult,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(payload, { merge: true });

    return NextResponse.json({
      ok: true,
      cached: false,
      configured: true,
      data: {
        id,
        ...payload,
        inspectionResultLink: inspection.inspectionResult?.inspectionResultLink,
      },
    });
  } catch (error) {
    console.error("[gsc inspect]", error);
    const message =
      error instanceof Error ? error.message : "Failed to inspect URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
