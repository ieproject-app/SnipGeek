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
import { Home, BookOpen, PenTool, Wrench } from "lucide-react";
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

  const items = [
    {
      href: `${linkPrefix}/`,
      label: "Home",
      labelId: "Beranda",
      icon: Home,
    },
    {
      href: `${linkPrefix}/blog`,
      label: "Blog",
      labelId: "Blog",
      icon: BookOpen,
    },
    {
      href: `${linkPrefix}/notes`,
      label: "Notes",
      labelId: "Catatan",
      icon: PenTool,
    },
    {
      href: `${linkPrefix}/tools`,
      label: "Tools",
      labelId: "Alat",
      icon: Wrench,
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
          <main className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-3xl text-center">
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
                SnipGeek · Error
              </p>
              <h1 className="font-display text-7xl font-black tracking-tighter text-primary sm:text-8xl">
                404
              </h1>
              <p className="mt-3 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Page not found
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">Halaman tidak ditemukan</span>
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                The page you tried to open may have moved or never existed.
                <span className="block italic mt-1">
                  Halaman yang Anda buka mungkin sudah dipindahkan atau tidak tersedia.
                </span>
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {items.map(({ href, label, labelId, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-primary/10 bg-card/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-display text-base font-bold tracking-tight text-foreground">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{labelId}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
