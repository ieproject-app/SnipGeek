import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { i18n } from "@/i18n-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the URL prefix for a given locale.
 * Default locale (en) returns "", non-default locales return "/{locale}".
 *
 * @example
 * getLinkPrefix("en")  // ""
 * getLinkPrefix("id")  // "/id"
 */
export function getLinkPrefix(locale: string): string {
  return locale === i18n.defaultLocale ? "" : `/${locale}`;
}

/**
 * Resolves a heroImage field value (either a placeholder ID or a URL/path)
 * into a concrete { src, hint } object ready to pass to <Image>.
 *
 * Returns undefined if no heroImage value is provided.
 *
 * @param heroImageValue - The raw frontmatter heroImage value.
 * @param imageAlt       - Optional alt text to use as the hint.
 * @param title          - Optional title used as fallback hint.
 */
export function resolveHeroImage(
  heroImageValue: string | undefined,
  imageAlt?: string,
  title?: string,
): { src: string; hint: string } | undefined {
  if (!heroImageValue) return undefined;

  if (heroImageValue.startsWith("http") || heroImageValue.startsWith("/")) {
    return {
      src: heroImageValue,
      hint: (imageAlt || title || "article")
        .toString()
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 2)
        .join(" "),
    };
  }

  const placeholder = PlaceHolderImages.find((p) => p.id === heroImageValue);
  if (placeholder) {
    return {
      src: placeholder.imageUrl,
      hint: placeholder.imageHint ?? placeholder.description ?? heroImageValue,
    };
  }

  return undefined;
}

/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "3 days ago").
 * Handles invalid dates gracefully to prevent SSR crashes.
 */
export function formatRelativeTime(date: Date, locale: string = "en") {
  if (!date || isNaN(date.getTime())) {
    return "N/A";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (Math.abs(diffInSeconds) < 60)
      return rtf.format(-diffInSeconds, "second");

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60)
      return rtf.format(-diffInMinutes, "minute");

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) return rtf.format(-diffInHours, "hour");

    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) return rtf.format(-diffInDays, "day");

    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) return rtf.format(-diffInMonths, "month");

    const diffInYears = Math.floor(diffInMonths / 12);
    return rtf.format(-diffInYears, "year");
  } catch {
    return date.toLocaleDateString(locale);
  }
}
