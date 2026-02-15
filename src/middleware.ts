import { NextRequest, NextResponse } from 'next/server';
import { i18n, Locale } from './i18n-config';
import Negotiator from 'negotiator';
import { match as matchLocale } from '@formatjs/intl-localematcher';

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check for cookie first to remember user's choice
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. If no cookie, check the 'Accept-Language' header
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => (headers[key] = value));
  
  // @ts-ignore Negotiator can handle the headers object
  const languages = new Negotiator({ headers }).languages();
  
  try {
    return matchLocale(languages, i18n.locales as string[], i18n.defaultLocale) as Locale;
  } catch (e) {
    // Fallback to default if there's an error
    return i18n.defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes, Next.js internal files, and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }
  
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // If the path is missing a locale, decide to rewrite or redirect.
  if (pathnameIsMissingLocale) {
    const locale = getPreferredLocale(request);
    
    // For the default locale, we rewrite the URL to keep it clean (e.g., /about).
    if (locale === i18n.defaultLocale) {
      return NextResponse.rewrite(
        new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
      );
    }

    // For other locales, we redirect to make the locale visible (e.g., /id/about).
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|images|favicon.ico).*)',
  ],
};
