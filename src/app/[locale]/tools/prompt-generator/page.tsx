import { getDictionary } from '@/lib/get-dictionary';
import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { PromptGeneratorClient } from './prompt-generator-client';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const dictionary = await getDictionary(locale);
  const title = dictionary.promptGenerator.title;
  const description = dictionary.promptGenerator.description;
  
  return {
    title,
    description,
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function PromptGeneratorPage({ params: { locale } }: { params: { locale: string } }) {
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.promptGenerator;
  
  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl mb-3">
                {pageContent.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
                {pageContent.description}
            </p>
        </header>
        
        <PromptGeneratorClient dictionary={pageContent} />
      </main>
    </div>
  );
}
