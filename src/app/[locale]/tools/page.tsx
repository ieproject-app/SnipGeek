import { i18n, type Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import React from 'react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ToolsList } from '@/components/tools/tools-list';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const canonicalPath =
    locale === i18n.defaultLocale ? "/tools" : `/${locale}/tools`;
  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools`;
  });

  return {
    title: dictionary.tools.title,
    description: dictionary.tools.description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
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
