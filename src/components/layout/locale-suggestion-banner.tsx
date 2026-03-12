"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
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
      className={cn(
        "pointer-events-none fixed inset-x-0 top-[4.5rem] z-[120] px-3 transition-all duration-200 sm:px-4",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-accent/20 bg-background/95 px-4 py-3 shadow-2xl ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground sm:text-sm">
            {localeSuggestion.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {localeSuggestion.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSwitch}
              className="inline-flex h-8 items-center justify-center rounded-full bg-accent px-3.5 text-xs font-semibold text-accent-foreground transition-all hover:opacity-90 active:scale-[0.98] sm:h-9 sm:px-4 sm:text-sm"
            >
              {localeSuggestion.switch}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex h-8 items-center justify-center rounded-full border border-border px-3.5 text-xs font-semibold text-foreground/80 transition-all hover:bg-muted active:scale-[0.98] sm:h-9 sm:px-4 sm:text-sm"
            >
              {localeSuggestion.stay}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-all hover:bg-muted hover:text-foreground/80 active:scale-95"
          aria-label={localeSuggestion.dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
