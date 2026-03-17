import { Metadata } from "next";
import { ToolImageCrop } from "@/components/tools/tool-image-crop";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n, Locale } from "@/i18n-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.tools.tool_list.image_crop;
  const canonicalPath =
    locale === i18n.defaultLocale
      ? "/tools/image-crop"
      : `/${locale}/tools/image-crop`;

  return {
    title: pageContent.title,
    description: pageContent.description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ImageCropPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6">
        <ToolImageCrop dictionary={dictionary} />
      </main>
    </div>
  );
}
