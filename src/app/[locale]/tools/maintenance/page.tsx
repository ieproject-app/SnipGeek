
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import { MaintenanceClient } from './maintenance-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as any);
  return {
    title: `Maintenance | SnipGeek`,
    robots: { index: false, follow: false },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function MaintenancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lang } = await params;
  const dictionary = await getDictionary(lang as any);
  
  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl mb-3">
                {dictionary.maintenance.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground italic text-lg">
                {dictionary.maintenance.description}
            </p>
        </header>
        
        <MaintenanceClient dictionary={dictionary.maintenance} />
      </main>
    </div>
  );
}
