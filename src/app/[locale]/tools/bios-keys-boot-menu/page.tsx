import { Metadata } from "next";
import { ToolBiosKeys } from "@/components/tools/tool-bios-keys";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n, Locale } from "@/i18n-config";

const meta = {
  en: {
    title: "BIOS & Boot Menu Key Finder — All Laptop & Motherboard Brands",
    description:
      "Find the exact BIOS (UEFI) setup key and Boot Menu shortcut for every laptop and motherboard brand — ASUS, Lenovo, Dell, HP, MSI, Acer, Apple, and more. One-click reference.",
    keywords: [
      "BIOS key", "boot menu key", "how to enter BIOS", "UEFI setup key",
      "laptop BIOS shortcut", "motherboard BIOS key", "boot menu shortcut",
      "ASUS BIOS key", "Lenovo BIOS key", "Dell BIOS key", "HP BIOS key",
      "MSI BIOS key", "Acer BIOS key", "boot device selection",
    ],
  },
  id: {
    title: "Pencari Tombol BIOS & Boot Menu — Semua Merek Laptop & Motherboard",
    description:
      "Temukan tombol masuk BIOS (UEFI) dan Boot Menu untuk semua merek laptop dan motherboard — ASUS, Lenovo, Dell, HP, MSI, Acer, Apple, dan lainnya. Referensi cepat satu halaman.",
    keywords: [
      "tombol BIOS", "tombol boot menu", "cara masuk BIOS", "tombol UEFI",
      "shortcut BIOS laptop", "tombol BIOS motherboard", "cara boot USB",
      "tombol BIOS ASUS", "tombol BIOS Lenovo", "tombol BIOS Dell", "tombol BIOS HP",
      "tombol BIOS MSI", "tombol BIOS Acer", "pilih perangkat boot",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const content = meta[locale] || meta.en;

  const canonicalPath =
    locale === i18n.defaultLocale
      ? "/tools/bios-keys-boot-menu"
      : `/${locale}/tools/bios-keys-boot-menu`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools/bios-keys-boot-menu`;
  });

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
    openGraph: {
      type: "website",
      url: `https://snipgeek.com${canonicalPath}`,
      title: content.title,
      description: content.description,
      images: [
        {
          url: "https://snipgeek.com/images/footer/about.webp",
          width: 1200,
          height: 630,
          alt: content.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
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

  // Attach locale hint so the client component can pick the right language
  const dictionaryWithLocale = { ...dictionary, _locale: locale };

  return (
    <div className="w-full">
      <main className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 w-full">
        <ToolBiosKeys dictionary={dictionaryWithLocale} />
      </main>
    </div>
  );
}
