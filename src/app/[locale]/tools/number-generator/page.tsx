import { Metadata } from 'next';
import { ToolNumbers } from '@/components/tools/tool-numbers';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, Locale } from '@/i18n-config';
import { getDateKeyInTimeZone } from '@/lib/number-generator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.tools.tool_list.number_generator;
  const canonicalPath =
    locale === i18n.defaultLocale
      ? '/tools/number-generator'
      : `/${locale}/tools/number-generator`;

  return {
    title: pageContent.title,
    description: pageContent.description,
    alternates: {
      canonical: canonicalPath,
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
  const initialDateKey = getDateKeyInTimeZone();

  return (
    <div className="w-full">
      <main className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <ToolNumbers dictionary={dictionary} initialDateKey={initialDateKey} />
      </main>
    </div>
  );
}
