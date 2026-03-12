import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/i18n-config";
import { SpinWheelClient } from "./spin-wheel-client";

export default async function SpinWheelPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <SpinWheelClient locale={locale} dictionary={dictionary} />;
}
