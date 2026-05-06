import type { Metadata } from 'next'
import { i18n, type Locale } from '@/i18n-config'
import { getDictionary } from '@/lib/get-dictionary'
import { EstimatorClient } from './_components/EstimatorClient'

const DOMAIN = "https://snipgeek.com";

const toolSEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: "Laptop Service Cost Estimator – AI-Powered Repair Estimates | SnipGeek",
    description: "Describe your laptop issue and get instant AI-powered service cost estimates. Find likely repair actions, part costs, and labor fees for Windows laptops.",
    keywords: [
      "laptop service estimator",
      "laptop repair cost",
      "laptop repair estimate",
      "laptop service price",
      "laptop repair calculator",
      "laptop diagnostic tool",
      "laptop repair quote",
      "laptop service cost",
      "AI repair estimate",
      "free laptop repair estimate",
    ],
  },
  id: {
    title: "Estimasi Biaya Servis Laptop – Prediksi Perbaikan AI | SnipGeek",
    description: "Jelaskan keluhan laptop dan dapatkan estimasi biaya servis instan dari AI. Lihat perkiraan tindakan perbaikan, harga sparepart, dan biaya jasa.",
    keywords: [
      "estimasi servis laptop",
      "biaya perbaikan laptop",
      "harga servis laptop",
      "kalkulator servis laptop",
      "estimasi biaya perbaikan",
      "diagnosa laptop",
      "biaya servis laptop",
      "perkiraan harga reparasi",
      "estimasi reparasi AI",
      "gratis estimasi servis laptop",
    ],
  },
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const seo = toolSEO[locale] ?? toolSEO.en
  const canonicalPath = locale === i18n.defaultLocale
    ? "/tools/laptop-service-estimator"
    : `/${locale}/tools/laptop-service-estimator`

  const languages: Record<string, string> = {}
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`
    languages[loc] = `${prefix}/tools/laptop-service-estimator`
  })

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
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
  }
}

export default async function LaptopServiceEstimatorPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <div className="w-full">
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6">
        <EstimatorClient dictionary={dictionary} />
      </main>
    </div>
  )
}
