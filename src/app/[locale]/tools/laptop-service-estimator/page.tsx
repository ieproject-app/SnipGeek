import type { Metadata } from 'next'
import { i18n, type Locale } from '@/i18n-config'
import { getDictionary } from '@/lib/get-dictionary'
import { EstimatorClient } from './_components/EstimatorClient'

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const d = dictionary.laptopServiceEstimator

  return {
    title: `${d.title} | SnipGeek Tools`,
    description: d.description,
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
