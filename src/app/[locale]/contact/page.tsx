import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const dictionary = await getDictionary(locale);
  return {
    title: dictionary.contact.title,
    description: dictionary.contact.description,
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function Page({ params: { locale } }: { params: { locale: string } }) {
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.contact;
  const email = "iwan.efndi@gmail.com";

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {pageContent.title}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{pageContent.description}</p>
        </header>
        <div className="text-center bg-card border rounded-lg p-8 sm:p-12">
            <p className="text-lg text-muted-foreground mb-6">{pageContent.intro}</p>
            <Button asChild size="lg">
                <a href={`mailto:${email}`}>
                    <Mail className="mr-2 h-5 w-5" />
                    {email}
                </a>
            </Button>
        </div>
      </main>
    </div>
  );
}
