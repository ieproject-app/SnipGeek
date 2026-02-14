import { Header } from '@/components/layout/header';
import { i18n } from '@/i18n-config';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div lang={params.locale}>
      <Header />
      <main>{children}</main>
    </div>
  );
}
