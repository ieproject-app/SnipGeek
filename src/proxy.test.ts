import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(path: string, options?: { cookies?: Record<string, string> }) {
  const url = new URL(path, "https://snipgeek.com");
  const req = new NextRequest(url);
  if (options?.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

function getResponseType(res: NextResponse) {
  const location = res.headers.get("location");
  const rewriteHeader = res.headers.get("x-middleware-rewrite");
  if (location) return "redirect";
  if (rewriteHeader) return "rewrite";
  return "next";
}

function getLocation(res: NextResponse) {
  return res.headers.get("location");
}

function getRewriteUrl(res: NextResponse) {
  return res.headers.get("x-middleware-rewrite");
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("proxy", () => {
  describe("skip rules — should pass through without modification", () => {
    it.each([
      "/api/posts",
      "/api/admin/status",
      "/_next/static/chunk.js",
      "/_next/image?url=test",
      "/admin",
      "/admin/prompt-generator",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
    ])("passes through %s", (path) => {
      const res = proxy(makeRequest(path));
      expect(getResponseType(res)).toBe("next");
    });
  });

  describe("/en canonicalization — 308 redirect to remove default locale prefix", () => {
    it("redirects /en to /", () => {
      const res = proxy(makeRequest("/en"));
      expect(res.status).toBe(308);
      expect(getLocation(res)).toBe("https://snipgeek.com/");
    });

    it("redirects /en/blog to /blog", () => {
      const res = proxy(makeRequest("/en/blog"));
      expect(res.status).toBe(308);
      expect(getLocation(res)).toBe("https://snipgeek.com/blog");
    });

    it("redirects /en/blog/some-slug to /blog/some-slug", () => {
      const res = proxy(makeRequest("/en/blog/some-slug"));
      expect(res.status).toBe(308);
      expect(getLocation(res)).toBe("https://snipgeek.com/blog/some-slug");
    });
  });

  describe("locale-less paths — rewrite to default locale", () => {
    it("rewrites / to /en/", () => {
      const res = proxy(makeRequest("/"));
      expect(getResponseType(res)).toBe("rewrite");
      expect(getRewriteUrl(res)).toContain("/en/");
    });

    it("rewrites /blog to /en/blog", () => {
      const res = proxy(makeRequest("/blog"));
      expect(getResponseType(res)).toBe("rewrite");
      expect(getRewriteUrl(res)).toContain("/en/blog");
    });

    it("rewrites /blog/some-slug to /en/blog/some-slug", () => {
      const res = proxy(makeRequest("/blog/some-slug"));
      expect(getResponseType(res)).toBe("rewrite");
      expect(getRewriteUrl(res)).toContain("/en/blog/some-slug");
    });
  });

  describe("non-default locale paths — pass through", () => {
    it("passes through /id", () => {
      const res = proxy(makeRequest("/id"));
      expect(getResponseType(res)).toBe("next");
    });

    it("passes through /id/blog/some-slug", () => {
      const res = proxy(makeRequest("/id/blog/some-slug"));
      expect(getResponseType(res)).toBe("next");
    });
  });

  // ── CRITICAL REGRESSION GUARD ──────────────────────────────────────────────
  // These tests exist because of a production incident where a cookie-based
  // redirect was cached by the CDN, poisoning Googlebot and all visitors.
  // See: fix-cdn-cached-redirect-killing-google-indexing
  // DO NOT REMOVE OR WEAKEN THESE TESTS.

  describe("🔴 REGRESSION: cookie-based redirect must never happen", () => {
    it("does NOT redirect when NEXT_LOCALE=id cookie is present on /", () => {
      const res = proxy(makeRequest("/", { cookies: { NEXT_LOCALE: "id" } }));
      // Must be a rewrite to /en (not a redirect to /id)
      expect(getResponseType(res)).toBe("rewrite");
      expect(getRewriteUrl(res)).toContain("/en/");
      expect(getLocation(res)).toBeNull();
    });

    it("does NOT redirect when NEXT_LOCALE=id cookie is present on /blog", () => {
      const res = proxy(makeRequest("/blog", { cookies: { NEXT_LOCALE: "id" } }));
      expect(getResponseType(res)).toBe("rewrite");
      expect(getRewriteUrl(res)).toContain("/en/blog");
      expect(getLocation(res)).toBeNull();
    });

    it("does NOT redirect when NEXT_LOCALE=id cookie is present on /blog/some-slug", () => {
      const res = proxy(makeRequest("/blog/some-slug", { cookies: { NEXT_LOCALE: "id" } }));
      expect(getResponseType(res)).toBe("rewrite");
      expect(getRewriteUrl(res)).toContain("/en/blog/some-slug");
      expect(getLocation(res)).toBeNull();
    });

    it("ignores any cookie value — always rewrites locale-less to /en", () => {
      for (const cookieVal of ["id", "en", "fr", "invalid"]) {
        const res = proxy(makeRequest("/", { cookies: { NEXT_LOCALE: cookieVal } }));
        const type = getResponseType(res);
        // Should never produce a redirect based on cookie
        if (type === "redirect") {
          const loc = getLocation(res);
          // The only valid redirect from / is /en canonicalization (which shouldn't trigger here)
          expect(loc).not.toContain("/id");
          expect(loc).not.toContain("/fr");
        }
      }
    });
  });

  describe("proxy source code guard — no cookie read for redirect", () => {
    it("proxy.ts source does not contain cookie-based redirect pattern", async () => {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const source = readFileSync(resolve(__dirname, "proxy.ts"), "utf8");

      // Strip comments so we only check actual code
      const codeOnly = source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

      // Must not read NEXT_LOCALE cookie in code
      expect(codeOnly).not.toContain('cookies.get("NEXT_LOCALE")');
      expect(codeOnly).not.toContain("cookies.get('NEXT_LOCALE')");

      // Must not have a redirect that depends on preferredLocale or cookie
      expect(codeOnly).not.toMatch(/preferredLocale[\s\S]*redirect/);
      expect(codeOnly.toLowerCase()).not.toMatch(/cookie[\s\S]*redirect/);
    });
  });
});
