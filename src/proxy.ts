import { NextRequest, NextResponse } from "next/server";
import { i18n } from "./i18n-config";

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
