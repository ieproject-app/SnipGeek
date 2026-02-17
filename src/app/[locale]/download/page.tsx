import { getDictionary } from '@/lib/get-dictionary';
import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { DownloadClient } from './download-client';

// This is crucial for SEO
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: 'Redirecting...' // A generic title
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function DownloadPage({ params: { locale } }: { params: { locale: string } }) {
  const dictionary = await getDictionary(locale);
  return (
    <DownloadClient dictionary={dictionary.downloadGate} />
  );
}
