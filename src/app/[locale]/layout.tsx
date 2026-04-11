import { LayoutHeader } from "@/components/layout/layout-header";
import { LayoutFooter } from "@/components/layout/layout-footer";
import { i18n, type Locale } from "@/i18n-config";
import {
  getAllTranslationsMap as getAllPostTranslationsMap,
  getSortedPostsData,
} from "@/lib/posts";
import {
  getAllNotesTranslationsMap,
  getSortedNotesData,
} from "@/lib/notes";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ReadingListProvider } from "@/hooks/use-reading-list";
import { NotificationProvider } from "@/hooks/use-notification";
import { getDictionary } from "@/lib/get-dictionary";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Lora,
  JetBrains_Mono,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { FirebaseProviderWrapper } from "@/components/layout/firebase-provider-wrapper";
import { FirebaseAnalyticsTracker } from "@/components/analytics/firebase-analytics-tracker";
import { LayoutDeferredUi } from "@/components/layout/layout-deferred-ui";

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

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--gf-serif",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--gf-mono",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const openGraphLocaleMap: Record<Locale, string> = {
  en: "en_US",
  id: "id_ID",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalPath = locale === i18n.defaultLocale ? "/" : `/${locale}`;
  const dictionary = await getDictionary(locale);
  const homepageTitle =
    dictionary.home.title ||
    "SnipGeek - Windows dan Ubuntu: Tutorial, Troubleshooting, dan Update Penting";
  const homepageDescription =
    dictionary.home.description ||
    "Windows and Ubuntu tutorials, troubleshooting guides, and important updates for daily users.";

  return {
    metadataBase: new URL("https://snipgeek.com"),
    title: {
      default: homepageTitle,
      template: "%s | SnipGeek",
    },
    description: homepageDescription,
    keywords: [
      "Tech Blog",
      "Next.js",
      "Programming",
      "Windows",
      "Web Development",
      "Tutorials",
      "SnipGeek",
    ],
    authors: [{ name: "Iwan Efendi" }],
    creator: "Iwan Efendi",
    publisher: "SnipGeek",
    icons: {
      icon: [
        {
          url: "/images/logo/favicon-96x96.png",
          sizes: "96x96",
          type: "image/png",
        },
        { url: "/images/logo/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/images/logo/favicon.ico",
      apple: "/images/logo/apple-touch-icon.png",
    },
    manifest: "/images/logo/site.webmanifest",
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/",
        id: "/id",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocaleMap[locale],
      url: `https://snipgeek.com${canonicalPath === "/" ? "" : canonicalPath}`,
      siteName: "SnipGeek",
      title: homepageTitle,
      description: homepageDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: homepageTitle,
      description: homepageDescription,
      creator: "@iwnefnd",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {},
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const postTranslationsMap = await getAllPostTranslationsMap();
  const noteTranslationsMap = await getAllNotesTranslationsMap();
  const translationsMap = { ...postTranslationsMap, ...noteTranslationsMap };

  const posts = await getSortedPostsData(locale);
  const notes = await getSortedNotesData(locale);
  const linkPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const SEARCHABLE_POST_LIMIT = 24;
  const SEARCHABLE_NOTE_LIMIT = 8;

  const searchablePosts = posts.slice(0, SEARCHABLE_POST_LIMIT).map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    type: "blog" as const,
    href: `${linkPrefix}/blog/${post.slug}`,
    tags: post.frontmatter.tags,
  }));

  const searchableNotes = notes.slice(0, SEARCHABLE_NOTE_LIMIT).map((note) => ({
    slug: note.slug,
    title: note.frontmatter.title,
    description: note.frontmatter.description,
    type: "note" as const,
    href: `${linkPrefix}/notes/${note.slug}`,
    tags: note.frontmatter.tags,
  }));

  const searchableData = [...searchablePosts, ...searchableNotes];
  const dictionary = await getDictionary(locale as Locale);

  return (
    <html
      lang={locale}
      className={cn(
        fontDisplay.variable,
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable,
        "scroll-smooth",
      )}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased fade-in-on-load">
        <a href="#main-content" className="skip-link">
          {locale === "id" ? "Lanjut ke konten utama" : "Skip to main content"}
        </a>
        <FirebaseProviderWrapper>
          <FirebaseAnalyticsTracker />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationProvider>
              <ReadingListProvider>
                <LayoutHeader
                  searchableData={searchableData}
                  dictionary={dictionary}
                />
                <LayoutDeferredUi
                  locale={locale}
                  dictionary={dictionary}
                  translationsMap={translationsMap}
                />
                <main id="main-content">{children}</main>
                <LayoutFooter
                  locale={locale}
                  dictionary={dictionary}
                  translationsMap={translationsMap}
                />
              </ReadingListProvider>
            </NotificationProvider>
          </ThemeProvider>
        </FirebaseProviderWrapper>
      </body>
    </html>
  );
}
