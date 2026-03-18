import { getSortedPostsData } from "@/lib/posts";
import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const canonicalPath = locale === i18n.defaultLocale ? "/" : `/${locale}`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    languages[loc] = loc === i18n.defaultLocale ? "/" : `/${loc}`;
  });

  return {
    title: dictionary.home.title,
    description: dictionary.home.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || "/",
      },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const initialPosts = await getSortedPostsData(locale);
  const initialNotes = await getSortedNotesData(locale);
  const dictionary = await getDictionary(locale);

  return (
    <HomeClient
      initialPosts={initialPosts}
      initialNotes={initialNotes}
      dictionary={dictionary}
      locale={locale}
    />
  );
}
