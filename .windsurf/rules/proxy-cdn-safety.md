# Proxy CDN Safety Rule

> **CRITICAL** — This rule exists because of a production incident that killed Google indexing for the entire site.

## The Rule

**NEVER add cookie-based or header-based redirects in `src/proxy.ts`** unless you also set `Cache-Control: private` or add a matching `Vary` header on the response.

## Why

In April 2026, a cookie-based locale redirect (`NEXT_LOCALE=id` → 307 to `/id/`) was cached by the Firebase App Hosting CDN. The CDN had no `Vary: Cookie` header, so **every visitor** — including Googlebot — received the cached redirect. Google stopped indexing the homepage and impressions dropped to zero.

## What's Safe vs Unsafe

### ❌ UNSAFE — will cause cache poisoning
```typescript
const locale = request.cookies.get("NEXT_LOCALE")?.value;
if (locale === "id") {
  return NextResponse.redirect(new URL("/id/", request.url));
}
```

### ✅ SAFE — always returns the same response for the same URL
```typescript
if (pathnameIsMissingLocale) {
  return NextResponse.rewrite(
    new URL(`/${defaultLocale}${pathname}`, request.url),
  );
}
```

### ✅ SAFE — if you must vary by cookie, mark as private
```typescript
const res = NextResponse.redirect(new URL("/id/", request.url));
res.headers.set("Cache-Control", "private, no-store");
return res;
```

## Where Locale Preference Lives

Locale switching is **client-side only**:
- `LanguageSwitcher` component → `router.push("/id/...")`
- `LocaleSuggestionBanner` component → `router.push("/id/...")`
- The `NEXT_LOCALE` cookie is used by the banner's "don't show again" logic — the proxy must never read it.

## Automated Guards

| Guard | Location | What it checks |
|---|---|---|
| Unit tests | `src/proxy.test.ts` | 22 tests including 5 cookie regression tests + source code analysis |
| Pre-deploy | `scripts/pre-deploy-check.mjs` | Static analysis blocks deploy if cookie redirect pattern found |
| Comment block | `src/proxy.ts` top | Architectural decision record visible when file is opened |

## Before Editing proxy.ts

1. Read the architectural comment block at the top of the file
2. Run `npx vitest run src/proxy.test.ts` after any change
3. Run `node scripts/pre-deploy-check.mjs` before deploying
4. If your change varies the response by cookie/header, you MUST add `Vary` or `Cache-Control: private`
