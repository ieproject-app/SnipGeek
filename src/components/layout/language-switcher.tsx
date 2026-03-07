"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import { i18n, type Locale } from "@/i18n-config";
import { type TranslationsMap } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/get-dictionary";
import { SnipTooltip } from "@/components/ui/snip-tooltip";

export function LanguageSwitcher({
  translationsMap,
  dictionary,
}: {
  translationsMap: TranslationsMap;
  dictionary: Dictionary;
}) {
  const pathName = usePathname();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLocale = (params.locale as string) || i18n.defaultLocale;

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.removeItem("snipgeek-pending-notify");
    router.push(redirectedPathName(locale), { scroll: false });
  };

  const redirectedPathName = (newLocale: string) => {
    if (!pathName) return "/";

    if (currentLocale && params.slug && translationsMap) {
      const currentSlug = params.slug as string;
      const pageType = pathName.includes("/notes/") ? "notes" : "blog";

      let translationKey: string | null = null;
      for (const key in translationsMap) {
        const found = translationsMap[key].find(
          (t) => t.locale === currentLocale && t.slug === currentSlug,
        );
        if (found) {
          translationKey = key;
          break;
        }
      }

      if (translationKey) {
        const targetTranslation = translationsMap[translationKey]?.find(
          (t) => t.locale === newLocale,
        );
        if (targetTranslation) {
          if (newLocale === i18n.defaultLocale) {
            return `/${pageType}/${targetTranslation.slug}`;
          }
          return `/${newLocale}/${pageType}/${targetTranslation.slug}`;
        }
      }
    }

    const segments = pathName.split("/");
    const isLocaleInPath = i18n.locales.includes(segments[1] as Locale);
    if (isLocaleInPath) {
      segments.splice(1, 1);
    }
    const pathWithoutLocale = segments.join("/") || "/";

    if (newLocale === i18n.defaultLocale) {
      return pathWithoutLocale;
    }

    if (pathWithoutLocale === "/") {
      return `/${newLocale}`;
    }
    return `/${newLocale}${pathWithoutLocale}`;
  };

  return (
    <div
      className="relative flex items-center bg-card border border-border rounded-full p-0.5 transition-all duration-300"
      suppressHydrationWarning
    >
      {!mounted ? (
        <div className="w-[76px] h-6 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
      ) : (
        <>
          <div
            className={cn(
              "absolute h-6 w-9 bg-accent/90 rounded-full transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              currentLocale === "en"
                ? "translate-x-0"
                : "translate-x-[calc(100%+2px)]",
            )}
          />
          <div className="flex items-center gap-0.5 w-full justify-between px-0.5">
            {i18n.locales.map((locale) => {
              const tooltipKey = locale === "en" ? "languageEn" : "languageId";
              const label =
                (dictionary?.promptGenerator as any)?.tooltips?.[tooltipKey] ??
                (locale === "en" ? "English" : "Indonesia");
              const isActive = currentLocale === locale;

              return (
                <SnipTooltip key={locale} label={label} side="top">
                  <button
                    type="button"
                    className={cn(
                      "relative z-10 w-9 h-6 flex items-center justify-center font-black text-[11px] tracking-wider transition-all duration-300 rounded-full",
                      isActive
                        ? "text-accent-foreground"
                        : "text-foreground/50 hover:text-foreground/80 hover:scale-105 active:scale-95",
                    )}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleLocaleChange(locale as Locale)}
                  >
                    {locale.toUpperCase()}
                  </button>
                </SnipTooltip>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
