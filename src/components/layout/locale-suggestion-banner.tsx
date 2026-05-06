"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Flag, X } from "lucide-react";
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
  const [dismissed, setDismissed] = useState(false);
  const shouldSuggest = useMemo(() => {
    if (locale !== "en") return false;
    if (typeof window === "undefined") return false;

    const isArticlePage = /^\/(id\/)?(blog|notes)\/.+/.test(pathname);
    if (isArticlePage) return false;

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "true";
    const preferredLocaleCookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    if (dismissed || preferredLocaleCookie === "en") return false;
    if (!hasIndonesianPreference()) return false;

    return true;
  }, [locale, pathname]);
  const visible = shouldSuggest && !dismissed;
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  const localeSuggestion = dictionary.localeSuggestion ?? {
    title: "Prefer reading in Bahasa Indonesia?",
    description:
      "We detected your browser prefers Indonesian. Switch to the Indonesian version for localized content and navigation.",
    switch: "Switch to Indonesian",
    stay: "Stay in English",
    dismiss: "Dismiss language suggestion",
  };

  useEffect(() => {
    if (visible) {
      primaryButtonRef.current?.focus({ preventScroll: true });
    }
  }, [visible]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
    setDismissed(true);
  };

  const handleStay = () => {
    document.cookie = `NEXT_LOCALE=en; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
    setDismissed(true);
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
    setDismissed(true);
    router.push(targetPath, { scroll: false });
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-3 z-[60] w-[min(90vw,340px)] md:bottom-5 md:right-5",
        "transition-all duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-3 opacity-0 pointer-events-none",
      )}
      aria-hidden={!visible}
      aria-live="polite"
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      {...(!visible ? { inert: true } : {})}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/60",
          "bg-card shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]",
          "dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]",
        )}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={localeSuggestion.dismiss}
          className="absolute right-2.5 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>

        <div className="flex flex-col gap-3 px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flag className="h-3 w-3" aria-hidden />
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em]">
              Language
            </span>
          </div>

          <div className="space-y-1 pr-6">
            <p
              id={headingId}
              className="font-sans text-sm font-semibold leading-snug text-foreground"
            >
              {localeSuggestion.title}
            </p>
            <p
              id={descriptionId}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {localeSuggestion.description}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={handleSwitch}
              className="group/btn relative -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-accent outline-none transition-all hover:text-accent/80 focus-visible:bg-accent/10 focus-visible:text-accent"
            >
              <span className="relative">
                {localeSuggestion.switch}
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover/btn:scale-x-100 group-focus-visible/btn:scale-x-100" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-focus-visible/btn:translate-x-0.5"
              >
                →
              </span>
            </button>
            <button
              type="button"
              onClick={handleStay}
              className="rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:bg-muted/60 focus-visible:text-foreground"
            >
              {localeSuggestion.stay}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
