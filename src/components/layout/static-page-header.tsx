import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { CalendarClock, Clock, Globe } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type StaticPageHeaderProps = {
  title: string;
  description?: string;
  badgeLabel: string;
  icon: IconComponent;
  lastUpdated?: string;
  readingMinutes?: number;
  locale?: string;
  altLocaleHref?: string;
  altLocaleLabel?: string;
  className?: string;
};

const labels: Record<string, { lastUpdated: string; minRead: string; readIn: string }> = {
  en: {
    lastUpdated: "Last updated",
    minRead: "min read",
    readIn: "Read in",
  },
  id: {
    lastUpdated: "Diperbarui",
    minRead: "menit baca",
    readIn: "Baca dalam",
  },
};

function getLabels(locale?: string) {
  return labels[locale ?? "en"] ?? labels.en;
}

/**
 * Shared header used across static pages (legal, contact, about hero).
 * Renders: badge → title (clamp) → description → meta strip.
 *
 * Meta strip is rendered only when at least one meta value is provided.
 */
export function StaticPageHeader({
  title,
  description,
  badgeLabel,
  icon: Icon,
  lastUpdated,
  readingMinutes,
  locale,
  altLocaleHref,
  altLocaleLabel,
  className,
}: StaticPageHeaderProps) {
  const l = getLabels(locale);
  const hasMeta =
    Boolean(lastUpdated) ||
    Boolean(readingMinutes) ||
    Boolean(altLocaleHref && altLocaleLabel);

  return (
    <ScrollReveal direction="down" delay={0.05}>
      <header className={cn("space-y-4 text-center", className)}>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-accent">
          <Icon className="h-3.5 w-3.5" />
          {badgeLabel}
        </div>

        <h1
          className="font-display font-black tracking-tighter text-primary"
          style={{
            fontSize: "clamp(2rem, 1.75rem + 1.25vw, 3rem)",
            lineHeight: "1.1",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h1>

        {description ? (
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        {hasMeta ? (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-1 text-[11px] font-mono text-muted-foreground/70">
            {lastUpdated ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3" />
                <span className="uppercase tracking-widest">
                  {l.lastUpdated}
                </span>
                <time dateTime={lastUpdated}>{lastUpdated}</time>
              </span>
            ) : null}

            {lastUpdated && readingMinutes ? (
              <span aria-hidden="true" className="text-muted-foreground/40">
                ·
              </span>
            ) : null}

            {readingMinutes ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>
                  {readingMinutes} {l.minRead}
                </span>
              </span>
            ) : null}

            {(lastUpdated || readingMinutes) && altLocaleHref && altLocaleLabel ? (
              <span aria-hidden="true" className="text-muted-foreground/40">
                ·
              </span>
            ) : null}

            {altLocaleHref && altLocaleLabel ? (
              <Link
                href={altLocaleHref}
                hrefLang={altLocaleLabel.toLowerCase()}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 transition-colors hover:border-primary/30 hover:text-primary"
              >
                <Globe className="h-3 w-3" />
                <span>
                  {l.readIn} {altLocaleLabel}
                </span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>
    </ScrollReveal>
  );
}
