'use client'

import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { i18n } from '@/i18n-config'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const pathName = usePathname()
  const params = useParams()

  const redirectedPathName = (locale: string) => {
    if (!pathName) return '/'
    const segments = pathName.split('/')
    
    // The locale is always the first segment
    segments[1] = locale
    
    // For default locale, we don't want the locale in the path
    if (locale === i18n.defaultLocale) {
        segments.splice(1, 1)
        if (segments.length === 1) return '/' // root path
        return segments.join('/')
    }

    return segments.join('/')
  }

  return (
    <div className="flex gap-1 items-center">
      {i18n.locales.map((locale) => {
        const isActive = params.locale === locale
        return (
          <Button
            key={locale}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={`transition-all ${isActive ? 'ring-2 ring-ring' : ''}`}
          >
            <Link href={redirectedPathName(locale)}>
              {locale.toUpperCase()}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
