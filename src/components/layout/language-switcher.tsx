"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import { i18n, type Locale } from "@/i18n-config";
import { type TranslationsMap } from "@/lib/posts";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/get-dictionary";
import { SnipTooltip } from "@/components/ui/snip-tooltip";
import { Skeleton } from "@/components/ui/skeleton";

const setPreferredLocaleCookie = (locale: Locale) => {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
};

export function LanguageSwitcher(props: {
  translationsMap: TranslationsMap;
  dictionary: Dictionary;
  variant?: "pill" | "minimal";
}) {
  const { translationsMap, variant = "pill" } = props;
  const pathName = usePathname();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const currentLocale = (params.locale as string) || i18n.defaultLocale;

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale) return;
    setPreferredLocaleCookie(locale);
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

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2" suppressHydrationWarning>
        {i18n.locales.map((locale, index) => {
          const isActive = currentLocale === locale;
          return (
            <React.Fragment key={locale}>
              <button
                type="button"
                onClick={() => handleLocaleChange(locale as Locale)}
                aria-label={`Switch to ${locale === "en" ? "English" : "Indonesian"}`}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                  isActive
                    ? "text-accent"
                    : "text-primary/60 hover:text-primary/80",
                )}
              >
                {locale}
              </button>
              {index < i18n.locales.length - 1 && (
                <span className="text-[10px] font-light text-primary/10">|</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center bg-card border border-border rounded-full p-0.5 transition-all duration-300"
      suppressHydrationWarning
    >
      {!mounted ? (
        <Skeleton className="w-19 h-6 rounded-full" />
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
              const label = locale === "en" ? "English" : "Indonesia";
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
                    aria-label={`Switch to ${label}`}
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
