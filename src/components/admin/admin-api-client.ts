"use client";

import { getAuth } from "firebase/auth";

async function getIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  return user.getIdToken();
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}

import type { InventoryItem } from "@/lib/content-inventory";
import type { IndexStatusDoc, IndexStatusValue } from "@/app/api/admin/index-status/route";

export type { InventoryItem, IndexStatusDoc, IndexStatusValue };

export type IndexStatusRecord = IndexStatusDoc & { id: string };

export type GscInspectResponse = {
  ok: true;
  cached: boolean;
  configured: boolean;
  data: IndexStatusRecord & { inspectionResultLink?: string };
};

export type PromptContentResponse = {
  slug: string;
  type: "blog" | "note";
  locale: string;
  title: string;
  published: boolean;
  date: string;
  content: string;
};

export async function fetchContentInventory(): Promise<{
  items: InventoryItem[];
  generatedAt: string;
}> {
  return adminFetch("/api/admin/content-inventory");
}

export async function fetchIndexStatuses(): Promise<{ items: IndexStatusRecord[] }> {
  return adminFetch("/api/admin/index-status");
}

export async function updateIndexStatus(
  payload: Partial<IndexStatusDoc> & { id: string },
): Promise<{ ok: true; id: string }> {
  return adminFetch("/api/admin/index-status", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshFromGsc(payload: {
  id: string;
  url: string;
  force?: boolean;
  type?: IndexStatusDoc["type"];
  locale?: string;
  title?: string;
}): Promise<GscInspectResponse> {
  return adminFetch("/api/admin/gsc/inspect", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminPromptContent(
  params: {
    type: "blog" | "note";
    slug: string;
    locale: string;
    signal?: AbortSignal;
  },
): Promise<PromptContentResponse> {
  const query = new URLSearchParams({
    type: params.type,
    slug: params.slug,
    locale: params.locale,
  });

  return adminFetch(`/api/admin/prompt-content?${query.toString()}`, {
    signal: params.signal,
  });
}

export async function submitToIndexNow(payload: { urlList: string[] }): Promise<{ ok: true; submitted: number }> {
  return adminFetch("/api/admin/indexnow", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
