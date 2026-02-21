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

  // Use primary-foreground with low opacity for the background to contrast with bg-primary footer
  return (
    <div 
      className="relative flex items-center bg-primary-foreground/10 backdrop-blur-md rounded-full p-1 text-xs min-h-[32px] min-w-[80px] shadow-inner"
      suppressHydrationWarning
    >
        {!mounted ? (
          <div className="w-full h-full animate-pulse bg-primary-foreground/5 rounded-full" />
        ) : (
          <>
            <div 
                className={cn(
                    "absolute h-6 w-9 bg-primary-foreground/20 shadow-md rounded-full transition-transform duration-300 ease-in-out",
                    currentLocale === 'en' ? 'translate-x-0' : 'translate-x-full'
                )}
            />
            {i18n.locales.map(locale => (
                <a
                    key={locale} 
                    href={redirectedPathName(locale)} 
                    className={cn(
                        "relative z-10 w-9 h-6 flex items-center justify-center font-bold transition-colors",
                        currentLocale === locale ? "text-primary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"
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
