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
    if (!pathName) return '/';

    // 1. Handle detail pages (blog, notes) with available translations
    if (currentSlug && translationsMap) {
      const pageType = pathName.includes('/notes/') ? 'notes' : 'blog';
      
      let translationKey: string | null = null;
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
          // Found a specific translation, so construct the new path from scratch
          if (newLocale === i18n.defaultLocale) {
            return `/${pageType}/${targetTranslation.slug}`;
          }
          return `/${newLocale}/${pageType}/${targetTranslation.slug}`;
        }
      }
      // If no translation is found, fall through to the generic logic below.
    }

    // 2. Handle all other pages (e.g., /about, /contact) OR slug pages without a direct translation
    const segments = pathName.split('/');
    
    // Check if the first segment after the initial '/' is a locale
    const isLocaleInPath = i18n.locales.includes(segments[1] as Locale);
    
    // If a locale is found in the path, remove it to get the base path
    if (isLocaleInPath) {
      segments.splice(1, 1);
    }
    
    const pathWithoutLocale = segments.join('/') || '/';

    // If the new locale is the default, use the clean path
    if (newLocale === i18n.defaultLocale) {
      return pathWithoutLocale;
    }

    // For other locales, prefix the path with the new locale
    // Handle the homepage case where pathWithoutLocale is just "/"
    if (pathWithoutLocale === '/') {
      return `/${newLocale}`;
    }
    return `/${newLocale}${pathWithoutLocale}`;
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
