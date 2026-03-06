
'use client'

import { usePathname, useParams } from 'next/navigation'
import { i18n, type Locale } from '@/i18n-config'
import { type TranslationsMap } from '@/lib/posts'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { Dictionary } from '@/lib/get-dictionary'
import { SnipTooltip } from '@/components/ui/snip-tooltip'

export function LanguageSwitcher({ translationsMap, dictionary }: { translationsMap: TranslationsMap, dictionary: Dictionary }) {
  const pathName = usePathname()
  const params = useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLocale = (params.locale as string) || i18n.defaultLocale;

  const handleLocaleChange = (locale: Locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    // Store a flag to trigger notification on the new page load
    localStorage.setItem('snipgeek-pending-notify', locale === 'en' ? 'langEn' : 'langId');
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

  return (
    <div
      className="relative flex items-center bg-white/10 dark:bg-black/30 backdrop-blur-md rounded-full p-1 text-xs min-h-[36px] min-w-[90px] shadow-lg border border-white/20 dark:border-white/10 transition-all duration-300 hover:border-white/30 dark:hover:border-white/15 hover:shadow-xl"
      suppressHydrationWarning
    >
      {!mounted ? (
        <div className="w-full h-full animate-pulse bg-white/5 rounded-full" />
      ) : (
        <>
          <div
            className={cn(
              "absolute h-7 w-10 bg-gradient-to-r from-accent to-accent/90 dark:from-accent dark:to-accent/80 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.4)] backdrop-blur-sm rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/20 dark:border-white/10",
              currentLocale === 'en' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'
            )}
          />
          <div className="flex items-center gap-1 w-full justify-between px-0.5">
            {i18n.locales.map(locale => {
              const tooltipKey = locale === 'en' ? 'languageEn' : 'languageId'
              const label = (dictionary?.promptGenerator as any)?.tooltips?.[tooltipKey] ?? (locale === 'en' ? 'English' : 'Indonesia')
              const isActive = currentLocale === locale

              return (
                <SnipTooltip key={locale} label={label} side="top">
                  <a
                    href={redirectedPathName(locale)}
                    className={cn(
                      "relative z-10 w-10 h-7 flex items-center justify-center font-black tracking-wider transition-all duration-300 rounded-full",
                      isActive
                        ? "text-accent-foreground scale-100 drop-shadow-sm"
                        : "text-foreground/60 hover:text-foreground/80 hover:scale-105 active:scale-95 hover:drop-shadow-md"
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleLocaleChange(locale as Locale)}
                  >
                    {locale.toUpperCase()}
                  </a>
                </SnipTooltip>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
