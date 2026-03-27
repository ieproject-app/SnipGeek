import { ToolRandomNamePicker } from '@/components/tools/tool-random-name-picker';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, type Locale } from '@/i18n-config';
import type { Metadata } from 'next';

const toolSEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'Free Random Name Picker Online – Giveaway & Raffle Tool | SnipGeek',
    description:
      'Pick random names from any list for free — no login required. Perfect for giveaways, raffles, classroom activities, and team draws. Supports presentation mode, countdown animation, and history tracking.',
    keywords: [
      'random name picker',
      'random name generator',
      'giveaway picker',
      'raffle picker',
      'random winner selector',
      'pick random name online',
      'free name picker',
      'classroom name picker',
    ],
  },
  id: {
    title: 'Pilih Nama Acak Online Gratis – Alat Undian & Giveaway | SnipGeek',
    description:
      'Pilih nama secara acak dari daftar apapun secara gratis — tanpa login. Cocok untuk giveaway, undian, kegiatan kelas, dan pemilihan tim. Dilengkapi mode presentasi, animasi hitung mundur, dan riwayat pemilihan.',
    keywords: [
      'pilih nama acak',
      'random name picker',
      'alat undian online',
      'giveaway picker indonesia',
      'pilih pemenang acak',
      'acak nama online',
      'random name picker gratis',
      'aplikasi undian nama',
    ],
  },
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = toolSEO[locale] ?? toolSEO.en;
  const currentPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const canonicalPath = `${currentPrefix}/tools/random-name-picker`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? '' : `/${loc}`;
    languages[loc] = `${prefix}/tools/random-name-picker`;
  });

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        'x-default': languages[i18n.defaultLocale] || canonicalPath,
      },
    },
    openGraph: {
      type: 'website',
      url: `https://snipgeek.com${canonicalPath}`,
      siteName: 'SnipGeek',
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: 'https://snipgeek.com/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Random Name Picker – SnipGeek Tools',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['https://snipgeek.com/opengraph-image'],
    },
  };
}

export default async function RandomNamePickerPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const currentPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const seo = toolSEO[locale] ?? toolSEO.en;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Random Name Picker',
    url: `https://snipgeek.com${currentPrefix}/tools/random-name-picker`,
    description: seo.description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    inLanguage: locale === 'id' ? 'id-ID' : 'en-US',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full px-4 pt-8 pb-16">
        <ToolRandomNamePicker
          dictionary={dictionary.tools.random_name || {}}
          fullDictionary={dictionary}
        />
      </div>
    </>
  );
}
