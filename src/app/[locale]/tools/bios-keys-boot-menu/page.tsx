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
          url: "https://snipgeek.com/opengraph-image",
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What key do I press to enter BIOS on an ASUS laptop?",
      "acceptedAnswer": { "@type": "Answer", "text": "On most ASUS laptops, press F2 immediately after powering on to enter BIOS/UEFI setup. For the Boot Menu, press F8 or ESC." }
    },
    {
      "@type": "Question",
      "name": "How do I open the Boot Menu on a Lenovo laptop?",
      "acceptedAnswer": { "@type": "Answer", "text": "On Lenovo laptops, press F12 during startup to open the Boot Menu. For BIOS/UEFI setup, press F2 or Fn+F2. Some models use the Novo button (small pinhole) to access a recovery menu." }
    },
    {
      "@type": "Question",
      "name": "What is the BIOS key for Dell laptops?",
      "acceptedAnswer": { "@type": "Answer", "text": "Press F2 immediately after the Dell logo appears to enter BIOS/UEFI setup. For the One-Time Boot Menu, press F12 instead." }
    },
    {
      "@type": "Question",
      "name": "How to enter BIOS on HP laptops?",
      "acceptedAnswer": { "@type": "Answer", "text": "On HP laptops, press F10 to enter BIOS Setup, or press ESC during startup to open the Startup Menu, then select F10 BIOS Setup or F9 Boot Device Options." }
    },
    {
      "@type": "Question",
      "name": "What key opens BIOS on MSI motherboards and laptops?",
      "acceptedAnswer": { "@type": "Answer", "text": "For MSI motherboards and most MSI laptops, press DEL (Delete) to enter BIOS/UEFI setup. For the Boot Menu, press F11." }
    },
    {
      "@type": "Question",
      "name": "What is the Boot Menu key for Acer laptops?",
      "acceptedAnswer": { "@type": "Answer", "text": "On Acer laptops, press F2 to enter BIOS Setup and F12 to access the Boot Menu. Some models require pressing the key repeatedly right after powering on." }
    },
    {
      "@type": "Question",
      "name": "How to access BIOS on Gigabyte motherboards?",
      "acceptedAnswer": { "@type": "Answer", "text": "Press DEL (Delete) to enter BIOS/UEFI on Gigabyte motherboards. For Boot Menu selection, press F12." }
    },
    {
      "@type": "Question",
      "name": "How do I boot from USB on Apple Mac?",
      "acceptedAnswer": { "@type": "Answer", "text": "On Apple Mac, hold the Option (⌥) key immediately after pressing the power button to open the Startup Manager and select your boot device. For Apple Silicon Macs, hold the Power button until you see 'Loading startup options'." }
    },
  ]
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 w-full">
        <ToolBiosKeys dictionary={dictionaryWithLocale} />
      </main>
    </div>
  );
}
