import { getSortedNotesData } from "@/lib/notes";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { NotesListClient } from "./notes-list-client";
import type { Metadata } from "next";
import { getLinkPrefix } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const canonicalPath = `${getLinkPrefix(locale)}/notes`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    languages[loc] = `${getLinkPrefix(loc)}/notes`;
  });

  return {
    title: dictionary.notes.title,
    description: dictionary.notes.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
    openGraph: {
      type: "website",
      url: `https://snipgeek.com${canonicalPath}`,
      title: dictionary.notes.title,
      description: dictionary.notes.description,
      images: [
        {
          url: "https://snipgeek.com/images/logo/logo.svg",
          width: 512,
          height: 512,
          alt: "SnipGeek Notes",
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const initialNotes = await getSortedNotesData(locale);
  const dictionary = await getDictionary(locale);
  const linkPrefix = getLinkPrefix(locale);
  const itemListElement = initialNotes.map((note, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `https://snipgeek.com${linkPrefix}/notes/${note.slug}`,
    name: note.frontmatter.title,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: dictionary.notes.title,
            description: dictionary.notes.description,
            url: `https://snipgeek.com${linkPrefix}/notes`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: itemListElement.length,
              itemListElement,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: dictionary.notes.title,
            numberOfItems: itemListElement.length,
            itemListElement,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: dictionary.home.breadcrumbHome,
                item: "https://snipgeek.com" + (linkPrefix || "/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: dictionary.navigation.notes,
                item: `https://snipgeek.com${linkPrefix}/notes`,
              },
            ],
          }),
        }}
      />
      <NotesListClient
        initialNotes={initialNotes}
        dictionary={dictionary}
        locale={locale}
      />
    </>
  );
}
