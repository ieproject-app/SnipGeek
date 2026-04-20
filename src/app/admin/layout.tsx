import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { FirebaseProviderWrapper } from "@/components/layout/firebase-provider-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--gf-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--gf-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--gf-mono",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Admin — SnipGeek",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(fontDisplay.variable, fontSans.variable, fontMono.variable)}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <FirebaseProviderWrapper>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
          </ThemeProvider>
        </FirebaseProviderWrapper>
      </body>
    </html>
  );
}
