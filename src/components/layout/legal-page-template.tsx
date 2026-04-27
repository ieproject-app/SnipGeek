import React from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { mdxComponents } from "@/components/mdx-components";
import { cn } from "@/lib/utils";
import { extractHeadings, type Heading } from "@/lib/mdx-utils";
import { TocSidebar, TocMobile } from "@/components/layout/toc-sidebar";
import { StaticPageHeader } from "@/components/layout/static-page-header";
import {
  StaticPageFooterCard,
  type StaticPageFooterCta,
} from "@/components/layout/static-page-footer";
import { ReadingProgress } from "@/components/layout/reading-progress";
import type { ComponentType, SVGProps } from "react";
import {
  Shield,
  FileText,
  Mail,
  ScrollText,
  BadgeInfo,
  Scale,
  AlertTriangle,
  Download,
  ExternalLink,
  UserCheck,
  Gavel,
  Eye,
  Cookie,
  Database,
  Baby,
  HandCoins,
  RefreshCw,
  MessageSquare,
  Hash,
} from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type LegalPageTemplateProps = {
  title: string;
  description?: string;
  lastUpdated?: string;
  content: string;
  badgeLabel?: string;
  icon?: IconComponent;
  footerNote?: string;
  footerCtas?: StaticPageFooterCta[];
  canonicalUrl?: string;
  locale?: string;
  readingMinutes?: number;
  altLocaleHref?: string;
  altLocaleLabel?: string;
  /**
   * Map of heading id (slug) → lucide icon name. Sourced from MDX
   * frontmatter so authors can colocate section icons with content.
   */
  sectionIcons?: Record<string, string>;
};

/**
 * Lucide icon name → component map. Authors reference icons by string
 * in MDX frontmatter (e.g. `sectionIcons: { "1-general-disclaimer": "Shield" }`)
 * and this resolver maps it back to a React component at render time.
 */
const lucideByName: Record<string, IconComponent> = {
  Shield,
  FileText,
  Mail,
  ScrollText,
  BadgeInfo,
  Scale,
  AlertTriangle,
  Download,
  ExternalLink,
  UserCheck,
  Gavel,
  Eye,
  Cookie,
  Database,
  Baby,
  HandCoins,
  RefreshCw,
  MessageSquare,
};

function getSectionIcon(
  headingId: string,
  overrides?: Record<string, string>,
): IconComponent {
  const overrideName = overrides?.[headingId];
  if (overrideName) {
    return lucideByName[overrideName] ?? FileText;
  }
  return FileText;
}

const iconMap: Record<string, IconComponent> = {
  shield: Shield,
  filetext: FileText,
  mail: Mail,
  scrolltext: ScrollText,
  badgeinfo: BadgeInfo,
};

export function resolveLegalPageIcon(
  icon?: string | IconComponent,
): IconComponent {
  if (!icon) return FileText;
  if (typeof icon !== "string") return icon;

  const normalized = icon.replace(/[\s_-]/g, "").toLowerCase();
  return iconMap[normalized] || FileText;
}

const tocLabels: Record<string, string> = {
  en: "Contents",
  id: "Daftar isi",
};

export function LayoutLegalPageTemplate({
  title,
  description,
  lastUpdated,
  content,
  badgeLabel = "Official Document",
  icon: Icon = FileText,
  footerNote,
  footerCtas,
  canonicalUrl = "https://snipgeek.com",
  locale = "en",
  readingMinutes,
  altLocaleHref,
  altLocaleLabel,
  sectionIcons,
}: LegalPageTemplateProps) {
  const headings: Heading[] = extractHeadings(content);
  const tocLabel = tocLabels[locale] ?? tocLabels.en;

  return (
    <div className="w-full">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description: description,
            url: canonicalUrl,
            inLanguage: locale,
          }),
        }}
      />
      <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        <StaticPageHeader
          title={title}
          description={description}
          badgeLabel={badgeLabel}
          icon={Icon}
          lastUpdated={lastUpdated}
          readingMinutes={readingMinutes}
          locale={locale}
          altLocaleHref={altLocaleHref}
          altLocaleLabel={altLocaleLabel}
          className="mb-10"
        />

        {/* Mobile TOC — horizontal scroll pills */}
        {headings.length > 0 && (
          <ScrollReveal direction="up" delay={0.08}>
            <div className="mb-8 lg:hidden">
              <TocMobile headings={headings} />
            </div>
          </ScrollReveal>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr_200px]">
          {/* Desktop TOC — sticky sidebar in left gutter */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="w-[200px] rounded-2xl border border-primary/10 bg-card/30 p-4 backdrop-blur-sm">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {tocLabel}
                  </p>
                  <TocSidebar headings={headings} />
                </div>
              </div>
            </aside>
          )}

          {/* Main content with section cards — centered */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mx-auto w-full max-w-3xl">
              <LegalSectionCards
                content={content}
                headings={headings}
                sectionIcons={sectionIcons}
              />
            </div>
          </ScrollReveal>

          {/* Right spacer for balance */}
          <div className="hidden lg:block" />
        </div>

        <StaticPageFooterCard note={footerNote} ctas={footerCtas} />
      </main>
    </div>
  );
}

