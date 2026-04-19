import { i18n, type Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import React from 'react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ToolsList } from '@/components/tools/tools-list';

const DOMAIN = "https://snipgeek.com";

const pageSEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: "Free Online Tools – Image, Randomizer & Reference Utilities | SnipGeek",
    description:
      "A collection of free online tools from SnipGeek — crop images to WebP, spin a wheel, pick random names, look up BIOS & Boot Menu keys, estimate laptop service costs, and more. No login required for public tools.",
    keywords: [
      "free online tools",
      "online utilities",
      "image crop tool",
      "spin the wheel online",
      "random name picker",
      "BIOS key finder",
      "laptop service estimator",
      "free web tools",
      "SnipGeek tools",
      "browser tools no login",
    ],
  },
  id: {
    title: "Alat Online Gratis – Gambar, Pengacak & Referensi | SnipGeek",
    description:
      "Kumpulan alat online gratis dari SnipGeek — potong gambar ke WebP, putar roda, pilih nama acak, cari tombol BIOS & Boot Menu, estimasi biaya servis laptop, dan lainnya. Tanpa login untuk alat publik.",
    keywords: [
      "alat online gratis",
      "tools online gratis",
      "potong gambar online",
      "spin wheel online",
      "pilih nama acak",
      "pencari tombol BIOS",
      "estimasi servis laptop",
      "alat browser gratis",
      "tools SnipGeek",
      "alat web tanpa login",
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const seo = pageSEO[locale] ?? pageSEO.en;
  const canonicalPath =
    locale === i18n.defaultLocale ? "/tools" : `/${locale}/tools`;
  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools`;
  });

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
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const pageContent = dictionary.tools;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:px-6">
        <ScrollReveal direction="down">
          <header className="mb-16 text-center space-y-4">
            <h1 className="font-display text-5xl font-black tracking-tight text-primary md:text-6xl uppercase">
              {pageContent.title}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-accent/20" />
              <p className="max-w-xl text-muted-foreground text-lg italic font-medium">
                {pageContent.description}
              </p>
              <div className="h-px w-12 bg-accent/20" />
            </div>
          </header>
        </ScrollReveal>

        <ToolsList 
          dictionary={dictionary} 
          locale={locale} 
          isDevelopment={isDevelopment} 
        />
      </main>
    </div>
  );
}
