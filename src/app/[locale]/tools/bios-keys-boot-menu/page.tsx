import { Metadata } from "next";
import { ToolBiosKeys } from "@/components/tools/tool-bios-keys";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n, Locale } from "@/i18n-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  // Nanti Anda bisa masukkan title: "BIOS & Boot Menu Keys | SnipGeek" ke file en.json dan id.json
  // Untuk saat ini fallback manual agar tidak error
  const title = "BIOS & Boot Menu Keys Finder - SnipGeek";
  const description = "Find the correct BIOS Setup and Boot Menu keys for every laptop and motherboard brand.";
  
  const canonicalPath =
    locale === i18n.defaultLocale
      ? "/tools/bios-keys-boot-menu"
      : `/${locale}/tools/bios-keys-boot-menu`;

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BiosKeysPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <main className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 w-full">
        <ToolBiosKeys dictionary={dictionary} />
      </main>
    </div>
  );
}
