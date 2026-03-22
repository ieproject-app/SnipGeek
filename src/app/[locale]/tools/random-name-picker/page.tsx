import { ToolRandomNamePicker } from '@/components/tools/tool-random-name-picker';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Random Name Picker | SnipGeek Tools',
  description: 'Randomly select names from a list, perfect for giveaways and raffles.',
};

export default async function RandomNamePickerPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);
  const fullDictionary = dictionary;

  return (
    <div className="w-full px-4 pt-8 pb-16">
      <ToolRandomNamePicker 
        dictionary={dictionary.tools.random_name || {}}
        fullDictionary={fullDictionary}
      />
    </div>
  );
}
