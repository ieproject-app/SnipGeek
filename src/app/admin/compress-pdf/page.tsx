import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import ToolCompressPdf from "@/components/tools/compress-pdf/tool-compress-pdf";
import { i18n, type Locale } from "@/i18n-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compress PDF — Admin — SnipGeek",
  robots: { index: false, follow: false, nocache: true },
};

function resolveLocale(localeParam?: string): Locale {
  if (localeParam && i18n.locales.includes(localeParam as Locale)) {
    return localeParam as Locale;
  }
  return i18n.defaultLocale;
}

export default async function AdminCompressPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: localeParam } = await searchParams;
  const locale = resolveLocale(localeParam);

  return (
    <AdminShell>
      <ToolCompressPdf locale={locale} />
    </AdminShell>
  );
}
