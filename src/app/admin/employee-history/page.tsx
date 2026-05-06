import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmployeeHistoryTabs } from "@/components/admin/employee-history-tabs";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n, type Locale } from "@/i18n-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Employee History — Admin — SnipGeek",
  robots: { index: false, follow: false, nocache: true },
};

function resolveLocale(localeParam?: string): Locale {
  if (localeParam && i18n.locales.includes(localeParam as Locale)) {
    return localeParam as Locale;
  }
  return i18n.defaultLocale;
}

export default async function AdminEmployeeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const { locale: localeParam } = await searchParams;
  const locale = resolveLocale(localeParam);
  const dictionary = await getDictionary(locale);

  return (
    <AdminShell>
      <EmployeeHistoryTabs dictionary={dictionary} locale={locale} />
    </AdminShell>
  );
}
