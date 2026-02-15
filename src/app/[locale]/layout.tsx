import { Header } from '@/components/layout/header';
import { i18n } from '@/i18n-config';
import { getAllTranslationsMap } from '@/lib/posts';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SnipGeek - A Modern Minimalist Tech Blog',
  description: 'A modern minimalist tech blog for geeks, powered by local MDX.',
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const translationsMap = getAllTranslationsMap();
  return (
    <html lang={params.locale} className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Header translationsMap={translationsMap} />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
