import { Metadata } from "next";
import { notFound } from "next/navigation";
import { i18n, Locale } from "@/i18n-config";
import ToolSignatoriesIndex from "@/components/tools/signatories-index/tool-signatories-index";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "id" ? "Indeks Penanda Tangan (OCR)" : "Signatories Index (OCR)",
    description: locale === "id" ? "Otomatis temukan halaman mana yang memuat nama-nama penanda tangan atau pihak terkait dalam dokumen PDF massal." : "Automatically find which pages contain the names of signatories or related parties in bulk PDF documents.",
    alternates: {
      canonical: locale === i18n.defaultLocale ? "/tools/signatories-index" : `/${locale}/tools/signatories-index`,
    },
  };
}

export default async function SignatoriesIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  
  const { locale } = await params;
  return (
    <div className="w-full">
      <ToolSignatoriesIndex locale={locale} />
    </div>
  );
}
