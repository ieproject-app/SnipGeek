import Link from "next/link";
import { Languages } from "lucide-react";

interface ArticleTranslationLinkProps {
  /**
   * The URL path to the translated version of this article.
   * If null/undefined, the component renders nothing.
   */
  translationHref: string | null | undefined;
  /**
   * The locale of the *current* page ("en" | "id").
   * Used to determine the CTA copy direction.
   */
  currentLocale: string;
  className?: string;
}

/**
 * Inline contextual banner shown inside an article when a translated version
 * exists in the other language. Renders nothing when no translation is found.
 *
 * Intentionally server-rendered — no client JS needed.
 */
export function ArticleTranslationLink({
  translationHref,
  currentLocale,
  className,
}: ArticleTranslationLinkProps) {
  if (!translationHref) return null;

  const isCurrentlyEnglish = currentLocale === "en";

  const label = isCurrentlyEnglish
    ? "Artikel ini tersedia dalam Bahasa Indonesia"
    : "This article is available in English";

  const cta = isCurrentlyEnglish ? "Baca dalam ID →" : "Read in English →";

  return (
    <div
      className={`my-8 max-w-3xl mx-auto ${className ?? ""}`}
      aria-label={label}
    >
      <Link
        href={translationHref}
        className={[
          "group flex items-center gap-3 w-full",
          "px-4 py-3 rounded-xl",
          "border border-primary/10 bg-muted/30",
          "hover:bg-accent/10 hover:border-accent/30",
          "transition-all duration-300",
        ].join(" ")}
      >
        <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-accent/15 group-hover:bg-accent/25 transition-colors duration-300">
          <Languages className="h-3.5 w-3.5 text-accent" aria-hidden />
        </span>

        <span className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
          <span className="text-[13px] font-medium text-muted-foreground leading-snug truncate">
            {label}
          </span>
          <span className="hidden sm:inline text-primary/20 font-light">
            —
          </span>
          <span className="text-[13px] font-bold text-accent group-hover:underline underline-offset-2 shrink-0">
            {cta}
          </span>
        </span>
      </Link>
    </div>
  );
}
