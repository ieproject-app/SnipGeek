'use client'

import { usePathname, useParams } from 'next/navigation'
import { i18n, type Locale } from '@/i18n-config'
import { type TranslationsMap } from '@/lib/posts'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function LanguageSwitcher({ translationsMap }: { translationsMap: TranslationsMap }) {
  const pathName = usePathname()
  const params = useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLocale = (params.locale as string) || i18n.defaultLocale;

  const handleLocaleChange = (locale: Locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const redirectedPathName = (newLocale: string) => {
    if (!pathName) return '/';

    if (currentLocale && params.slug && translationsMap) {
      const currentSlug = params.slug as string;
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
          if (newLocale === i18n.defaultLocale) {
            return `/${pageType}/${targetTranslation.slug}`;
          }
          return `/${newLocale}/${pageType}/${targetTranslation.slug}`;
        }
      }
    }

    const segments = pathName.split('/');
    const isLocaleInPath = i18n.locales.includes(segments[1] as Locale);
    if (isLocaleInPath) {
      segments.splice(1, 1);
    }
    const pathWithoutLocale = segments.join('/') || '/';

    if (newLocale === i18n.defaultLocale) {
      return pathWithoutLocale;
    }

    if (pathWithoutLocale === '/') {
      return `/${newLocale}`;
    }
    return `/${newLocale}${pathWithoutLocale}`;
  }

  // Use a context-aware color scheme that works in both modes
  return (
    <div 
      className="relative flex items-center bg-muted rounded-full p-1 text-[10px] min-h-[28px] min-w-[70px] shadow-inner"
      suppressHydrationWarning
    >
        {!mounted ? (
          <div className="w-full h-full animate-pulse bg-muted-foreground/10 rounded-full" />
        ) : (
          <>
            <div 
                className={cn(
                    "absolute h-5 w-8 bg-background shadow-sm rounded-full transition-transform duration-300 ease-in-out",
                    currentLocale === 'en' ? 'translate-x-0' : 'translate-x-full'
                )}
            />
            {i18n.locales.map(locale => (
                <a
                    key={locale} 
                    href={redirectedPathName(locale)} 
                    className={cn(
                        "relative z-10 w-8 h-5 flex items-center justify-center font-bold transition-colors",
                        currentLocale === locale ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={currentLocale === locale ? 'page' : undefined}
                    onClick={() => handleLocaleChange(locale as Locale)}
                >
                    {locale.toUpperCase()}
                </a>
            ))}
          </>
        )}
    </div>
  )
}
