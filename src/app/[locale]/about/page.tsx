import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about SnipGeek.',
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

const deviceSpecs = [
    { key: 'Device name', value: 'IRWeb' },
    { key: 'Processor', value: '11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz (3.00 GHz)' },
    { key: 'Installed RAM', value: '32,0 GB (31,7 GB usable)' },
    { key: 'Device ID', value: '4553EE36-8AE3-45F1-A8ED-771C0B6E2267' },
    { key: 'Product ID', value: '00327-36342-35651-AAOEM' },
    { key: 'System type', value: '64-bit operating system, x64-based processor' },
    { key: 'Pen and touch', value: 'No pen or touch input is available for this display' }
];

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  const content = {
    en: {
        title: "About SnipGeek",
        intro: "This blog was officially re-established on February 10, 2026. You might find some older articles that have been curated and republished because their content is considered timeless and still very much needed by many readers today.",
        hardwareTitle: "My Setup",
        hardwareIntro: "For those curious about the setup I use for writing, coding, and everything in between, here's a look at my primary machine which has been a reliable companion since 2022. I primarily use a Linux distribution for most of my tasks, including writing all the content for this blog. However, I switch over to Windows 11 when work demands it, mainly because I can't stay away from Microsoft Excel. Below are the specifications of my main device:",
        tableHeaderSpec: "Specification",
        tableHeaderDetail: "Details",
        photoNote: "I'll be uploading my photo here soon, so you can put a face to the name!",
    },
    id: {
        title: "Tentang SnipGeek",
        intro: "Blog ini resmi dibentuk kembali pada tanggal 10 Februari 2026. Anda mungkin akan menemukan beberapa artikel lama yang kami kurasi dan terbitkan kembali karena kontennya dianggap tidak lekang oleh waktu dan masih sangat dibutuhkan oleh banyak pembaca di masa mendatang.",
        hardwareTitle: "Perangkat Saya",
        hardwareIntro: "Bagi yang penasaran dengan perangkat yang saya gunakan untuk menulis, koding, dan aktivitas lainnya, berikut adalah perangkat utama saya yang telah menjadi andalan sejak tahun 2022. Saya lebih sering menggunakan distribusi Linux untuk sebagian besar pekerjaan, termasuk menulis semua konten di blog ini. Namun, saya beralih ke Windows 11 ketika pekerjaan menuntut, terutama karena saya tidak bisa jauh dari Microsoft Excel. Di bawah ini adalah spesifikasi perangkat utama saya:",
        tableHeaderSpec: "Spesifikasi",
        tableHeaderDetail: "Detail",
        photoNote: "Nantinya saya juga akan mengunggah foto saya di sini, agar Anda bisa lebih mengenal siapa di balik tulisan-tulisan ini!",
    }
  };
  
  const pageContent = content[locale as keyof typeof content] || content['en'];

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16 text-foreground/80">
        <header className="mb-12">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {pageContent.title}
            </h1>
        </header>

        <section className="space-y-6 text-lg">
            <p>{pageContent.intro}</p>

            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary pt-8 border-t mt-12">{pageContent.hardwareTitle}</h2>
            <p>{pageContent.hardwareIntro}</p>

            <div className="my-8 overflow-hidden rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px] sm:w-1/3">{pageContent.tableHeaderSpec}</TableHead>
                            <TableHead>{pageContent.tableHeaderDetail}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deviceSpecs.map((spec) => (
                            <TableRow key={spec.key}>
                                <TableCell className="font-medium text-foreground">{spec.key}</TableCell>
                                <TableCell className="font-mono text-sm break-all">{spec.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <p className="text-center italic text-muted-foreground pt-8">{pageContent.photoNote}</p>
        </section>
      </main>
    </div>
  );
}
