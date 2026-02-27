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
import { Archivo, Archivo_Narrow } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo-narrow',
});

const geistMono = GeistMono;

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
  }));

  const searchableNotes = notes.map(note => ({
    slug: note.slug,
    title: note.frontmatter.title,
    description: note.frontmatter.description,
    type: 'note' as const,
    href: `${linkPrefix}/notes/${note.slug}`,
  }));

  const searchableData = [...searchablePosts, ...searchableNotes];
  const dictionary = await getDictionary(locale as any);
  const draftPosts = getDraftPostsData(locale);
  const draftNotes = getDraftNotesData(locale);
  
  return (
    <html lang={locale} className={cn(archivo.variable, archivoNarrow.variable, geistMono.variable, "scroll-smooth")} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased fade-in-on-load">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <NotificationProvider>
            <ReadingListProvider>
              <Header searchableData={searchableData} dictionary={dictionary} />
              <main>{children}</main>
              <Footer dictionary={dictionary} translationsMap={translationsMap} />
              <BackToTop dictionary={dictionary} />
              <ThemeSwitcher dictionary={dictionary} />
              <DraftList draftPosts={draftPosts} draftNotes={draftNotes} dictionary={dictionary} />
            </ReadingListProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}