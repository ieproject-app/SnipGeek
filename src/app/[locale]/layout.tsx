
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
import { getDictionary } from '@/lib/get-dictionary';
import { DraftList } from '@/components/layout/draft-list';
import { Roboto, Roboto_Condensed } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-condensed',
  weight: ['400', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://snipgeek.com'),
  title: 'SnipGeek - A Modern Minimalist Tech Blog',
  description: 'A modern minimalist tech blog for geeks, powered by local MDX.',
  icons: {
    icon: '/images/logo/favicon.ico',
    shortcut: '/images/logo/favicon.ico',
    apple: '/images/logo/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'id': '/id',
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
    <html lang={locale} className={cn(robotoCondensed.variable, roboto.variable, GeistMono.variable, "scroll-smooth")} suppressHydrationWarning>
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
              <BackToTop />
              <DraftList draftPosts={draftPosts} draftNotes={draftNotes} dictionary={dictionary} />
            </ReadingListProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
