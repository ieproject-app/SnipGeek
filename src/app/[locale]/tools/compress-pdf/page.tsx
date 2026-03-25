import { Metadata } from "next";
import { notFound } from "next/navigation";
import { i18n, Locale } from "@/i18n-config";
import ToolCompressPdf from "@/components/tools/compress-pdf/tool-compress-pdf";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "id" ? "Kompres PDF" : "Compress PDF",
    description: locale === "id" ? "Unggah file PDF Anda, dan kami akan secara otomatis mengompresnya. Ideal untuk lampiran email." : "Upload your PDF, and we will automatically compress it. Perfect for email attachments.",
    alternates: {
      canonical: locale === i18n.defaultLocale ? "/tools/compress-pdf" : `/${locale}/tools/compress-pdf`,
    },
  };
}

export default async function CompressPdfPage({ params }: { params: Promise<{ locale: Locale }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  
  const { locale } = await params;
  return (
    <div className="w-full">
      <ToolCompressPdf locale={locale} />
    </div>
  );
}
