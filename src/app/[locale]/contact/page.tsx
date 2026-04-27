import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";
import type { Locale } from "@/i18n-config";
import {
  generateStaticPageMetadata,
  getStaticPageData,
  getStaticPageDescription,
  getStaticPageLastUpdated,
  getStaticPageTitle,
  getStaticPageCanonicalPath,
  getStaticPageAltLocale,
} from "@/lib/static-pages";
import { resolveLegalPageIcon } from "@/components/layout/legal-page-template";
import { StaticPageHeader } from "@/components/layout/static-page-header";
import { StaticPageFooterCard } from "@/components/layout/static-page-footer";
import { ReadingProgress } from "@/components/layout/reading-progress";
import { mdxComponents } from "@/components/mdx-components";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generateStaticPageMetadata({
    slug: "contact",
    locale,
    fallbackTitle: locale === "id" ? "Kontak" : "Contact",
    fallbackDescription:
      locale === "id"
        ? "Hubungi SnipGeek untuk pertanyaan, masukan, kolaborasi, atau hal lain terkait konten."
        : "Get in touch with SnipGeek for questions, feedback, collaboration, or content-related inquiries.",
  });
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "id" }];
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { frontmatter, content } = await getStaticPageData("contact", locale);
  const canonicalPath = getStaticPageCanonicalPath("contact", locale);
  const altLocale = getStaticPageAltLocale("contact", locale);

  const title =
    getStaticPageTitle(frontmatter, locale === "id" ? "Kontak" : "Contact") ||
    (locale === "id" ? "Kontak" : "Contact");
  const description = getStaticPageDescription(frontmatter);
  const lastUpdated = getStaticPageLastUpdated(frontmatter);
  const badgeLabel =
    typeof frontmatter.badgeLabel === "string" && frontmatter.badgeLabel
      ? frontmatter.badgeLabel
      : locale === "id"
        ? "Kontak Resmi"
        : "Official Contact";
  const Icon = resolveLegalPageIcon(
    typeof frontmatter.icon === "string" ? frontmatter.icon : undefined,
  );

  const isId = locale === "id";

  return (
    <div className="w-full">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: title,
            description: description,
            url: `https://snipgeek.com${canonicalPath}`,
            inLanguage: locale,
            mainEntity: {
              "@type": "EmailMessage",
              email: "iwan.efndi@gmail.com",
            },
          }),
        }}
      />
      <main className="mx-auto max-w-3xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        <StaticPageHeader
          title={title}
          description={description}
          badgeLabel={badgeLabel}
          icon={Icon}
          lastUpdated={lastUpdated}
          locale={locale}
          altLocaleHref={altLocale?.href}
          altLocaleLabel={altLocale?.label}
          className="mb-8"
        />

        <article className="prose-content text-lg text-foreground/80">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [[rehypeShiki, { theme: "github-dark" }]],
              },
            }}
          />
        </article>

        <StaticPageFooterCard
          ctas={[
            {
              label: isId ? "Lihat Kebijakan Privasi" : "View Privacy Policy",
              href: isId ? "/id/privacy" : "/privacy",
            },
            {
              label: isId ? "Lihat Disclaimer" : "View Disclaimer",
              href: isId ? "/id/disclaimer" : "/disclaimer",
            },
          ]}
        />
      </main>
    </div>
  );
}
