
import { Metadata } from 'next';
import { ToolNumbers } from '@/components/tools/tool-numbers';
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

  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6">
        <ToolNumbers dictionary={dictionary} />
      </main>
    </div>
  );
}
