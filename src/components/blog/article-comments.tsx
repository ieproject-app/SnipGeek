"use client";

import { DiscussionEmbed } from "disqus-react";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, ShieldCheck, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const productionHostname = "snipgeek.com";
const disqusShortname = "snipgeek-com";

interface ArticleCommentsProps {
  article: {
    slug: string;
    title: string;
  };
  type: "blog" | "note";
  locale: string;
}

export function ArticleComments({ article, type, locale }: ArticleCommentsProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isProductionDomain, setIsProductionDomain] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const isProduction = process.env.NODE_ENV === "production";
    const isCorrectDomain =
      typeof window !== "undefined" &&
      window.location.hostname === productionHostname;

    setIsProductionDomain(isProduction && isCorrectDomain);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (isProduction && isCorrectDomain) {
            setShouldLoad(true);
          }
          observer.disconnect();
        }
      },
      {
        rootMargin: "240px 0px",
      },
    );

    if (commentsRef.current) {
      observer.observe(commentsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const canonicalUrl = `https://${productionHostname}/${type}/${article.slug}`;

  if (!mounted || (isProductionDomain && !shouldLoad)) {
    return (
      <section
        ref={commentsRef}
        className="mt-16 border-t border-primary/10 pt-12 animate-in fade-in duration-700"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-primary">
              {locale === "id" ? "Diskusi" : "Discussion"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "id"
                ? "Menyiapkan area komentar..."
                : "Preparing the comments area..."}
            </p>
          </div>
        </div>

        <div className="space-y-8 rounded-2xl border border-primary/10 bg-card/40 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Skeleton
              className="h-10 w-10 shrink-0 rounded-full"
              data-variant="static"
            />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" data-variant="pulse" />
              <Skeleton
                className="h-20 w-full rounded-xl"
                data-variant="pulse"
              />
            </div>
          </div>
          <div className="space-y-6 pl-14">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 opacity-50">
                <Skeleton
                  className="h-8 w-8 shrink-0 rounded-full"
                  data-variant="static"
                />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" data-variant="pulse" />
                  <Skeleton
                    className="h-12 w-full rounded-lg"
                    data-variant="pulse"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!isProductionDomain) {
    return (
      <section
        ref={commentsRef}
        className="mt-16 border-t border-primary/10 pt-12"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-primary">
              {locale === "id" ? "Diskusi" : "Discussion"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "id"
                ? "Kolom komentar aktif di situs utama."
                : "Comments are active on the live site."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-linear-to-br from-muted/40 via-background to-muted/10 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-primary">
                  {locale === "id"
                    ? "Komentar hanya tersedia di situs utama"
                    : "Comments are only available on the live site"}
                </h4>
                <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary/80">
                  {productionHostname}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {locale === "id"
                  ? "Untuk menjaga thread Disqus tetap konsisten dan tidak terpecah antara development, preview, dan production, area komentar hanya dimuat di domain produksi."
                  : "To keep Disqus threads consistent and avoid fragmentation across development, preview, and production environments, the comments area only loads on the production domain."}
              </p>

              <a
                href={canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
              >
                {locale === "id" ? "Buka versi live" : "Open live version"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={commentsRef}
      className="mt-16 border-t border-primary/10 pt-12"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-primary">
            {locale === "id" ? "Diskusi" : "Discussion"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {locale === "id"
              ? "Bagikan pendapat atau pengalaman Anda tentang topik ini."
              : "Share your thoughts or experience about this topic."}
          </p>
        </div>
      </div>

      <DiscussionEmbed
        shortname={disqusShortname}
        config={{
          url: canonicalUrl,
          identifier: article.slug,
          title: article.title,
          language: locale,
        }}
      />
    </section>
  );
}
