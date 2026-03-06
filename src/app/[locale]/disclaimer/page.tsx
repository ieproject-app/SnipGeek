import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ShieldAlert, FileText, Download, Link as LinkIcon, Wrench, AlertTriangle, Mail } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const canonicalPath = `${currentPrefix}/disclaimer`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/disclaimer`;
  });

  const isId = locale === "id";

  return {
    title: isId ? "Disclaimer" : "Disclaimer",
    description: isId
      ? "Disclaimer SnipGeek — informasi penting tentang penggunaan konten, tutorial, tools, dan download yang kami sediakan."
      : "SnipGeek disclaimer — important information about using our content, tutorials, tools, and downloads.",
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

export default async function DisclaimerPage({
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
              Disclaimer
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {isId
                ? `Terakhir diperbarui: ${lastUpdated}`
                : `Last updated: ${lastUpdated}`}
            </p>
          </div>
        </ScrollReveal>

        {/* General Disclaimer */}
        <Section icon={ShieldAlert} title={isId ? "1. Disclaimer Umum" : "1. General Disclaimer"} delay={0.2}>
          <p>
            {isId
              ? `Informasi yang disediakan oleh SnipGeek (${siteUrl}) hanya untuk tujuan informasi umum. Kami berusaha menjaga informasi tetap mutakhir dan akurat, namun kami tidak membuat pernyataan atau jaminan dalam bentuk apa pun, tersurat atau tersirat, tentang kelengkapan, keakuratan, keandalan, kesesuaian, atau ketersediaan situs web atau informasi, produk, layanan, atau grafik terkait yang terdapat di situs web untuk tujuan apa pun.`
              : `The information provided by SnipGeek (${siteUrl}) is for general informational purposes only. While we strive to keep the information up-to-date and accurate, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.`}
          </p>
          <p className="mt-4 font-semibold text-foreground">
            {isId
              ? "Setiap ketergantungan yang Anda tempatkan pada informasi tersebut sepenuhnya merupakan risiko Anda sendiri."
              : "Any reliance you place on such information is therefore strictly at your own risk."}
          </p>
        </Section>

        {/* Tutorials and Guides */}
        <Section icon={FileText} title={isId ? "2. Tutorial dan Panduan" : "2. Tutorials and Guides"} delay={0.3}>
          <p>
            {isId
              ? "Tutorial, panduan, dan artikel teknis di SnipGeek dibuat berdasarkan pengalaman kami dan informasi yang tersedia pada saat penulisan. Namun:"
              : "Tutorials, guides, and technical articles on SnipGeek are created based on our experience and information available at the time of writing. However:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Teknologi berkembang dengan cepat dan informasi dapat menjadi usang."
                : "Technology evolves rapidly and information may become outdated."}
            </li>
            <li>
              {isId
                ? "Hasil dapat bervariasi tergantung pada konfigurasi sistem, versi software, dan faktor lingkungan lainnya."
                : "Results may vary depending on system configuration, software version, and other environmental factors."}
            </li>
            <li>
              {isId
                ? "Kami tidak bertanggung jawab atas kerusakan perangkat keras, kehilangan data, atau masalah lain yang mungkin terjadi dari mengikuti tutorial kami."
                : "We are not responsible for hardware damage, data loss, or other issues that may occur from following our tutorials."}
            </li>
            <li>
              {isId
                ? "Selalu buat backup data Anda sebelum melakukan perubahan sistem yang signifikan."
                : "Always backup your data before making significant system changes."}
            </li>
          </ul>
        </Section>

        {/* Downloads and Third-Party Content */}
        <Section icon={Download} title={isId ? "3. Unduhan dan Konten Pihak Ketiga" : "3. Downloads and Third-Party Content"} delay={0.4}>
          <p>
            {isId
              ? "SnipGeek dapat menyediakan tautan unduhan ke software, tools, atau file lainnya:"
              : "SnipGeek may provide download links to software, tools, or other files:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Kami tidak meng-host sebagian besar file unduhan. Link mengarah ke sumber resmi atau pihak ketiga tepercaya."
                : "We do not host most download files. Links point to official sources or trusted third parties."}
            </li>
            <li>
              {isId
                ? "Kami tidak menjamin keamanan, kualitas, atau legalitas file yang diunduh dari tautan eksternal."
                : "We do not guarantee the safety, quality, or legality of files downloaded from external links."}
            </li>
            <li>
              {isId
                ? "Selalu scan file yang diunduh dengan antivirus sebelum menjalankannya."
                : "Always scan downloaded files with antivirus before running them."}
            </li>
            <li>
              {isId
                ? "Penggunaan software pihak ketiga tunduk pada lisensi dan ketentuan mereka sendiri."
                : "Use of third-party software is subject to their own licenses and terms."}
            </li>
          </ul>
          <p className="mt-4 text-sm italic">
            {isId
              ? "Kami tidak bertanggung jawab atas kerusakan yang disebabkan oleh penggunaan file atau software yang diunduh melalui tautan di situs kami."
              : "We are not liable for any damage caused by the use of files or software downloaded through links on our site."}
          </p>
        </Section>

        {/* Tools Disclaimer */}
        <Section icon={Wrench} title={isId ? "4. Tools dan Utilitas" : "4. Tools and Utilities"} delay={0.5}>
          <p>
            {isId
              ? "SnipGeek menyediakan berbagai tools online (seperti AI Prompt Generator, Number Generator, Employee History, dll):"
              : "SnipGeek provides various online tools (such as AI Prompt Generator, Number Generator, Employee History, etc.):"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Tools ini disediakan \"sebagaimana adanya\" tanpa jaminan dalam bentuk apa pun."
                : "These tools are provided \"as is\" without warranty of any kind."}
            </li>
            <li>
              {isId
                ? "Beberapa tools bersifat internal dan memerlukan akun terdaftar untuk akses."
                : "Some tools are internal and require a registered account for access."}
            </li>
            <li>
              {isId
                ? "Kami tidak menjamin bahwa tools akan berfungsi tanpa kesalahan atau gangguan."
                : "We do not guarantee that tools will function without errors or interruptions."}
            </li>
            <li>
              {isId
                ? "Output dari tools harus diverifikasi dan tidak boleh diandalkan sepenuhnya tanpa pemeriksaan manual."
                : "Tool outputs should be verified and should not be relied upon entirely without manual checking."}
            </li>
            <li>
              {isId
                ? "Kami berhak untuk mengubah, menangguhkan, atau menghentikan tools kapan saja tanpa pemberitahuan."
                : "We reserve the right to modify, suspend, or discontinue tools at any time without notice."}
            </li>
          </ul>
        </Section>

        {/* External Links */}
        <Section icon={LinkIcon} title={isId ? "5. Tautan Eksternal" : "5. External Links"} delay={0.6}>
          <p>
            {isId
              ? "SnipGeek berisi tautan ke situs web eksternal untuk kenyamanan Anda:"
              : "SnipGeek contains links to external websites for your convenience:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Kami tidak memiliki kendali atas konten atau praktik privasi situs web pihak ketiga."
                : "We have no control over the content or privacy practices of third-party websites."}
            </li>
            <li>
              {isId
                ? "Kami tidak bertanggung jawab atas konten, keakuratan, atau pendapat yang diungkapkan di situs eksternal."
                : "We are not responsible for the content, accuracy, or opinions expressed on external sites."}
            </li>
            <li>
              {isId
                ? "Penyertaan tautan tidak menyiratkan endorsement dari situs tersebut atau afiliasinya."
                : "Inclusion of links does not imply endorsement of the site or its affiliates."}
            </li>
            <li>
              {isId
                ? "Anda harus membaca kebijakan privasi dan ketentuan layanan setiap situs yang Anda kunjungi."
                : "You should read the privacy policy and terms of service of every site you visit."}
            </li>
          </ul>
        </Section>

        {/* Affiliate Links (Future) */}
        <Section icon={AlertTriangle} title={isId ? "6. Tautan Afiliasi" : "6. Affiliate Links"} delay={0.7}>
          <p>
            {isId
              ? "SnipGeek dapat mengandung tautan afiliasi di masa depan. Ini berarti:"
              : "SnipGeek may contain affiliate links in the future. This means:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Kami dapat menerima komisi kecil jika Anda melakukan pembelian melalui tautan tersebut."
                : "We may receive a small commission if you make a purchase through such links."}
            </li>
            <li>
              {isId
                ? "Ini tidak mempengaruhi harga yang Anda bayar dan tidak mengubah objektivitas konten kami."
                : "This does not affect the price you pay and does not change the objectivity of our content."}
            </li>
            <li>
              {isId
                ? "Kami hanya merekomendasikan produk atau layanan yang kami yakini memberikan nilai kepada pembaca kami."
                : "We only recommend products or services that we believe provide value to our readers."}
            </li>
          </ul>
        </Section>

        {/* Professional Advice */}
        <Section icon={ShieldAlert} title={isId ? "7. Bukan Nasihat Profesional" : "7. Not Professional Advice"} delay={0.8}>
          <p>
            {isId
              ? "Konten di SnipGeek tidak dimaksudkan sebagai pengganti nasihat profesional:"
              : "Content on SnipGeek is not intended as a substitute for professional advice:"}
          </p>
          <ul className="ml-6 mt-3 space-y-2 list-disc">
            <li>
              {isId
                ? "Untuk masalah teknis kritis, konsultasikan dengan profesional IT yang berkualifikasi."
                : "For critical technical issues, consult with qualified IT professionals."}
            </li>
            <li>
              {isId
                ? "Untuk keputusan bisnis atau investasi teknologi, cari nasihat dari ahli yang sesuai."
                : "For business or technology investment decisions, seek advice from appropriate experts."}
            </li>
            <li>
              {isId
                ? "Informasi keamanan dan privasi harus diverifikasi dengan sumber resmi."
                : "Security and privacy information should be verified with official sources."}
            </li>
          </ul>
        </Section>

        {/* Changes to Disclaimer */}
        <Section icon={FileText} title={isId ? "8. Perubahan Disclaimer" : "8. Changes to Disclaimer"} delay={0.9}>
          <p>
            {isId
              ? "Kami dapat memperbarui Disclaimer ini dari waktu ke waktu untuk mencerminkan perubahan dalam praktik kami atau untuk alasan operasional, hukum, atau peraturan lainnya. Perubahan akan diposting di halaman ini dengan tanggal pembaruan yang baru."
              : "We may update this Disclaimer from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Changes will be posted on this page with a new update date."}
          </p>
        </Section>

        {/* Contact */}
        <Section icon={Mail} title={isId ? "9. Kontak" : "9. Contact"} delay={1.0}>
          <p>
            {isId
              ? "Jika Anda memiliki pertanyaan tentang Disclaimer ini, silakan hubungi kami:"
              : "If you have questions about this Disclaimer, please contact us:"}
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
                ? "Dengan menggunakan SnipGeek, Anda mengakui bahwa Anda telah membaca dan memahami Disclaimer ini."
                : "By using SnipGeek, you acknowledge that you have read and understood this Disclaimer."}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
