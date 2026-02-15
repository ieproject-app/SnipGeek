'use client'

import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { i18n, type Locale } from '@/i18n-config'
import { type TranslationsMap } from '@/lib/posts'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ translationsMap }: { translationsMap: TranslationsMap }) {
  const pathName = usePathname()
  const params = useParams()

  const currentLocale = (params.locale as string) || i18n.defaultLocale;
  const currentSlug = params.slug as string | undefined;

  const handleLocaleChange = (locale: Locale) => {
    // Set cookie to remember the user's choice for 1 year
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const redirectedPathName = (newLocale: string) => {
    if (!pathName) return '/'

    // 1. Handle detail pages (blog, notes)
    if (currentSlug && translationsMap) {
      const pageType = pathName.includes('/notes/') ? 'notes' : 'blog';
      
      let translationKey: string | null = null;
      // Find the translation key for the current slug and locale
      for (const key in translationsMap) {
        const found = translationsMap[key].find(t => t.locale === currentLocale && t.slug === currentSlug);
        if (found) {
          translationKey = key;
          break;
        }
      }

      if (translationKey) {
        const targetTranslation = translationsMap[translationKey]?.find(t => t.locale === newLocale);
        if (targetTranslation) {
          // Construct the new path for the translated slug
          if (newLocale === i18n.defaultLocale) {
            return `/${pageType}/${targetTranslation.slug}`;
          }
          return `/${newLocale}/${pageType}/${targetTranslation.slug}`;
        }
      }
      // If no translation found for a slug page, fall back to generic page logic
    }

    // 2. Handle all other pages (homepage, /about, /contact etc.)
    // `pathName` from `usePathname` is always locale-prefixed due to middleware rewrite.
    // e.g., /en/about, /id/about, /en, /id
    const pathWithoutLocalePrefix = pathName.replace(`/${currentLocale}`, '');
    const newPath = pathWithoutLocalePrefix === '' ? '/' : pathWithoutLocalePrefix;

    if (newLocale === i18n.defaultLocale) {
        // For default locale, we want the "clean" URL, e.g., /about
        return newPath;
    }
    
    // For other locales, we prefix with the locale, e.g., /id/about
    return `/${newLocale}${newPath === '/' ? '' : newPath}`;
  }

  return (
    <div className="relative flex items-center bg-primary/70 rounded-full p-1 text-sm">
        <div 
            className={cn(
                "absolute h-6 w-9 bg-primary-foreground/20 rounded-full transition-transform duration-300 ease-in-out",
                currentLocale === 'en' ? 'translate-x-0' : 'translate-x-full'
            )}
        />
        {i18n.locales.map(locale => (
            <Link 
                key={locale} 
                href={redirectedPathName(locale)} 
                className={cn(
                    "relative z-10 w-9 h-6 flex items-center justify-center font-semibold transition-colors",
                    currentLocale === locale ? "text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"
                )}
                aria-current={currentLocale === locale ? 'page' : undefined}
                onClick={() => handleLocaleChange(locale as Locale)}
            >
                {locale.toUpperCase()}
            </Link>
        ))}
    </div>
  )
}
