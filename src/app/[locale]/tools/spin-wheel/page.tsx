import { getDictionary } from "@/lib/get-dictionary";
import { i18n, type Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { SpinWheelClient } from "./spin-wheel-client";

const DOMAIN = "https://snipgeek.com";

const toolSEO: Record<string, {
  title: string;
  description: string;
  keywords: string[];
  faq: { q: string; a: string }[];
  useCases: string[];
  appName: string;
}> = {
  en: {
    appName: "Spin the Wheel",
    title: "Spin the Wheel Online – Free Wheel Spinner to Pick a Random Winner | SnipGeek",
    description:
      "Free wheel spinner online — no login, no download. Add names or items, spin the wheel, and instantly pick a random winner. Perfect for giveaways, raffles, classroom draws, team selection, and everyday decisions.",
    keywords: [
      "spin the wheel",
      "wheel spinner",
      "spin wheel online",
      "free wheel spinner",
      "random wheel",
      "wheel of names",
      "spin the wheel to pick a winner",
      "random wheel spinner",
      "wheel randomizer",
      "random picker wheel",
      "decision wheel",
      "wheel spinner with names",
      "giveaway wheel spinner",
      "raffle wheel",
      "free spin wheel no download",
      "online random picker",
      "name wheel spinner",
    ],
    useCases: [
      "Giveaways & raffles",
      "Classroom name draws",
      "Team & group selection",
      "Decision making",
      "Games & quizzes",
      "Meal & activity planning",
    ],
    faq: [
      {
        q: "Is this wheel spinner free?",
        a: "Yes, SnipGeek's wheel spinner is completely free with no account or download required. Open the page, add your entries, and spin.",
      },
      {
        q: "How do I add names to the spin wheel?",
        a: "Type or paste your names in the entries panel on the right. Each line becomes one wheel segment. You can add as many entries as you need.",
      },
      {
        q: "Can I use it for giveaways and raffles?",
        a: "Absolutely. Enable Raffle Mode in settings to automatically remove each winner after a spin, ensuring every entry can only win once — perfect for fair giveaways.",
      },
      {
        q: "Does the wheel remember my entries?",
        a: "Your entries are saved locally in your browser so they persist across page refreshes. No data is sent to any server.",
      },
      {
        q: "Can I customize the wheel colors?",
        a: "Yes. You can set a custom color for each individual entry, or choose from the built-in color palette. Pre-built templates are also available for quick setup.",
      },
      {
        q: "Is the result truly random?",
        a: "Yes. The landing segment is determined by a seeded random number generator before the spin starts, ensuring fair and unpredictable results every time.",
      },
      {
        q: "Does it work on mobile?",
        a: "Yes, the wheel spinner is fully responsive and works on any device — phone, tablet, or desktop — with no installation needed.",
      },
    ],
  },
  id: {
    appName: "Spin Wheel Online",
    title: "Spin Wheel Online Gratis – Roda Putar Nama untuk Pilih Pemenang Acak | SnipGeek",
    description:
      "Spin wheel online gratis — tanpa login, tanpa download. Tambahkan nama atau item, putar roda, dan pilih pemenang secara acak. Cocok untuk giveaway, undian, kegiatan kelas, pemilihan tim, dan pengambilan keputusan sehari-hari.",
    keywords: [
      "spin wheel online",
      "roda putar online",
      "spin the wheel gratis",
      "roda putar nama",
      "pilih nama acak roda",
      "wheel spinner online gratis",
      "roda acak online",
      "undian roda putar",
      "spin roda gratis",
      "roda putar pemenang acak",
      "wheel of names Indonesia",
      "roda pilih acak",
      "spin wheel tanpa login",
      "aplikasi roda putar gratis",
      "random wheel Indonesia",
    ],
    useCases: [
      "Giveaway & undian online",
      "Pilih nama di kelas",
      "Pilih anggota tim",
      "Pengambilan keputusan",
      "Permainan & kuis",
      "Perencanaan menu & aktivitas",
    ],
    faq: [
      {
        q: "Apakah spin wheel ini gratis?",
        a: "Ya, spin wheel di SnipGeek sepenuhnya gratis tanpa perlu daftar akun atau mengunduh aplikasi apapun.",
      },
      {
        q: "Cara menambahkan nama ke roda putar?",
        a: "Ketik atau tempel daftar nama Anda di panel entri di sisi kanan. Setiap baris menjadi satu segmen pada roda.",
      },
      {
        q: "Bisakah digunakan untuk giveaway dan undian?",
        a: "Ya. Aktifkan Mode Raffle di pengaturan agar pemenang otomatis dihapus setelah setiap putaran, memastikan setiap entri hanya bisa menang sekali.",
      },
      {
        q: "Apakah entri saya tersimpan?",
        a: "Ya, entri disimpan secara lokal di browser sehingga tetap ada saat halaman di-refresh. Tidak ada data yang dikirim ke server.",
      },
      {
        q: "Bisakah mengubah warna roda?",
        a: "Ya, Anda bisa mengkustomisasi warna untuk setiap entri. Tersedia juga template bawaan untuk pengaturan yang cepat.",
      },
      {
        q: "Apakah hasilnya benar-benar acak?",
        a: "Ya, segmen pemenang ditentukan oleh generator angka acak sebelum putaran dimulai, memastikan hasil yang adil dan tidak bisa diprediksi.",
      },
      {
        q: "Apakah bisa digunakan di HP?",
        a: "Ya, roda putar ini sepenuhnya responsif dan bekerja di perangkat apapun — HP, tablet, maupun komputer — tanpa instalasi.",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = toolSEO[locale] ?? toolSEO.en;
  const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const canonicalPath = `${localePrefix}/tools/spin-wheel`;
  const languages: Record<string, string> = {};

  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools/spin-wheel`;
  });

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: canonicalPath,
      languages: { ...languages, "x-default": languages[i18n.defaultLocale] || canonicalPath },
    },
    openGraph: {
      type: "website",
      url: `${DOMAIN}${canonicalPath}`,
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: `${DOMAIN}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function SpinWheelPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const seo = toolSEO[locale] ?? toolSEO.en;
  const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const isId = locale === "id";

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: seo.appName,
    url: `${DOMAIN}${localePrefix}/tools/spin-wheel`,
    description: seo.description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    inLanguage: isId ? "id-ID" : "en-US",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: isId
      ? ["Putar roda acak", "Mode raffle", "Template bawaan", "Efek suara", "Mode layar penuh", "Warna kustom per entri"]
      : ["Random wheel spin", "Raffle mode", "Built-in templates", "Sound effects", "Fullscreen mode", "Per-entry custom colors"],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SpinWheelClient locale={locale} dictionary={dictionary} />

      {/* ── Server-rendered SEO content — crawlable by Google/Bing ── */}
      <section
        aria-label={isId ? "Informasi tentang spin wheel" : "About this wheel spinner"}
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-10 text-sm text-muted-foreground"
      >
        {/* Use cases */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            {isId ? "Cocok digunakan untuk apa saja?" : "What can you use this wheel spinner for?"}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 list-none p-0 m-0">
            {seo.useCases.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-foreground">
            {isId ? "Pertanyaan yang Sering Ditanyakan" : "Frequently Asked Questions"}
          </h2>
          <dl className="space-y-4">
            {seo.faq.map(({ q, a }) => (
              <div key={q}>
                <dt className="font-medium text-foreground">{q}</dt>
                <dd className="mt-1 leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
