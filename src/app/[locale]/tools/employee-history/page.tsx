import { getDictionary } from '@/lib/get-dictionary'
import { Locale } from '@/i18n-config'
import { ToolHistory } from '@/components/tools/tool-history'
import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale)
  const pageContent = dictionary.tools.tool_list.employee_history;

  return {
    title: pageContent.title,
    description: pageContent.description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * The main server component for the Employee History page.
 */
export default async function EmployeeHistoryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale)

  const txtPath = path.join(process.cwd(), 'src/app/[locale]/tools/employee-history/riwayat_karyawan.txt')
  let employeeData = ''
  try {
    employeeData = fs.readFileSync(txtPath, 'utf-8')
  } catch {
    employeeData = ''
  }

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6">
        <ToolHistory dictionary={dictionary} employeeData={employeeData} locale={locale} />
      </main>
    </div>
  );
}
