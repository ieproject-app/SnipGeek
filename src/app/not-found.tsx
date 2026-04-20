"use client";

import Link from "next/link";
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Lora,
  JetBrains_Mono,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  PenTool,
  Wrench,
  Tags,
  Crop,
  Dices,
  Terminal,
  ArrowRight,
} from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/id") ? "id" : "en";
  const linkPrefix = locale === "id" ? "/id" : "";
  const isTagRoute = pathname?.includes("/tags/");

  const primaryItems = [
    {
      href: `${linkPrefix}/`,
      label: "Go Back Home",
      labelId: "Kembali ke Beranda",
      description: "Return to the main homepage",
      descriptionId: "Kembali ke halaman utama",
      icon: Home,
    },
    {
      href: `${linkPrefix}/blog`,
      label: "Browse Blog",
      labelId: "Jelajahi Blog",
      description: "Read published tutorials and articles",
      descriptionId: "Baca artikel dan tutorial terbaru",
      icon: BookOpen,
    },
    {
      href: `${linkPrefix}/notes`,
      label: "Read Notes",
      labelId: "Baca Catatan",
      description: "Open shorter technical notes",
      descriptionId: "Buka catatan teknis yang lebih singkat",
      icon: PenTool,
    },
    {
      href: `${linkPrefix}/tags`,
      label: "Explore Tags",
      labelId: "Lihat Tag",
      description: "Jump through topics and categories",
      descriptionId: "Jelajahi topik dan kategori",
      icon: Tags,
    },
  ];

  const toolItems = [
    {
      href: `${linkPrefix}/tools`,
      label: "Open Tools Hub",
      labelId: "Buka Halaman Tools",
      icon: Wrench,
    },
    {
      href: `${linkPrefix}/tools/image-crop`,
      label: "Image Crop",
      labelId: "Potong Gambar",
      icon: Crop,
    },
    {
      href: `${linkPrefix}/tools/spin-wheel`,
      label: "Spin Wheel",
      labelId: "Putar Roda",
      icon: Dices,
    },
    {
      href: `${linkPrefix}/tools/bios-keys-boot-menu`,
      label: "BIOS Keys",
      labelId: "Tombol BIOS",
      icon: Terminal,
    },
  ];

  return (
    <html
      lang={locale}
      className={cn(
        fontDisplay.variable,
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable,
      )}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <title>404 - Page Not Found | SnipGeek</title>
        <meta
          name="description"
          content="Sorry, the page you're looking for doesn't exist. Find tutorials and technical notes at SnipGeek."
        />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="w-full min-h-screen py-16 sm:py-20">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
              <header className="text-center">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-primary/50">
                  SnipGeek Error Route
                </p>
                <h1 className="font-display text-6xl font-extrabold tracking-tighter text-primary mb-4 sm:text-7xl">
                  404
                </h1>
                <div className="space-y-2">
                  <p className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Page not found.
                  </p>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary/60 sm:text-3xl">
                    Halaman tidak ditemukan.
                  </p>
                </div>
              </header>

              <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-3xl border border-primary/10 bg-card/60 p-8 text-left shadow-sm shadow-primary/5">
                  <div className="mb-6 inline-flex rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-primary/70">
                    {isTagRoute ? "Missing tag archive" : "Missing page"}
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg leading-relaxed text-foreground/90 sm:text-xl">
                      {isTagRoute
                        ? "The tag page you opened is not available right now. It may have been renamed, cleaned up, or no longer has published content."
                        : "The page you tried to open may have moved, been removed, or never existed in this language route."}
                    </p>
                    <p className="text-base leading-relaxed text-muted-foreground italic">
                      {isTagRoute
                        ? "Halaman tag yang Anda buka belum tersedia saat ini. Bisa jadi namanya berubah, dirapikan, atau sudah tidak punya konten yang terbit."
                        : "Halaman yang Anda buka mungkin sudah dipindahkan, dihapus, atau memang tidak tersedia di rute bahasa ini."}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href={`${linkPrefix}/tools`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      <Wrench className="h-4 w-4" />
                      <span>Explore Tools</span>
                    </Link>
                    <Link
                      href={`${linkPrefix}/tags`}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/20 hover:text-primary"
                    >
                      <Tags className="h-4 w-4" />
                      <span>Browse Tags</span>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl border border-accent/10 bg-gradient-to-br from-accent/5 via-background to-primary/5 p-8 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-accent/70">
                    Better next step
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary">
                    Tools, blog, and notes are still one click away.
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Gunakan halaman ini sebagai jalan pintas ke konten utama SnipGeek atau ke tools publik yang langsung bisa dipakai.
                  </p>
                  <Link
                    href={`${linkPrefix}/tools`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-accent"
                  >
                    <span>Open tools hub</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary">
                      Popular destinations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Halaman utama untuk lanjut menjelajah.
                    </p>
                  </div>
                  <div className="hidden h-px flex-1 bg-border sm:block" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {primaryItems.map(({ href, label, labelId, description, descriptionId, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group rounded-2xl border border-primary/10 bg-card/40 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-display text-xl font-bold tracking-tight text-primary">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-primary/60">{labelId}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground/80 italic">
                          {descriptionId}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary">
                      Try our public tools
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Shortcut ke beberapa tool publik yang langsung bisa dipakai.
                    </p>
                  </div>
                  <div className="hidden h-px flex-1 bg-border sm:block" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {toolItems.map(({ href, label, labelId, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-background/70 p-4 transition-all duration-300 hover:border-accent/30 hover:bg-accent/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{labelId}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </Link>
                  ))}
                </div>
              </section>

              <p className="border-t border-border pt-8 text-center text-sm text-muted-foreground italic">
                &quot;Technology is best when it helps people find what they need faster.&quot;
              </p>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
