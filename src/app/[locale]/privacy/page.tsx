import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/get-dictionary";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Shield, Cookie, Eye, Mail, ExternalLink } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const canonicalPath = `${currentPrefix}/privacy`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/privacy`;
  });

  const isId = locale === "id";

  return {
    title: isId ? "Kebijakan Privasi" : "Privacy Policy",
    description: isId
      ? "Kebijakan privasi SnipGeek — termasuk penggunaan iklan Google AdSense, cookie, dan cara kami mengelola data Anda."
      : "SnipGeek privacy policy — including Google AdSense advertising, cookies, and how we handle your data.",
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
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 shrink-0">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <h2
            className="font-headline font-black text-primary"
            style={{
              fontSize: "clamp(1.25rem, 1.15rem + 0.5vw, 1.625rem)",
              lineHeight: "1.3",
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </h2>
        </div>
        <div className="pl-12 space-y-3 text-foreground/75 leading-relaxed">
          {children}
        </div>
      </section>
    </ScrollReveal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const isId = locale === "id";
  const lastUpdated = "2025-07-01";
  const siteUrl = "https://snipgeek.com";
  const contactEmail = "iwan.efndi@gmail.com";

  return (
    <div className="w-full">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* ── Header ── */}
        <ScrollReveal direction="down" delay={0.05}>
          <header className="mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-widest">
              <Shield className="h-3.5 w-3.5" />
              {isId ? "Dokumen Resmi" : "Official Document"}
            </div>
            <h1
              className="font-headline font-black tracking-tighter text-primary"
              style={{
                fontSize: "clamp(2rem, 1.75rem + 1.25vw, 3rem)",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              {isId ? "Kebijakan Privasi" : "Privacy Policy"}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isId
                ? "Halaman ini menjelaskan bagaimana SnipGeek mengumpulkan, menggunakan, dan melindungi informasi Anda saat mengunjungi situs ini."
                : "This page explains how SnipGeek collects, uses, and protects your information when you visit this site."}
            </p>
            <p className="text-sm text-muted-foreground/60 font-mono">
              {isId ? "Terakhir diperbarui:" : "Last updated:"}{" "}
              <time dateTime={lastUpdated}>{lastUpdated}</time>
            </p>
          </header>
        </ScrollReveal>

        <div className="space-y-12">
          {/* ── 1. General ── */}
          <Section
            icon={Eye}
            title={isId ? "1. Informasi Umum" : "1. General Information"}
            delay={0.1}
          >
            <p>
              {isId
                ? `SnipGeek ("kami", "situs ini") adalah blog teknologi yang beralamat di ${siteUrl}. Kami berkomitmen untuk melindungi privasi pengunjung situs kami. Kebijakan privasi ini berlaku untuk semua informasi yang dikumpulkan melalui situs ini.`
                : `SnipGeek ("we", "us", "this site") is a technology blog located at ${siteUrl}. We are committed to protecting the privacy of our visitors. This privacy policy applies to all information collected through this site.`}
            </p>
            <p>
              {isId
                ? "Dengan menggunakan situs ini, Anda menyetujui praktik pengumpulan dan penggunaan informasi sebagaimana dijelaskan dalam kebijakan ini."
                : "By using this site, you agree to the data collection and use practices described in this policy."}
            </p>
          </Section>

          {/* ── 2. Advertising ── */}
          <Section
            icon={Eye}
            title={
              isId
                ? "2. Iklan — Google AdSense"
                : "2. Advertising — Google AdSense"
            }
            delay={0.15}
          >
            <p>
              {isId
                ? "Situs ini menggunakan Google AdSense, sebuah layanan periklanan yang dioperasikan oleh Google LLC. Google AdSense menggunakan cookie untuk menampilkan iklan yang relevan berdasarkan kunjungan Anda ke situs ini dan situs lain di internet."
                : "This site uses Google AdSense, an advertising service operated by Google LLC. Google AdSense uses cookies to serve ads relevant to your visits to this site and other sites across the internet."}
            </p>
            <p>
              {isId
                ? "Google menggunakan cookie DART untuk menayangkan iklan kepada pengguna berdasarkan kunjungan mereka ke situs ini dan situs lain. Pengguna dapat memilih keluar dari penggunaan cookie DART dengan mengunjungi Kebijakan Privasi Google untuk jaringan iklan dan konten."
                : "Google uses the DART cookie to serve ads to users based on their visit to this site and other sites on the internet. Users may opt out of the use of the DART cookie by visiting the Google ad and content network Privacy Policy."}
            </p>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                {isId
                  ? "Vendor pihak ketiga, termasuk Google, menggunakan cookie untuk menayangkan iklan berdasarkan kunjungan sebelumnya pengguna ke situs ini."
                  : "Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website."}
              </li>
              <li>
                {isId
                  ? "Google dapat menggunakan data kunjungan tersebut untuk mempersonalisasi iklan."
                  : "Google may use that visit data to personalize the ads it shows."}
              </li>
              <li>
                {isId
                  ? "Pengguna dapat menonaktifkan personalisasi iklan dengan mengunjungi Setelan Iklan Google."
                  : "Users can disable personalized advertising by visiting Google Ad Settings."}
              </li>
            </ul>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-primary/10">
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {isId
                  ? "Kebijakan Privasi Google"
                  : "Google Privacy Policy"}
              </a>
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {isId
                  ? "Setelan Iklan Google (Opt-Out)"
                  : "Google Ad Settings (Opt-Out)"}
              </a>
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {isId
                  ? "Keluar dari iklan berbasis minat (DAA)"
                  : "Opt out of interest-based advertising (DAA)"}
              </a>
            </div>
          </Section>

          {/* ── 3. Cookies ── */}
          <Section
            icon={Cookie}
            title={isId ? "3. Cookie" : "3. Cookies"}
            delay={0.2}
          >
            <p>
              {isId
                ? "Situs ini menggunakan cookie — file teks kecil yang disimpan di perangkat Anda — untuk meningkatkan pengalaman pengguna dan mendukung fungsi-fungsi tertentu. Cookie yang digunakan di situs ini meliputi:"
                : "This site uses cookies — small text files stored on your device — to improve your experience and support certain functionality. Cookies used on this site include:"}
            </p>
            <div className="space-y-3 mt-2">
              {[
                {
                  name: isId ? "Cookie Preferensi" : "Preference Cookies",
                  desc: isId
                    ? "Menyimpan preferensi tampilan seperti tema (gelap/terang) dan pilihan bahasa."
                    : "Stores display preferences such as theme (dark/light) and language choice.",
                  color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                },
                {
                  name: isId ? "Cookie Fungsional" : "Functional Cookies",
                  desc: isId
                    ? "Mendukung fitur seperti daftar bacaan dan notifikasi situs."
                    : "Supports features like reading lists and site notifications.",
                  color:
                    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                },
                {
                  name: isId
                    ? "Cookie Iklan (Pihak Ketiga)"
                    : "Advertising Cookies (Third-Party)",
                  desc: isId
                    ? "Digunakan oleh Google AdSense untuk menampilkan iklan yang relevan. Cookie ini dikendalikan oleh Google, bukan oleh kami."
                    : "Used by Google AdSense to serve relevant ads. These cookies are controlled by Google, not by us.",
                  color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                },
              ].map((cookie) => (
                <div
                  key={cookie.name}
                  className={`flex gap-3 p-3 rounded-lg border ${cookie.color}`}
                >
                  <Cookie className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">{cookie.name}</p>
                    <p className="text-sm opacity-80 mt-0.5">{cookie.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3">
              {isId
                ? "Anda dapat mengelola atau menonaktifkan cookie melalui pengaturan browser Anda. Namun, menonaktifkan cookie tertentu dapat memengaruhi fungsionalitas situs."
                : "You can manage or disable cookies through your browser settings. However, disabling certain cookies may affect site functionality."}
            </p>
          </Section>

          {/* ── 4. Data Collected ── */}
          <Section
            icon={Eye}
            title={
              isId
                ? "4. Data yang Dikumpulkan"
                : "4. Data We Collect"
            }
            delay={0.25}
          >
            <p>
              {isId
                ? "SnipGeek tidak secara langsung mengumpulkan data pribadi identifiable (seperti nama atau alamat email) kecuali jika Anda secara sukarela memberikannya melalui formulir kontak atau komentar."
                : "SnipGeek does not directly collect personally identifiable data (such as name or email address) unless you voluntarily provide it through a contact form or comments."}
            </p>
            <p>
              {isId
                ? "Data yang mungkin dikumpulkan secara otomatis oleh layanan pihak ketiga yang kami gunakan meliputi:"
                : "Data that may be automatically collected by third-party services we use includes:"}
            </p>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                {isId
                  ? "Alamat IP dan jenis browser (oleh server hosting)"
                  : "IP address and browser type (by hosting server)"}
              </li>
              <li>
                {isId
                  ? "Halaman yang dikunjungi dan durasi kunjungan (oleh layanan analitik)"
                  : "Pages visited and visit duration (by analytics services)"}
              </li>
              <li>
                {isId
                  ? "Interaksi iklan (oleh Google AdSense)"
                  : "Ad interactions (by Google AdSense)"}
              </li>
              <li>
                {isId
                  ? "Data autentikasi jika Anda login menggunakan akun Google (oleh Firebase Authentication)"
                  : "Authentication data if you sign in using a Google account (by Firebase Authentication)"}
              </li>
            </ul>
          </Section>

          {/* ── 5. Third-Party Services ── */}
          <Section
            icon={ExternalLink}
            title={
              isId
                ? "5. Layanan Pihak Ketiga"
                : "5. Third-Party Services"
            }
            delay={0.3}
          >
            <p>
              {isId
                ? "Situs ini mengintegrasikan beberapa layanan pihak ketiga, masing-masing tunduk pada kebijakan privasi mereka sendiri:"
                : "This site integrates several third-party services, each subject to their own privacy policies:"}
            </p>
            <div className="space-y-2">
              {[
                {
                  name: "Google AdSense",
                  url: "https://policies.google.com/privacy",
                  desc: isId ? "Jaringan iklan" : "Advertising network",
                },
                {
                  name: "Google Firebase",
                  url: "https://firebase.google.com/support/privacy",
                  desc: isId
                    ? "Autentikasi & database"
                    : "Authentication & database",
                },
                {
                  name: "Google Fonts",
                  url: "https://policies.google.com/privacy",
                  desc: isId ? "Tipografi web" : "Web typography",
                },
                {
                  name: "Vercel / Firebase Hosting",
                  url: "https://vercel.com/legal/privacy-policy",
                  desc: isId
                    ? "Hosting & infrastruktur"
                    : "Hosting & infrastructure",
                },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 border border-primary/5"
                >
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.desc}
                    </p>
                  </div>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-wide text-accent hover:underline shrink-0 ml-4 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {isId ? "Kebijakan" : "Policy"}
                  </a>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 6. Children's Privacy ── */}
          <Section
            icon={Shield}
            title={
              isId
                ? "6. Privasi Anak-Anak"
                : "6. Children's Privacy"
            }
            delay={0.35}
          >
            <p>
              {isId
                ? "Situs ini tidak ditujukan untuk anak-anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan informasi pribadi dari anak-anak. Jika Anda adalah orang tua atau wali dan mengetahui bahwa anak Anda telah memberikan informasi pribadi kepada kami, harap hubungi kami."
                : "This site is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us."}
            </p>
          </Section>

          {/* ── 7. GDPR / Your Rights ── */}
          <Section
            icon={Shield}
            title={
              isId
                ? "7. Hak Anda (GDPR & Privasi Data)"
                : "7. Your Rights (GDPR & Data Privacy)"
            }
            delay={0.4}
          >
            <p>
              {isId
                ? "Jika Anda berada di Wilayah Ekonomi Eropa (EEA) atau yurisdiksi dengan undang-undang privasi serupa, Anda memiliki hak-hak tertentu sehubungan dengan data pribadi Anda, termasuk:"
                : "If you are in the European Economic Area (EEA) or a jurisdiction with similar privacy laws, you have certain rights regarding your personal data, including:"}
            </p>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                {isId
                  ? "Hak untuk mengakses data pribadi yang kami miliki tentang Anda"
                  : "The right to access personal data we hold about you"}
              </li>
              <li>
                {isId
                  ? "Hak untuk meminta koreksi data yang tidak akurat"
                  : "The right to request correction of inaccurate data"}
              </li>
              <li>
                {isId
                  ? "Hak untuk meminta penghapusan data Anda"
                  : "The right to request deletion of your data"}
              </li>
              <li>
                {isId
                  ? "Hak untuk menolak pemrosesan data untuk keperluan iklan"
                  : "The right to object to processing of your data for advertising purposes"}
              </li>
              <li>
                {isId
                  ? "Hak untuk menarik persetujuan kapan saja"
                  : "The right to withdraw consent at any time"}
              </li>
            </ul>
            <p>
              {isId
                ? "Untuk menggunakan hak-hak ini, silakan hubungi kami di alamat email di bawah ini."
                : "To exercise these rights, please contact us at the email address below."}
            </p>
          </Section>

          {/* ── 8. Policy Changes ── */}
          <Section
            icon={Shield}
            title={
              isId
                ? "8. Perubahan Kebijakan"
                : "8. Changes to This Policy"
            }
            delay={0.45}
          >
            <p>
              {isId
                ? "Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diposting di halaman ini dengan tanggal pembaruan yang baru. Kami mendorong Anda untuk meninjau halaman ini secara berkala untuk mengetahui perubahan terkini."
                : "We may update this privacy policy from time to time. Changes will be posted on this page with a new update date. We encourage you to review this page periodically to stay informed of any updates."}
            </p>
          </Section>

          {/* ── 9. Contact ── */}
          <Section
            icon={Mail}
            title={isId ? "9. Hubungi Kami" : "9. Contact Us"}
            delay={0.5}
          >
            <p>
              {isId
                ? "Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, cara kami menangani data Anda, atau ingin menggunakan hak privasi Anda, silakan hubungi kami:"
                : "If you have questions about this privacy policy, how we handle your data, or wish to exercise your privacy rights, please contact us:"}
            </p>
            <div className="mt-4 p-4 rounded-xl border border-primary/10 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={`${siteUrl}/contact`}
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
                >
                  {siteUrl}/contact
                </a>
              </div>
            </div>
          </Section>
        </div>

        {/* ── Footer note ── */}
        <ScrollReveal direction="up" delay={0.55}>
          <div className="mt-16 pt-8 border-t border-primary/10 text-center space-y-2">
            <p className="text-xs text-muted-foreground/50 font-mono">
              {isId
                ? `Kebijakan ini berlaku untuk ${siteUrl} dan semua halamannya.`
                : `This policy applies to ${siteUrl} and all of its pages.`}
            </p>
            <p className="text-xs text-muted-foreground/40 font-mono">
              {isId
                ? `Versi terakhir: ${lastUpdated}`
                : `Last version: ${lastUpdated}`}
            </p>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
