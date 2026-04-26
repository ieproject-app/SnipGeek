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
  LayoutLegalPageTemplate,
  resolveLegalPageIcon,
} from "@/components/layout/legal-page-template";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generateStaticPageMetadata({
    slug: "privacy",
    locale,
    fallbackTitle: "Privacy Policy",
    fallbackDescription:
      "SnipGeek privacy policy — covering cookies, analytics, and how we handle your data.",
    robots: { index: true, follow: true },
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { frontmatter, content } = await getStaticPageData("privacy", locale);
  const canonicalPath = getStaticPageCanonicalPath("privacy", locale);

  const title =
    getStaticPageTitle(
      frontmatter,
      locale === "id" ? "Kebijakan Privasi" : "Privacy Policy",
    ) || (locale === "id" ? "Kebijakan Privasi" : "Privacy Policy");

  const description = getStaticPageDescription(frontmatter);
  const lastUpdated = getStaticPageLastUpdated(frontmatter);

  return (
    <LayoutLegalPageTemplate
      title={title}
      description={description}
      lastUpdated={lastUpdated}
      content={content}
      badgeLabel={
        frontmatter.badgeLabel ||
        (locale === "id" ? "Dokumen Resmi" : "Official Document")
      }
      icon={resolveLegalPageIcon(frontmatter.icon)}
      canonicalUrl={`https://snipgeek.com${canonicalPath}`}
      footerNote={
        locale === "id"
          ? "Kebijakan ini berlaku untuk SnipGeek dan seluruh halamannya."
          : "This policy applies to SnipGeek and all of its pages."
      }
    />
  );
}
