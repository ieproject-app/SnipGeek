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
};

const sectionIconMap: Record<string, IconComponent> = {
  // Disclaimer EN
  "1-general-disclaimer": Shield,
  "2-tutorials-and-guides": FileText,
  "3-downloads-and-third-party-files": Download,
  "4-tools-and-utilities": AlertTriangle,
  "5-external-links": ExternalLink,
  "6-not-professional-advice": Scale,
  "7-limitation-of-liability": Gavel,
  "8-changes-to-this-disclaimer": RefreshCw,
  "9-contact": Mail,
  // Disclaimer ID
  "1-disclaimer-umum": Shield,
  "2-tutorial-dan-panduan": FileText,
  "3-unduhan-dan-file-pihak-ketiga": Download,
  "4-tools-dan-utilitas": AlertTriangle,
  "5-tautan-eksternal": ExternalLink,
  "6-bukan-nasihat-profesional": Scale,
  "7-batasan-tanggung-jawab": Gavel,
  "8-perubahan-pada-disclaimer-ini": RefreshCw,
  "9-kontak": Mail,
  // Privacy EN
  "1-general-information": Eye,
  "2-cookies": Cookie,
  "3-data-we-collect": Database,
  "4-third-party-services": ExternalLink,
  "5-childrens-privacy": Baby,
  "6-your-rights-gdpr-data-privacy": HandCoins,
  "7-changes-to-this-policy": RefreshCw,
  "8-contact-us": MessageSquare,
  // Privacy ID
  "1-informasi-umum": Eye,
  "2-cookie": Cookie,
  "3-data-yang-kami-kumpulkan": Database,
  "4-layanan-pihak-ketiga": ExternalLink,
  "5-privasi-anak": Baby,
  "6-hak-anda-gdpr-privasi-data": HandCoins,
  "7-perubahan-kebijakan-ini": RefreshCw,
  "8-hubungi-kami": MessageSquare,
  // Terms EN
  "1-introduction": FileText,
  "2-acceptance-of-terms": UserCheck,
  "3-user-accounts": UserCheck,
  "4-use-of-services": AlertTriangle,
  "5-content-ownership": Shield,
  "6-tools-and-generated-output": AlertTriangle,
  "7-disclaimer-of-warranties": Scale,
  "8-limitation-of-liability": Gavel,
  "9-external-services-and-links": ExternalLink,
  "10-changes-to-these-terms": RefreshCw,
  "11-contact": Mail,
  // Terms ID
  "1-pendahuluan": FileText,
  "2-penerimaan-ketentuan": UserCheck,
  "3-akun-pengguna": UserCheck,
  "4-penggunaan-layanan": AlertTriangle,
  "5-kepemilikan-konten": Shield,
  "6-tools-dan-hasil-yang-dihasilkan": AlertTriangle,
  "7-penafian-jaminan": Scale,
  "8-batasan-tanggung-jawab": Gavel,
  "9-layanan-dan-tautan-eksternal": ExternalLink,
  "10-perubahan-pada-ketentuan-ini": RefreshCw,
  "11-kontak": Mail,
};

function getSectionIcon(headingId: string): IconComponent {
  return sectionIconMap[headingId] || FileText;
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
              <LegalSectionCards content={content} headings={headings} />
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
}: {
  content: string;
  headings: Heading[];
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
      const SectionIcon = heading ? getSectionIcon(heading.id) : FileText;
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
