import { getDictionary } from "@/lib/get-dictionary";
import { i18n, type Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { SpinWheelClient } from "./spin-wheel-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.tools.tool_list.spin_wheel;
  const canonicalPath =
    locale === i18n.defaultLocale
      ? "/tools/spin-wheel"
      : `/${locale}/tools/spin-wheel`;
  const languages: Record<string, string> = {};

  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools/spin-wheel`;
  });

  return {
    title: pageContent.title,
    description: pageContent.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function SpinWheelPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <SpinWheelClient locale={locale} dictionary={dictionary} />;
}
