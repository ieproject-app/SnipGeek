import type { Metadata } from "next";
import type { Locale } from "@/i18n-config";
import {
  generateStaticPageMetadata,
  getStaticPageData,
  getStaticPageDescription,
  getStaticPageLastUpdated,
  getStaticPageTitle,
} from "@/lib/static-pages";
import {
  StaticPageTemplate,
  resolveStaticPageIcon,
} from "@/components/layout/static-page-template";

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
      "SnipGeek privacy policy — including Google AdSense advertising, cookies, and how we handle your data.",
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

  const title =
    getStaticPageTitle(
      frontmatter,
      locale === "id" ? "Kebijakan Privasi" : "Privacy Policy",
    ) || (locale === "id" ? "Kebijakan Privasi" : "Privacy Policy");

  const description = getStaticPageDescription(frontmatter);
  const lastUpdated = getStaticPageLastUpdated(frontmatter);

  return (
    <StaticPageTemplate
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
      footerNote={
        locale === "id"
          ? "Kebijakan ini berlaku untuk SnipGeek dan seluruh halamannya."
          : "This policy applies to SnipGeek and all of its pages."
      }
    />
  );
}
