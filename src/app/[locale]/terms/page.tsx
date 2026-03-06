import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ScrollText, UserCheck, Shield, AlertTriangle, FileText, Mail } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const canonicalPath = `${currentPrefix}/terms`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/terms`;
  });

  const isId = locale === "id";

  return {
    title: isId ? "Ketentuan Layanan" : "Terms of Service",
    description: isId
      ? "Ketentuan layanan SnipGeek — aturan penggunaan situs, tools, dan konten yang kami sediakan."
      : "SnipGeek terms of service — rules for using our site, tools, and content.",
    robots: { index: true, follow: true },
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

// ─── Section component ────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <ScrollReveal direction="up" delay={delay}>
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {children}
        </div>
      </section>
    </ScrollReveal>
  );
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const isId = locale === "id";
  const lastUpdated = "2025-01-15";
  const siteUrl = "https://snipgeek.com";
  const contactEmail = "iwan.efndi@gmail.com";

  const dictionary = await getDictionary(locale);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="mb-12 text-center">
            <h1
              className="font-headline font-black tracking-tighter text-primary"
              style={{
                fontSize: "clamp(2rem, 1.75rem + 1.25vw, 3rem)",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              {isId ? "Ketentuan Layanan" : "Terms of Service"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {isId
                ? `Terakhir diperbarui: ${lastUpdated}`
                : `Last updated: ${lastUpdated}`}
            </p>
          </div>
        </ScrollReveal>

        {/* Introduction */}
        <Section icon={FileText} title={isId ? "1. Pendahuluan" : "1. Introduction"} delay={0.2}>
          <p>
            {isId
              ? `Selamat datang di SnipGeek ("kami", "situs ini"). Dengan mengakses atau menggunakan situs web ini (${siteUrl}) dan layanan terkait, Anda setuju untuk terikat dengan Ketentuan Layanan ini. Jika Anda tidak setuju dengan ketentuan ini, harap jangan gunakan layanan kami.`
              : `Welcome to SnipGeek ("we", "us", "this site"). By accessing or using this website (${siteUrl}) and related services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.`}
          </p>
        </Section>

        {/* Acceptance of Terms */}
        <Section icon={UserCheck} title={isId ? "2. Penerimaan Ketentuan" : "2. Acceptance of Terms"} delay={0.3}>
          <p>
            {isId
              ? "Dengan menggunakan SnipGeek, Anda menyatakan bahwa:"
              : "By using SnipGeek, you represent that:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Anda berusia minimal 13 tahun atau telah mendapat izin orang tua/wali."
                : "You are at least 13 years old or have parental/guardian consent."}
            </li>
            <li>
              {isId
                ? "Anda memiliki kapasitas hukum untuk menerima ketentuan ini."
                : "You have the legal capacity to accept these terms."}
            </li>
            <li>
              {isId
                ? "Informasi yang Anda berikan akurat dan lengkap."
                : "The information you provide is accurate and complete."}
            </li>
          </ul>
        </Section>

        {/* User Accounts */}
        <Section icon={Shield} title={isId ? "3. Akun Pengguna" : "3. User Accounts"} delay={0.4}>
          <p>
            {isId
              ? "Beberapa fitur SnipGeek memerlukan akun pengguna (melalui Google Sign-In via Firebase):"
              : "Some features of SnipGeek require a user account (via Google Sign-In through Firebase):"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Anda bertanggung jawab untuk menjaga kerahasiaan akun Anda."
                : "You are responsible for maintaining the confidentiality of your account."}
            </li>
            <li>
              {isId
                ? "Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda."
                : "You are responsible for all activities that occur under your account."}
            </li>
            <li>
              {isId
                ? "Kami berhak menonaktifkan akun yang melanggar ketentuan ini."
                : "We reserve the right to disable accounts that violate these terms."}
            </li>
          </ul>
        </Section>

        {/* Use of Services */}
        <Section icon={ScrollText} title={isId ? "4. Penggunaan Layanan" : "4. Use of Services"} delay={0.5}>
          <p className="font-semibold text-foreground">
            {isId ? "Anda setuju untuk TIDAK:" : "You agree NOT to:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Menggunakan layanan untuk tujuan ilegal atau tidak sah."
                : "Use the services for illegal or unauthorized purposes."}
            </li>
            <li>
              {isId
                ? "Mengganggu atau merusak integritas atau kinerja situs."
                : "Disrupt or damage the integrity or performance of the site."}
            </li>
            <li>
              {isId
                ? "Mencoba mengakses sistem atau data tanpa izin."
                : "Attempt to access systems or data without authorization."}
            </li>
            <li>
              {isId
                ? "Menyalahgunakan tools internal yang tersedia (misalnya: Employee History, Number Generator)."
                : "Misuse internal tools available (e.g., Employee History, Number Generator)."}
            </li>
            <li>
              {isId
                ? "Scraping, crawling, atau mengekstrak konten secara otomatis tanpa izin tertulis."
                : "Scraping, crawling, or automatically extracting content without written permission."}
            </li>
          </ul>
        </Section>

        {/* Content Ownership */}
        <Section icon={FileText} title={isId ? "5. Kepemilikan Konten" : "5. Content Ownership"} delay={0.6}>
          <p>
            {isId
              ? "Semua artikel, tutorial, gambar, dan materi lainnya di SnipGeek adalah milik kami atau dilisensikan kepada kami. Anda diizinkan untuk:"
              : "All articles, tutorials, images, and other materials on SnipGeek are owned by us or licensed to us. You are permitted to:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Membaca dan menggunakan konten untuk tujuan pribadi dan non-komersial."
                : "Read and use content for personal and non-commercial purposes."}
            </li>
            <li>
              {isId
                ? "Membagikan link artikel melalui media sosial."
                : "Share article links via social media."}
            </li>
          </ul>
          <p className="mt-3 font-semibold text-foreground">
            {isId ? "Anda TIDAK diizinkan untuk:" : "You are NOT permitted to:"}
          </p>
          <ul className="ml-6 mt-2 space-y-2 list-disc">
            <li>
              {isId
                ? "Mempublikasikan ulang konten kami tanpa izin tertulis."
                : "Republish our content without written permission."}
            </li>
            <li>
              {isId
                ? "Menggunakan konten untuk tujuan komersial tanpa lisensi."
                : "Use content for commercial purposes without a license."}
            </li>
          </ul>
        </Section>

        {/* Limitation of Liability */}
        <Section icon={AlertTriangle} title={isId ? "6. Batasan Tanggung Jawab" : "6. Limitation of Liability"} delay={0.7}>
          <p>
            {isId
              ? "SnipGeek disediakan \"sebagaimana adanya\". Kami tidak memberikan jaminan bahwa:"
              : "SnipGeek is provided \"as is\". We make no warranties that:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Layanan akan tersedia tanpa gangguan atau bebas dari kesalahan."
                : "The service will be available without interruption or free from errors."}
            </li>
            <li>
              {isId
                ? "Hasil dari penggunaan tools atau tutorial akan sesuai dengan ekspektasi Anda."
                : "Results from using tools or tutorials will meet your expectations."}
            </li>
            <li>
              {isId
                ? "Informasi yang disediakan selalu mutakhir atau akurat 100%."
                : "The information provided is always up-to-date or 100% accurate."}
            </li>
          </ul>
          <p className="mt-4 text-sm italic">
            {isId
              ? "Kami tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan situs ini."
              : "We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of this site."}
          </p>
        </Section>

        {/* Termination */}
        <Section icon={Shield} title={isId ? "7. Penghentian Layanan" : "7. Termination"} delay={0.8}>
          <p>
            {isId
              ? "Kami berhak untuk menangguhkan atau menghentikan akses Anda ke SnipGeek kapan saja, tanpa pemberitahuan sebelumnya, jika kami mencurigai adanya pelanggaran terhadap Ketentuan Layanan ini."
              : "We reserve the right to suspend or terminate your access to SnipGeek at any time, without prior notice, if we suspect a violation of these Terms of Service."}
          </p>
        </Section>

        {/* Changes to Terms */}
        <Section icon={ScrollText} title={isId ? "8. Perubahan Ketentuan" : "8. Changes to Terms"} delay={0.9}>
          <p>
            {isId
              ? "Kami dapat memperbarui Ketentuan Layanan ini dari waktu ke waktu. Perubahan akan diposting di halaman ini dengan tanggal pembaruan yang baru. Penggunaan berkelanjutan setelah perubahan dianggap sebagai penerimaan Anda terhadap ketentuan baru."
              : "We may update these Terms of Service from time to time. Changes will be posted on this page with a new update date. Continued use after changes constitutes your acceptance of the new terms."}
          </p>
        </Section>

        {/* Contact */}
        <Section icon={Mail} title={isId ? "9. Kontak" : "9. Contact"} delay={1.0}>
          <p>
            {isId
              ? "Jika Anda memiliki pertanyaan tentang Ketentuan Layanan ini, silakan hubungi kami:"
              : "If you have questions about these Terms of Service, please contact us:"}
          </p>
          <div className="mt-4 rounded-xl border border-border bg-card/50 p-6">
            <p className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-accent" />
              <a
                href={`mailto:${contactEmail}`}
                className="text-accent hover:underline font-medium"
              >
                {contactEmail}
              </a>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isId
                ? "Website: "
                : "Website: "}
              <a href={siteUrl} className="text-accent hover:underline">
                {siteUrl}
              </a>
            </p>
          </div>
        </Section>

        {/* Footer Note */}
        <ScrollReveal direction="up" delay={1.1}>
          <div className="mt-12 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isId
                ? "Dengan menggunakan SnipGeek, Anda mengonfirmasi bahwa Anda telah membaca, memahami, dan menyetujui Ketentuan Layanan ini."
                : "By using SnipGeek, you confirm that you have read, understood, and agreed to these Terms of Service."}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
