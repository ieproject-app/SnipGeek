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
  params: { locale },
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
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
  params: { locale },
}: {
  params: { locale: Locale }
}) {
  const dictionary = await getDictionary(locale)
  const employeeData = getEmployeeData()
  const pageContent = dictionary.tools.tool_list.employee_history;

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl mb-3">
                {pageContent.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg italic">
                {pageContent.description}
            </p>
        </header>
        
        <div>
            <EmployeeHistoryClient dictionary={dictionary} employeeData={employeeData} locale={locale} />
        </div>
      </main>
    </div>
  );
}
