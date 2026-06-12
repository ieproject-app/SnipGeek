import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import ToolAddressLabel from "@/components/tools/address-label/tool-address-label";
import { i18n, type Locale } from "@/i18n-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Address Label Generator — Admin — SnipGeek",
  robots: { index: false, follow: false, nocache: true },
};

function resolveLocale(localeParam?: string): Locale {
  if (localeParam && i18n.locales.includes(localeParam as Locale)) {
    return localeParam as Locale;
  }
  return i18n.defaultLocale;
}

export default async function AdminAddressLabelGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: localeParam } = await searchParams;
  const locale = resolveLocale(localeParam);

  return (
    <AdminShell>
      <ToolAddressLabel locale={locale} />
    </AdminShell>
  );
}
