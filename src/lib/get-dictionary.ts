import 'server-only'
import type { Locale } from '@/i18n-config'

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  id: () => import('@/dictionaries/id.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
  const load = dictionaries[locale] || dictionaries.en;
  return load();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
