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
  const altLocale = getStaticPageAltLocale("terms", locale);
  const { minutes: readingMinutes } = getReadingTime(content);

  const title =
    getStaticPageTitle(
      frontmatter,
      locale === "id" ? "Ketentuan Layanan" : "Terms of Service",
    ) || (locale === "id" ? "Ketentuan Layanan" : "Terms of Service");

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
      sectionIcons={frontmatter.sectionIcons}
      footerNote={
        locale === "id"
          ? "Dengan terus menggunakan SnipGeek, Anda dianggap menyetujui ketentuan yang berlaku."
          : "By continuing to use SnipGeek, you are considered to have accepted the applicable terms."
      }
      footerCtas={[
        {
          label: locale === "id" ? "Hubungi kami" : "Contact us",
          href: locale === "id" ? "/id/contact" : "/contact",
        },
        {
          label:
            locale === "id"
              ? "Lihat Kebijakan Privasi"
              : "View Privacy Policy",
          href: locale === "id" ? "/id/privacy" : "/privacy",
        },
      ]}
    />
  );
}