/**
 * Renders MDX content with each H2 section wrapped in its own card.
 * Uses a custom h2 component that injects:
 *  - section index pill (01 / N)
 *  - section icon
 *  - hover anchor `#` affordance
 */
function LegalSectionCards({
  content,
  headings,
  sectionIcons,
}: {
  content: string;
  headings: Heading[];
  sectionIcons?: Record<string, string>;
}) {
  const h2Headings = headings.filter((h) => h.level === 2);
  const totalSections = h2Headings.length;
  const totalLabel = String(totalSections).padStart(2, "0");

  const legalMdxComponents = {
    ...mdxComponents,
    h2: ({
      children,
      class: _class,
      className,
      ...props
    }: {
      children?: React.ReactNode;
      class?: string;
      className?: string;
    } & React.HTMLAttributes<HTMLElement>) => {
      const text = String(
        React.Children.toArray(children ?? [])
          .map((c) => (typeof c === "string" ? c : ""))
          .join(""),
      ).trim();

      const headingIndex = h2Headings.findIndex((h) => h.text === text);
      const heading = headingIndex >= 0 ? h2Headings[headingIndex] : undefined;
      const SectionIcon = heading
        ? getSectionIcon(heading.id, sectionIcons)
        : FileText;
      const id = heading?.id ?? extractIdFromChildren(children);

      const indexLabel =
        headingIndex >= 0 ? String(headingIndex + 1).padStart(2, "0") : "";

      return (
        <div className="group/section mt-12 mb-4 first:mt-0">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10">
              <SectionIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                {indexLabel}
                <span className="mx-1 text-muted-foreground/40">/</span>
                {totalLabel}
              </p>
              <div className="flex items-center gap-2">
                <h2
                  id={id}
                  className={cn(
                    "font-display text-lg font-black tracking-tighter leading-snug text-primary scroll-mt-24",
                    _class,
                    className,
                  )}
                  {...props}
                >
                  {children}
                </h2>
                {id ? (
                  <a
                    href={`#${id}`}
                    aria-label={`Anchor link to ${text}`}
                    className="opacity-0 transition-opacity group-hover/section:opacity-100 focus:opacity-100"
                  >
                    <Hash className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div className="h-0.5 w-full bg-linear-to-r from-accent/50 via-accent/25 to-transparent" />
        </div>
      );
    },
  };

  return (
    <article className="rounded-2xl border border-primary/10 bg-card/40 p-6 shadow-sm backdrop-blur-sm sm:p-8">
      <div className="prose-content text-lg text-foreground/80 [&>div:first-child]:mt-0 [&>div:first-child]>div:first-child]:mt-0">
        <MDXRemote
          source={content}
          components={legalMdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [[rehypeShiki, { theme: "github-dark" }]],
            },
          }}
        />
      </div>
    </article>
  );
}

function extractIdFromChildren(children: React.ReactNode): string | undefined {
  const text = React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (React.isValidElement(child)) {
        return extractIdFromChildren(
          (child.props as { children?: React.ReactNode }).children,
        );
      }
      return "";
    })
    .join("");

  if (!text) return undefined;

  // Same slugify as mdx-utils
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
