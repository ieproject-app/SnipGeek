import type { Metadata } from "next";
import type { Locale } from "@/i18n-config";
import {
  generateStaticPageMetadata,
  getStaticPageData,
  getStaticPageDescription,
  getStaticPageLastUpdated,
  getStaticPageTitle,
  getStaticPageCanonicalPath,
} from "@/lib/static-pages";
import {
  LayoutStaticPageTemplate,
  resolveStaticPageIcon,
} from "@/components/layout/static-page-template";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generateStaticPageMetadata({
    slug: "disclaimer",
    locale,
    fallbackTitle: "Disclaimer",
    fallbackDescription:
      "SnipGeek disclaimer — important information about using our content, tutorials, tools, and downloads.",
    robots: { index: true, follow: true },
  });
}

export default async function DisclaimerPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { frontmatter, content } = await getStaticPageData("disclaimer", locale);
  const canonicalPath = getStaticPageCanonicalPath("disclaimer", locale);

  const title = getStaticPageTitle(frontmatter, "Disclaimer") || "Disclaimer";

  const description = getStaticPageDescription(frontmatter);
  const lastUpdated = getStaticPageLastUpdated(frontmatter);

  return (
    <LayoutStaticPageTemplate
      title={title}
      description={description}
      lastUpdated={lastUpdated}
      content={content}
      badgeLabel={
        frontmatter.badgeLabel ||
        (locale === "id" ? "Dokumen Resmi" : "Official Document")
      }
      icon={resolveStaticPageIcon(frontmatter.icon)}
      canonicalUrl={`https://snipgeek.com${canonicalPath}`}
      maxWidthClassName="max-w-3xl"
      footerNote={
        locale === "id"
          ? "Dengan menggunakan SnipGeek, Anda mengakui bahwa Anda telah membaca dan memahami Disclaimer ini."
          : "By using SnipGeek, you acknowledge that you have read and understood this Disclaimer."
      }
    />
  );
}
