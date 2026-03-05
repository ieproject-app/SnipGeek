import { getSortedPostsData } from "@/lib/posts";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { HomeClient } from "./home-client";

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
  const dictionary = await getDictionary(locale);

  return (
    <HomeClient
      initialPosts={initialPosts as any}
      dictionary={dictionary}
      locale={locale}
    />
  );
}
