import type { Metadata } from "next";
import { downloadLinks } from "@/lib/data-downloads";
import { notFound } from "next/navigation";
import { DownloadClient } from "./download-client";
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const downloadInfo = downloadLinks[slug];

  if (!downloadInfo) {
    return {
      title: "File Not Found",
    };
  }

  return {
    title: `Downloading: ${downloadInfo.fileName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.flatMap((locale) => {
    return Object.keys(downloadLinks).map((slug) => ({ slug, locale }));
  });
}

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const downloadInfo = downloadLinks[slug];

  if (!downloadInfo) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <DownloadClient
      downloadInfo={downloadInfo}
      dictionary={dictionary.downloadGate}
    />
  );
}
