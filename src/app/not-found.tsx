"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import "./globals.css";
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Lora,
  JetBrains_Mono,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { Home, BookOpen, PenTool, LayoutGrid } from "lucide-react";
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

const navItems = [
  {
    href: "/",
    label: "Go Back Home",
    labelId: "Kembali ke Beranda",
    icon: Home,
  },
  {
    href: "/blog",
    label: "Browse Blog",
    labelId: "Jelajahi Blog",
    icon: BookOpen,
  },
  {
    href: "/notes",
    label: "Read Notes",
    labelId: "Baca Catatan",
    icon: PenTool,
  },
  {
    href: "/tools",
    label: "Explore Tools",
    labelId: "Jelajahi Alat",
    icon: LayoutGrid,
  },
];

export default function NotFound() {
  return (
    <html
      lang="en"
      className={cn(
        fontDisplay.variable,
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <title>404 - Page Not Found | SnipGeek</title>
        <meta
          name="description"
          content="Sorry, the page you're looking for doesn't exist. Find tutorials, notes, and tech tools at SnipGeek."
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="w-full min-h-screen flex items-center justify-center py-20">
            <main className="max-w-xl mx-auto px-6 text-center">
              <header className="mb-8">
                <h1 className="font-display text-6xl font-extrabold tracking-tighter text-primary mb-4">
                  404
                </h1>
                <div className="space-y-1">
                  <p className="font-display text-3xl font-bold tracking-tight text-primary">
                    Lost in Space?
                  </p>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary/60">
                    Tersesat di Luar Angkasa?
                  </p>
                </div>
              </header>

              <div className="mb-12 space-y-2">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  The page you are looking for might have been moved or deleted.
                </p>
                <p className="text-muted-foreground/70 text-base italic">
                  Halaman yang Anda cari mungkin telah dipindahkan atau dihapus.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {navItems.map(({ href, label, labelId, icon: Icon }) => (
                  <Button
                    key={href}
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-16 group"
                  >
                    <Link href={href}>
                      <Icon className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {labelId}
                        </span>
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>

              <p className="text-sm text-muted-foreground border-t border-border pt-8 italic">
                "Technology is best when it brings people together... or when it
                actually works."
              </p>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
