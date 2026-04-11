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
    slug: "terms",
    locale,
    fallbackTitle: "Terms of Service",
    fallbackDescription:
      "SnipGeek terms of service — rules for using our site, tools, and content.",
    robots: { index: true, follow: true },
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { frontmatter, content } = await getStaticPageData("terms", locale);
  const canonicalPath = getStaticPageCanonicalPath("terms", locale);

  const title =
    getStaticPageTitle(
      frontmatter,
      locale === "id" ? "Ketentuan Layanan" : "Terms of Service",
    ) || (locale === "id" ? "Ketentuan Layanan" : "Terms of Service");

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
      maxWidthClassName="max-w-3xl"
      canonicalUrl={`https://snipgeek.com${canonicalPath}`}
      footerNote={
        locale === "id"
          ? "Dengan terus menggunakan SnipGeek, Anda dianggap menyetujui ketentuan yang berlaku."
          : "By continuing to use SnipGeek, you are considered to have accepted the applicable terms."
      }
    />
  );
}
