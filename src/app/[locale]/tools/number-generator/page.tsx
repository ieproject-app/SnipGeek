
import { Metadata } from 'next';
import { NomorGeneratorClient } from './components/NomorGeneratorClient';
import { BackToTop } from '@/components/layout/back-to-top';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.tools.tool_list.number_generator;

  return {
    title: pageContent.title,
    description: pageContent.description,
    alternates: {
      canonical: '/tools/number-generator',
    },
    robots: {
      index: false,
      follow: false,
    }
  };
}

export default async function NomorGeneratorPage({
    params,
  }: {
    params: Promise<{ locale: Locale }>
  }) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const pageContent = dictionary.tools.tool_list.number_generator;

    return (
      <div className="w-full">
        <main className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6">
            <header className="mb-12 text-center">
                <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl mb-3">
                    {pageContent.title}
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground text-lg italic">
                    {pageContent.description}
                </p>
            </header>
            
            <NomorGeneratorClient />
        </main>
        <BackToTop dictionary={dictionary} />
      </div>
    );
}
