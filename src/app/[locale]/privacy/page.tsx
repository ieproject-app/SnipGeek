import type { Metadata } from "next";
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
import {
  LayoutLegalPageTemplate,
  resolveLegalPageIcon,
} from "@/components/layout/legal-page-template";
import { getReadingTime } from "@/lib/reading-time";

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
  const altLocale = getStaticPageAltLocale("privacy", locale);
  const { minutes: readingMinutes } = getReadingTime(content);

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
      locale={locale}
      readingMinutes={readingMinutes}
      altLocaleHref={altLocale?.href}
      altLocaleLabel={altLocale?.label}
      footerNote={
        locale === "id"
          ? "Kebijakan ini berlaku untuk SnipGeek dan seluruh halamannya."
          : "This policy applies to SnipGeek and all of its pages."
      }
      footerCtas={[
        {
          label: locale === "id" ? "Hubungi kami" : "Contact us",
          href: locale === "id" ? "/id/contact" : "/contact",
        },
        {
          label: locale === "id" ? "Lihat Disclaimer" : "View Disclaimer",
          href: locale === "id" ? "/id/disclaimer" : "/disclaimer",
        },
      ]}
    />
  );
}
