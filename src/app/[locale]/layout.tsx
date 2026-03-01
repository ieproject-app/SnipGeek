import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { i18n } from '@/i18n-config';
import { getAllTranslationsMap as getAllPostTranslationsMap, getSortedPostsData, getDraftPostsData } from '@/lib/posts';
import { getAllNotesTranslationsMap, getSortedNotesData, getDraftNotesData } from '@/lib/notes';
import '../globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { ReadingListProvider } from '@/hooks/use-reading-list';
import { NotificationProvider } from '@/hooks/use-notification';
import { BackToTop } from '@/components/layout/back-to-top';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';
import { getDictionary } from '@/lib/get-dictionary';
import { DraftList } from '@/components/layout/draft-list';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Lora, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { FirebaseClientProvider } from '@/firebase';

const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const fontSerif = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  style: ['normal', 'italic'],
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://snipgeek.com'),
  title: {
    default: 'SnipGeek - A Modern Minimalist Tech Blog',
    template: '%s | SnipGeek',
  },
  description: 'A modern minimalist tech blog for geeks, exploring software, hardware, and IT automation.',
  keywords: ['Tech Blog', 'Next.js', 'Programming', 'Windows', 'Web Development', 'Tutorials', 'SnipGeek'],
  authors: [{ name: 'Iwan Efendi' }],
  creator: 'Iwan Efendi',
  publisher: 'SnipGeek',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'id': '/id',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://snipgeek.com',
    siteName: 'SnipGeek',
    title: 'SnipGeek - A Modern Minimalist Tech Blog',
    description: 'A modern minimalist tech blog for geeks, exploring software, hardware, and IT automation.',
    images: [
      {
        url: '/images/footer/about.webp',
        width: 1200,
        height: 630,
        alt: 'SnipGeek - Modern Tech Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnipGeek - A Modern Minimalist Tech Blog',
    description: 'A modern minimalist tech blog for geeks, exploring software, hardware, and IT automation.',
    images: ['/images/footer/about.webp'],
    creator: '@iwnefnd',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-6235611333449307',
  },
};

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
  const postTranslationsMap = getAllPostTranslationsMap();
  const noteTranslationsMap = getAllNotesTranslationsMap();
  const translationsMap = {...postTranslationsMap, ...noteTranslationsMap};

  const posts = getSortedPostsData(locale);
  const notes = getSortedNotesData(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const searchablePosts = posts.map(post => ({
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    type: 'blog' as const,
    href: `${linkPrefix}/blog/${post.slug}`,
    heroImage: post.frontmatter.heroImage,
    category: post.frontmatter.category,
  }));

  const searchableNotes = notes.map(note => ({
    slug: note.slug,
    title: note.frontmatter.title,
    description: note.frontmatter.description,
    type: 'note' as const,
    href: `${linkPrefix}/notes/${note.slug}`,
    heroImage: note.frontmatter.heroImage,
    category: note.frontmatter.category,
  }));

  const searchableData = [...searchablePosts, ...searchableNotes];
  const dictionary = await getDictionary(locale as any);
  const draftPosts = getDraftPostsData(locale);
  const draftNotes = getDraftNotesData(locale);
  
  return (
    <html lang={locale} className={cn(fontDisplay.variable, fontSans.variable, fontSerif.variable, fontMono.variable, "scroll-smooth")} suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6235611333449307"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased fade-in-on-load">
        <FirebaseClientProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            <NotificationProvider>
              <ReadingListProvider>
                <Header searchableData={searchableData} dictionary={dictionary} />
                <main className="pt-16">{children}</main>
                <Footer dictionary={dictionary} translationsMap={translationsMap} />
                <BackToTop dictionary={dictionary} />
                <ThemeSwitcher dictionary={dictionary} />
                <DraftList draftPosts={draftPosts} draftNotes={draftNotes} dictionary={dictionary} />
              </ReadingListProvider>
            </NotificationProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
