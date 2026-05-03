"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const [visible, setVisible] = useState(false);
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
    if (locale !== "en") return;
    if (typeof window === "undefined") return;

    // On article detail pages the inline ArticleTranslationLink already
    // handles language discovery — suppress the global banner there.
    const isArticlePage =
      /^\/(id\/)?(blog|notes)\/.+/.test(pathname);
    if (isArticlePage) return;

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "true";
    const preferredLocaleCookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    if (dismissed || preferredLocaleCookie === "en") return;
    if (!hasIndonesianPreference()) return;

    setVisible(true);
  }, [locale, pathname]);

  useEffect(() => {
    if (visible) {
      primaryButtonRef.current?.focus({ preventScroll: true });
    }
  }, [visible]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
    setVisible(false);
  };

  const handleStay = () => {
    document.cookie = `NEXT_LOCALE=en; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
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
        "fixed bottom-6 right-4 z-[60] w-[min(90vw,360px)] md:bottom-8 md:right-8",
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
          "relative overflow-hidden rounded-2xl border border-border/40",
          "bg-card/95 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.35)]",
          "backdrop-blur supports-[backdrop-filter]:bg-card/85",
          "dark:shadow-[0_16px_40px_-8px_rgba(8,47,73,0.45)]",
        )}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-4 w-4" aria-hidden />
          <span className="sr-only">{localeSuggestion.dismiss}</span>
        </button>

        <div className="flex items-start gap-4 p-6">
          <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Flag className="h-5 w-5" aria-hidden />
          </span>

          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <p
                id={headingId}
                className="font-display text-base font-semibold uppercase tracking-[0.14em] text-primary"
              >
                {localeSuggestion.title}
              </p>
              <p
                id={descriptionId}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {localeSuggestion.description}
              </p>
            </div>

            <div className="space-y-3">
              <button
                ref={primaryButtonRef}
                type="button"
                onClick={handleSwitch}
                className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_18px_32px_-16px_rgba(244,63,94,0.8)] transition-all hover:shadow-[0_18px_32px_-12px_rgba(244,63,94,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {localeSuggestion.switch}
              </button>
              <button
                type="button"
                onClick={handleStay}
                className="w-full rounded-xl border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {localeSuggestion.stay}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md text-xs font-medium text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {localeSuggestion.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
