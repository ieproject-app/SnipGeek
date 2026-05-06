import { NextRequest, NextResponse } from "next/server";
import { i18n } from "./i18n-config";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ⚠️  ARCHITECTURAL RULE — DO NOT ADD COOKIE-BASED REDIRECTS HERE            ║
// ║                                                                            ║
// ║ In April 2026 a cookie-based locale redirect (`NEXT_LOCALE=id` → 307 to   ║
// ║ /id/) was cached by the CDN without a Vary: Cookie header. This poisoned   ║
// ║ the cache for ALL visitors including Googlebot, killing Google indexing     ║
// ║ for the entire site.                                                       ║
// ║                                                                            ║
// ║ RULE: Proxy responses that go through the CDN must NEVER vary by cookie.   ║
// ║ Locale preference is handled CLIENT-SIDE via LanguageSwitcher and          ║
// ║ LocaleSuggestionBanner (both use router.push, not server redirect).        ║
// ║                                                                            ║
// ║ If you need to add cookie/header-dependent logic here, you MUST either:    ║
// ║   1. Add a Vary header matching the input (e.g. Vary: Cookie), OR          ║
// ║   2. Set Cache-Control: private on the response                            ║
// ║                                                                            ║
// ║ Regression tests: src/proxy.test.ts                                        ║
// ║ Pre-deploy guard: scripts/pre-deploy-check.mjs (SEO proxy guard)           ║
// ║ Incident post: /blog/fix-cdn-cached-redirect-killing-google-indexing        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes, Next.js internal files, static files,
  // and the internal /admin dashboard (which is intentionally not localized).
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Canonicalize default-locale paths: /en/* -> /*
  if (pathname === `/${i18n.defaultLocale}`) {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  if (pathname.startsWith(`/${i18n.defaultLocale}/`)) {
    const normalizedPath = pathname.replace(`/${i18n.defaultLocale}`, "") || "/";
    return NextResponse.redirect(new URL(normalizedPath, request.url), 308);
  }

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  // Locale-less paths always rewrite to the default locale.
  // Cookie-based locale preference is handled client-side only
  // (language-switcher / locale-suggestion-banner) to avoid CDN
  // caching a redirect that poisons every subsequent visitor.
  if (pathnameIsMissingLocale) {
    return NextResponse.rewrite(
      new URL(
        `/${i18n.defaultLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        request.url,
      ),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|images|favicon.ico).*)",
  ],
};
