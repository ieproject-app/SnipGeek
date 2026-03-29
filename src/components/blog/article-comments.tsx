"use client";

import Giscus from "@giscus/react";
import { DiscussionEmbed } from "disqus-react";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, ShieldCheck, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useThemeMode } from "@/hooks/use-theme-mode";

const productionHostname = "snipgeek.com";
const disqusShortname = "snipgeek-com";

const GISCUS_REPO = "ieproject-app/SnipGeek" as const;
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "";
const GISCUS_CATEGORY = "Comments";
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "";

interface ArticleCommentsProps {
  article: {
    slug: string;
    title: string;
  };
  type: "blog" | "note";
  locale: string;
}

export function ArticleComments({ article, type, locale }: ArticleCommentsProps) {
  const [activeTab, setActiveTab] = useState<"giscus" | "disqus">("giscus");
  const [giscusVisible, setGiscusVisible] = useState(false);
  const [disqusLoaded, setDisqusLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isProductionDomain, setIsProductionDomain] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useThemeMode();

  const giscusTheme = resolvedTheme === "dark" ? "dark_dimmed" : "light";

  useEffect(() => {
    setMounted(true);

    const isProduction = process.env.NODE_ENV === "production";
    const isCorrectDomain =
      typeof window !== "undefined" &&
      window.location.hostname === productionHostname;

    setIsProductionDomain(isProduction && isCorrectDomain);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGiscusVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    if (commentsRef.current) {
      observer.observe(commentsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleDisqusTabClick = () => {
    setActiveTab("disqus");
    setDisqusLoaded(true);
  };

  const canonicalUrl = `https://${productionHostname}/${type}/${article.slug}`;

  const i18n = {
    discussion: locale === "id" ? "Diskusi" : "Discussion",
    subtitle:
      locale === "id"
        ? "Bagikan pendapat atau pengalaman Anda tentang topik ini."
        : "Share your thoughts or experience about this topic.",
    preparing:
      locale === "id"
        ? "Menyiapkan area komentar..."
        : "Preparing the comments area...",
    liveOnly:
      locale === "id"
        ? "Komentar hanya tersedia di situs utama"
        : "Comments are only available on the live site",
    liveOnlyDesc:
      locale === "id"
        ? "Untuk menjaga thread tetap konsisten, area komentar hanya dimuat di domain produksi."
        : "To keep threads consistent, the comments area only loads on the production domain.",
    openLive: locale === "id" ? "Buka versi live" : "Open live version",
    tabGiscus: locale === "id" ? "Diskusi" : "Discussion",
    tabDisqus: "Disqus",
    legacy: "Legacy",
  };

  // ─── Skeleton (before mounted OR waiting for intersection) ───────────────
  if (!mounted || (!giscusVisible && activeTab === "giscus")) {
    return (
      <section
        ref={commentsRef}
        className="mt-16 border-t border-primary/10 pt-12 animate-in fade-in duration-700"
      >
        <CommentsHeader title={i18n.discussion} subtitle={i18n.preparing} />
        <TabBar
          activeTab={activeTab}
          onGiscus={() => setActiveTab("giscus")}
          onDisqus={handleDisqusTabClick}
          i18n={i18n}
        />
        <div className="space-y-8 rounded-2xl border border-primary/10 bg-card/40 p-6 shadow-sm mt-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" data-variant="static" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" data-variant="pulse" />
              <Skeleton className="h-20 w-full rounded-xl" data-variant="pulse" />
            </div>
          </div>
          <div className="space-y-6 pl-14">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 opacity-50">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" data-variant="static" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" data-variant="pulse" />
                  <Skeleton className="h-12 w-full rounded-lg" data-variant="pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={commentsRef}
      className="mt-16 border-t border-primary/10 pt-12 animate-in fade-in duration-700"
    >
      <CommentsHeader title={i18n.discussion} subtitle={i18n.subtitle} />

      <TabBar
        activeTab={activeTab}
        onGiscus={() => setActiveTab("giscus")}
        onDisqus={handleDisqusTabClick}
        i18n={i18n}
      />

      <div className="mt-4">
        {/* ─── GISCUS TAB ─────────────────────────────────────────────── */}
        <div className={activeTab === "giscus" ? "block" : "hidden"}>
          {GISCUS_REPO_ID && GISCUS_CATEGORY_ID ? (
            <Giscus
              repo={GISCUS_REPO}
              repoId={GISCUS_REPO_ID}
              category={GISCUS_CATEGORY}
              categoryId={GISCUS_CATEGORY_ID}
              mapping="pathname"
              strict="0"
              reactionsEnabled="1"
              emitMetadata="0"
              inputPosition="bottom"
              theme={giscusTheme}
              lang="id"
              loading="lazy"
            />
          ) : (
            <EnvMissingNotice />
          )}
        </div>

        {/* ─── DISQUS TAB ─────────────────────────────────────────────── */}
        <div className={activeTab === "disqus" ? "block" : "hidden"}>
          {disqusLoaded && isProductionDomain ? (
            <DiscussionEmbed
              shortname={disqusShortname}
              config={{
                url: canonicalUrl,
                identifier: article.slug,
                title: article.title,
                language: locale,
              }}
            />
          ) : disqusLoaded && !isProductionDomain ? (
            <DevPlaceholder
              canonicalUrl={canonicalUrl}
              i18n={i18n}
              productionHostname={productionHostname}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CommentsHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageSquare className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

interface TabBarProps {
  activeTab: "giscus" | "disqus";
  onGiscus: () => void;
  onDisqus: () => void;
  i18n: { tabGiscus: string; tabDisqus: string; legacy: string };
}

function TabBar({ activeTab, onGiscus, onDisqus, i18n }: TabBarProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onGiscus}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
          activeTab === "giscus"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "border border-primary/15 text-muted-foreground hover:border-primary/30 hover:text-primary"
        }`}
      >
        {i18n.tabGiscus}
      </button>
      <button
        onClick={onDisqus}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
          activeTab === "disqus"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "border border-primary/15 text-muted-foreground hover:border-primary/30 hover:text-primary"
        }`}
      >
        {i18n.tabDisqus}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-black tracking-widest text-muted-foreground/70 uppercase">
          {i18n.legacy}
        </span>
      </button>
    </div>
  );
}

function DevPlaceholder({
  canonicalUrl,
  i18n,
  productionHostname,
}: {
  canonicalUrl: string;
  i18n: { liveOnly: string; liveOnlyDesc: string; openLive: string };
  productionHostname: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-linear-to-br from-muted/40 via-background to-muted/10 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-primary">{i18n.liveOnly}</h4>
            <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary/80">
              {productionHostname}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {i18n.liveOnlyDesc}
          </p>
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
          >
            {i18n.openLive}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function EnvMissingNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-600">
      <p className="font-bold">Giscus env vars missing</p>
      <p className="mt-1 text-xs opacity-70">
        Set <code>NEXT_PUBLIC_GISCUS_REPO_ID</code> and{" "}
        <code>NEXT_PUBLIC_GISCUS_CATEGORY_ID</code> in your .env.local
      </p>
    </div>
  );
}
