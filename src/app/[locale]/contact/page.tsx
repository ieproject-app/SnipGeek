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

  const fallbackTitle = locale === "id" ? "Kontak" : "Contact";
  const canonicalPath = getStaticPageCanonicalPath("contact", locale);

  const title = getStaticPageTitle(frontmatter, fallbackTitle) || fallbackTitle;
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
        (locale === "id" ? "Kontak Resmi" : "Official Contact")
      }
      icon={resolveStaticPageIcon(frontmatter.icon)}
      maxWidthClassName="max-w-3xl"
      canonicalUrl={`https://snipgeek.com${canonicalPath}`}
      footerNote={
        locale === "id"
          ? "Untuk pertanyaan terkait halaman tertentu, sertakan tautan agar kami bisa meninjaunya lebih cepat."
          : "If your message is about a specific page, include the link so we can review it more quickly."
      }
    />
  );
}
