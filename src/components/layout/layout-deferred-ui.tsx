"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/get-dictionary";

const LocaleSuggestionBanner = dynamic(
  () =>
    import("@/components/layout/locale-suggestion-banner").then((mod) => ({
      default: mod.LocaleSuggestionBanner,
    })),
  { ssr: false }
);

const LayoutBackToTop = dynamic(
  () =>
    import("@/components/layout/back-to-top").then((mod) => ({
      default: mod.LayoutBackToTop,
    })),
  { ssr: false }
);

type TranslationEntry = {
  locale: string;
  slug: string;
};

type TranslationMap = Record<string, TranslationEntry[]>;

export function LayoutDeferredUi({
  locale,
  dictionary,
  translationsMap,
}: {
  locale: string;
  dictionary: Dictionary;
  translationsMap: TranslationMap;
}) {
  return (
    <>
      <LocaleSuggestionBanner
        locale={locale}
        dictionary={dictionary}
        translationsMap={translationsMap}
      />
      <LayoutBackToTop />
    </>
  );
}
