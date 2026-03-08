import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const canonicalPath =
    locale === i18n.defaultLocale ? "/projects" : `/${locale}/projects`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/projects`;
  });

  return {
    title: dictionary.projects.title,
    description: dictionary.projects.description,
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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.projects;

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <header className="mb-12 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary mb-3">
            {pageContent.title}
          </h1>
        </header>
        <p className="text-center text-muted-foreground">{pageContent.wip}</p>
      </main>
    </div>
  );
}
