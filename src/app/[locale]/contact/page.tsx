import type { Metadata } from "next";
import type { Locale } from "@/i18n-config";
import {
  generateStaticPageMetadata,
  getStaticPageData,
  getStaticPageDescription,
  getStaticPageLastUpdated,
  getStaticPageTitle,
  getStaticPageCanonicalPath,
} from "@/lib/static-pages";
import { resolveLegalPageIcon } from "@/components/layout/legal-page-template";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  MessageSquare,
  Handshake,
  Bug,
  FileQuestion,
  ShieldAlert,
  Lightbulb,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generateStaticPageMetadata({
    slug: "contact",
    locale,
    fallbackTitle: locale === "id" ? "Kontak" : "Contact",
    fallbackDescription:
      locale === "id"
        ? "Hubungi SnipGeek untuk pertanyaan, masukan, kolaborasi, atau hal lain terkait konten."
        : "Get in touch with SnipGeek for questions, feedback, collaboration, or content-related inquiries.",
  });
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "id" }];
}

const contactCategories = {
  en: [
    {
      icon: FileQuestion,
      title: "Articles & Content",
      description: "Questions about articles, tutorials, notes, or published content.",
    },
    {
      icon: Handshake,
      title: "Collaboration",
      description: "Project-related inquiries, partnerships, or editorial discussions.",
    },
    {
      icon: Bug,
      title: "Technical Issues",
      description: "Report bugs, broken links, or issues found on the website.",
    },
    {
      icon: ShieldAlert,
      title: "Content Ownership",
      description: "Requests related to attribution, ownership, or licensing concerns.",
    },
    {
      icon: Lightbulb,
      title: "Suggestions",
      description: "Ideas and feedback for improving SnipGeek.",
    },
  ],
  id: [
    {
      icon: FileQuestion,
      title: "Artikel & Konten",
      description: "Pertanyaan tentang artikel, tutorial, catatan, atau konten yang telah dipublikasikan.",
    },
    {
      icon: Handshake,
      title: "Kolaborasi",
      description: "Diskusi proyek, kemitraan, atau pembahasan editorial.",
    },
    {
      icon: Bug,
      title: "Masalah Teknis",
      description: "Laporkan bug, tautan rusak, atau masalah di website.",
    },
    {
      icon: ShieldAlert,
      title: "Kepemilikan Konten",
      description: "Permintaan terkait atribusi, kepemilikan, atau lisensi.",
    },
    {
      icon: Lightbulb,
      title: "Saran",
      description: "Ide dan masukan untuk pengembangan SnipGeek.",
    },
  ],
};

const responseItems = {
  en: [
    { icon: Clock, text: "Response times may vary depending on workload" },
    { icon: MessageSquare, text: "Not every message will receive an immediate reply" },
    { icon: FileQuestion, text: "For technical questions, clear context helps a lot" },
    { icon: ArrowRight, text: "Include the page URL when referring to a specific page" },
  ],
  id: [
    { icon: Clock, text: "Waktu respons dapat berbeda tergantung kesibukan" },
    { icon: MessageSquare, text: "Tidak semua pesan selalu bisa dibalas seketika" },
    { icon: FileQuestion, text: "Untuk pertanyaan teknis, konteks yang jelas sangat membantu" },
    { icon: ArrowRight, text: "Sertakan URL halaman jika terkait halaman tertentu" },
  ],
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { frontmatter } = await getStaticPageData("contact", locale);
  const canonicalPath = getStaticPageCanonicalPath("contact", locale);

  const title = getStaticPageTitle(frontmatter, locale === "id" ? "Kontak" : "Contact") || (locale === "id" ? "Kontak" : "Contact");
  const description = getStaticPageDescription(frontmatter);
  const lastUpdated = getStaticPageLastUpdated(frontmatter);
  const badgeLabel = frontmatter.badgeLabel || (locale === "id" ? "Kontak Resmi" : "Official Contact");
  const Icon = resolveLegalPageIcon(frontmatter.icon);

  const categories = contactCategories[locale as keyof typeof contactCategories] || contactCategories.en;
  const responses = responseItems[locale as keyof typeof responseItems] || responseItems.en;

  const isId = locale === "id";

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: title,
            description: description,
            url: `https://snipgeek.com${canonicalPath}`,
            mainEntity: {
              "@type": "EmailMessage",
              email: "iwan.efndi@gmail.com",
            },
          }),
        }}
      />
      <main className="mx-auto max-w-4xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <ScrollReveal direction="down" delay={0.05}>
          <header className="mb-12 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-accent">
              <Icon className="h-3.5 w-3.5" />
              {badgeLabel}
            </div>

            <h1
              className="font-display font-black tracking-tighter text-primary"
              style={{
                fontSize: "clamp(2rem, 1.75rem + 1.25vw, 3rem)",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </h1>

            {description ? (
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}

            {lastUpdated ? (
              <p className="text-sm font-mono text-muted-foreground/60">
                Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
              </p>
            ) : null}
          </header>
        </ScrollReveal>

        {/* Email CTA — prominent */}
        <ScrollReveal direction="up" delay={0.08}>
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/6 via-background to-accent/6 p-6 sm:p-8 text-center">
              <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />

              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" />
                </div>

                <h2 className="font-display text-2xl font-black tracking-tight text-primary">
                  {isId ? "Kirim Email" : "Send an Email"}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {isId
                    ? "Cara terbaik untuk menghubungi kami"
                    : "The best way to reach us"}
                </p>

                <div className="mt-5">
                  <a href="mailto:iwan.efndi@gmail.com">
                    <Button
                      size="lg"
                      className="gap-2 rounded-xl px-8 font-bold shadow-lg shadow-primary/10"
                    >
                      <Mail className="h-4 w-4" />
                      iwan.efndi@gmail.com
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Category cards */}
        <ScrollReveal direction="up" delay={0.1}>
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-primary">
                {isId ? "Apa yang Bisa Dibahas" : "What You Can Reach Out About"}
              </h2>
              <div className="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat, i) => (
                <ScrollReveal key={cat.title} delay={i * 0.06} direction="up">
                  <Card className="h-full rounded-2xl border-primary/10 bg-card/40 transition-all duration-300 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5">
                    <CardHeader className="pb-2">
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
                        <cat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="font-display text-sm font-bold tracking-tight text-primary">
                        {cat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {cat.description}
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Response expectations */}
        <ScrollReveal direction="up" delay={0.12}>
          <section className="mb-12">
            <div className="rounded-2xl border border-primary/10 bg-card/30 p-6 backdrop-blur-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display text-base font-bold tracking-tight text-primary">
                  {isId ? "Ekspektasi Balasan" : "Response Expectations"}
                </h2>
              </div>

              <div className="space-y-3">
                {responses.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-primary/5 bg-background/50 px-4 py-3"
                  >
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-foreground/75">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Quick note / warning */}
        <ScrollReveal direction="up" delay={0.15}>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-foreground/80">
                  {isId ? "Catatan Penting" : "Important Note"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isId
                    ? "Mohon jangan mengirimkan kredensial sensitif, rahasia akun, atau data rahasia melalui email. Jika pertanyaan Anda terkait halaman tertentu, sertakan tautan yang relevan agar kami bisa meninjaunya lebih cepat."
                    : "Please do not send sensitive credentials, private account secrets, or confidential data through email. If your inquiry involves a specific article or page, include the relevant link so we can review it more quickly."}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
