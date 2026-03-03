import { getDictionary } from '@/lib/get-dictionary'
import { Locale } from '@/i18n-config'
import EmployeeHistoryClient from './employee-history-client'
import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'

// Helper function to read the employee data from the text file.
const getEmployeeData = () => {
  const filePath = path.join(process.cwd(), 'src/app/[locale]/tools/employee-history/riwayat_karyawan.txt');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return fileContents;
  } catch (error) {
    console.error("Error reading employee history file:", error);
    return "";
  }
}

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
  const employeeData = getEmployeeData()

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6">
        <EmployeeHistoryClient dictionary={dictionary} employeeData={employeeData} locale={locale} />
      </main>
    </div>
  );
}
