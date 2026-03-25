import { Metadata } from "next";
import { notFound } from "next/navigation";
import { i18n, Locale } from "@/i18n-config";
import ToolAddressLabel from "@/components/tools/address-label/tool-address-label";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "id" ? "Generator Label Alamat" : "Address Label Generator",
    description: locale === "id" ? "Isi atau pilih detail dari buku alamat, pratinjau label, lalu unduh sebagai PDF." : "Fill in or select details from the address book, preview your label, then download it as a PDF.",
    alternates: {
      canonical: locale === i18n.defaultLocale ? "/tools/address-label-generator" : `/${locale}/tools/address-label-generator`,
    },
  };
}

export default async function AddressLabelGeneratorPage({ params }: { params: Promise<{ locale: Locale }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  
  const { locale } = await params;
  return (
    <div className="w-full">
      <ToolAddressLabel locale={locale} />
    </div>
  );
}