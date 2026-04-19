import { Metadata } from "next";
import { ToolImageCrop } from "@/components/tools/tool-image-crop";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n, Locale } from "@/i18n-config";

const DOMAIN = "https://snipgeek.com";

const toolSEO: Record<string, {
  title: string;
  description: string;
  keywords: string[];
  appName: string;
  faq: { q: string; a: string }[];
  useCases: string[];
}> = {
  en: {
    appName: "Image Crop & WebP Converter",
    title: "Free Image Crop Tool – Crop to 16:9 & Convert to WebP Online | SnipGeek",
    description:
      "Crop any image to the 16:9 aspect ratio and export it as WebP — perfect for blog hero banners, YouTube thumbnails, and social media covers. Free, no login, runs entirely in your browser.",
    keywords: [
      "image crop online",
      "crop image to 16:9",
      "image to webp converter",
      "free image cropper",
      "crop image for blog",
      "hero image crop",
      "webp converter online",
      "crop and convert image",
      "online image editor free",
      "blog banner image tool",
      "16:9 image crop",
      "free webp export",
    ],
    useCases: [
      "Blog hero banners",
      "YouTube thumbnails",
      "Social media covers",
      "Article featured images",
      "Presentation slides",
      "WebP export for faster web",
    ],
    faq: [
      {
        q: "Is this image crop tool free?",
        a: "Yes, completely free. No account, no download, and no watermark. Just upload your image and crop.",
      },
      {
        q: "What image formats can I upload?",
        a: "You can upload PNG, JPG/JPEG, WebP, GIF, and most other common image formats.",
      },
      {
        q: "Why export as WebP?",
        a: "WebP offers significantly smaller file sizes than JPEG or PNG at the same visual quality, which means faster page load times — ideal for blog and web use.",
      },
      {
        q: "Is my image uploaded to any server?",
        a: "No. All cropping and conversion happens locally in your browser. Your image never leaves your device.",
      },
      {
        q: "What is 16:9 good for?",
        a: "16:9 is the standard widescreen aspect ratio used for blog hero images, YouTube thumbnails, video covers, and most modern web banners.",
      },
    ],
  },
  id: {
    appName: "Alat Potong Gambar & Konversi WebP",
    title: "Alat Potong Gambar Gratis – Crop 16:9 & Konversi ke WebP Online | SnipGeek",
    description:
      "Potong gambar ke rasio 16:9 dan ekspor sebagai WebP — cocok untuk banner hero blog, thumbnail YouTube, dan cover media sosial. Gratis, tanpa login, berjalan langsung di browser.",
    keywords: [
      "potong gambar online",
      "crop gambar 16:9",
      "konversi gambar ke webp",
      "alat potong gambar gratis",
      "crop gambar untuk blog",
      "hero image crop",
      "konverter webp online",
      "potong dan konversi gambar",
      "editor gambar online gratis",
      "alat banner blog",
      "crop 16:9 gratis",
      "ekspor webp gratis",
    ],
    useCases: [
      "Banner hero blog",
      "Thumbnail YouTube",
      "Cover media sosial",
      "Gambar unggulan artikel",
      "Slide presentasi",
      "Ekspor WebP untuk web lebih cepat",
    ],
    faq: [
      {
        q: "Apakah alat potong gambar ini gratis?",
        a: "Ya, sepenuhnya gratis. Tidak perlu akun, tidak perlu mengunduh aplikasi, dan tidak ada watermark. Cukup unggah gambar dan crop.",
      },
      {
        q: "Format gambar apa yang bisa diunggah?",
        a: "Anda bisa mengunggah PNG, JPG/JPEG, WebP, GIF, dan format gambar umum lainnya.",
      },
      {
        q: "Kenapa harus ekspor ke WebP?",
        a: "WebP menghasilkan ukuran file yang jauh lebih kecil dibanding JPEG atau PNG pada kualitas visual yang sama, sehingga halaman web menjadi lebih cepat dimuat.",
      },
      {
        q: "Apakah gambar saya diunggah ke server?",
        a: "Tidak. Semua proses pemotongan dan konversi dilakukan secara lokal di browser Anda. Gambar tidak pernah meninggalkan perangkat Anda.",
      },
      {
        q: "Untuk apa rasio 16:9 digunakan?",
        a: "16:9 adalah rasio layar lebar standar yang digunakan untuk gambar hero blog, thumbnail YouTube, cover video, dan sebagian besar banner web modern.",
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
  const canonicalPath =
    locale === i18n.defaultLocale
      ? "/tools/image-crop"
      : `/${locale}/tools/image-crop`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools/image-crop`;
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

export default async function ImageCropPage({
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
    url: `${DOMAIN}${localePrefix}/tools/image-crop`,
    description: seo.description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    inLanguage: isId ? "id-ID" : "en-US",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: isId
      ? ["Crop gambar ke rasio 16:9", "Ekspor sebagai WebP", "Pemrosesan lokal di browser", "Tanpa watermark", "Tanpa login"]
      : ["Crop image to 16:9 ratio", "Export as WebP", "Local browser processing", "No watermark", "No login required"],
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
      <div className="w-full">
        <main className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6">
          <ToolImageCrop dictionary={dictionary} />
        </main>
      </div>

      {/* ── Server-rendered SEO content — crawlable by Google/Bing ── */}
      <section
        aria-label={isId ? "Informasi tentang alat potong gambar" : "About this image crop tool"}
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-10 text-sm text-muted-foreground"
      >
        {/* Use cases */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            {isId ? "Cocok digunakan untuk apa saja?" : "What can you use this tool for?"}
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
