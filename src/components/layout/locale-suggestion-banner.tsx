"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/get-dictionary";

const DISMISS_KEY = "snipgeek-locale-suggestion-dismissed";
const ONE_YEAR_SECONDS = 31536000;

type TranslationEntry = {
  locale: string;
  slug: string;
};

type TranslationMap = Record<string, TranslationEntry[]>;

function hasIndonesianPreference() {
  if (typeof navigator === "undefined" || typeof Intl === "undefined") {
    return false;
  }

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    languages.some((language) => language.toLowerCase().startsWith("id")) ||
    intlLocale.toLowerCase().startsWith("id") ||
    timeZone === "Asia/Jakarta" ||
    timeZone === "Asia/Makassar" ||
    timeZone === "Asia/Jayapura"
  );
}

export function LocaleSuggestionBanner({
  locale,
  dictionary,
  translationsMap,
}: {
  locale: string;
  dictionary: Dictionary;
  translationsMap: TranslationMap;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const localeSuggestion = dictionary.localeSuggestion ?? {
    title: "Prefer reading in Bahasa Indonesia?",
    description:
      "We detected your browser prefers Indonesian. Switch to the Indonesian version for localized content and navigation.",
    switch: "Switch to Indonesian",
    stay: "Stay in English",
    dismiss: "Dismiss language suggestion",
  };

  useEffect(() => {
    if (locale !== "en") return;
    if (typeof window === "undefined") return;

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "true";
    const preferredLocaleCookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    if (dismissed || preferredLocaleCookie === "id") return;
    if (!hasIndonesianPreference()) return;

    setVisible(true);
  }, [locale]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
    setVisible(false);
  };

  const handleSwitch = () => {
    const currentSlug = typeof params.slug === "string" ? params.slug : undefined;
    let targetPath = "/id";

    if (pathname) {
      if (pathname === "/") {
        targetPath = "/id";
      } else if (pathname.startsWith("/blog/") && currentSlug) {
        const translatedPath = Object.values(translationsMap)
          .find((entries) =>
            entries.some(
              (entry) => entry.locale === "en" && entry.slug === currentSlug,
            ),
          )
          ?.find((entry) => entry.locale === "id");

        targetPath = translatedPath
          ? `/id/blog/${translatedPath.slug}`
          : "/id/blog";
      } else if (pathname.startsWith("/notes/") && currentSlug) {
        const translatedPath = Object.values(translationsMap)
          .find((entries) =>
            entries.some(
              (entry) => entry.locale === "en" && entry.slug === currentSlug,
            ),
          )
          ?.find((entry) => entry.locale === "id");

        targetPath = translatedPath
          ? `/id/notes/${translatedPath.slug}`
          : "/id/notes";
      } else {
        targetPath = `/id${pathname}`;
      }
    }

    document.cookie = `NEXT_LOCALE=id; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DISMISS_KEY);
    }
    setVisible(false);
    router.push(targetPath, { scroll: false });
  };

  return (
    <div
      // Sits right below the fixed primary nav (h-16 = top-16).
      // Uses z-45 so it floats above the secondary nav (z-20) but
      // below the header's own z-50 overlays.
      className={cn(
        "fixed left-0 right-0 z-45 top-16",
        "transition-all duration-350 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      )}
      aria-hidden={!visible}
      aria-live="polite"
    >
      {/* Gradient strip — same visual language as the secondary nav bar */}
      <div
        className={cn(
          "w-full border-b border-nav-primary/50",
          "bg-linear-[140deg] from-[hsl(var(--nav-primary)/0.92)] to-[hsl(var(--accent)/0.60)]",
        )}
      >
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="flex h-9 items-center justify-between gap-3">

            {/* Left: Globe + label */}
            <div className="flex items-center gap-2 min-w-0">
              <Globe
                className="h-3.5 w-3.5 text-nav-primary-foreground/70 shrink-0"
                aria-hidden
              />
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.13em] text-nav-primary-foreground/80 truncate">
                {localeSuggestion.title}
              </p>
            </div>

            {/* Right: CTA pill + dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Switch button — matches the "active" pill style in secondary nav */}
              <button
                type="button"
                onClick={handleSwitch}
                className={cn(
                  "inline-flex items-center justify-center",
                  "h-6 px-3 rounded-full shrink-0",
                  "border border-white/80 bg-white text-nav-primary",
                  "font-sans text-[10px] font-black uppercase tracking-[0.12em]",
                  "transition-all hover:bg-white/90 active:scale-[0.97]",
                )}
              >
                {localeSuggestion.switch}
              </button>

              {/* Dismiss — subtle ghost on gradient */}
              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  "text-nav-primary-foreground/50",
                  "hover:text-nav-primary-foreground/90 hover:bg-white/10",
                  "transition-all active:scale-90",
                )}
                aria-label={localeSuggestion.dismiss}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
