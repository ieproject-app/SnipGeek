import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { i18n } from '@/i18n-config';
import { getAllTranslationsMap as getAllPostTranslationsMap, getSortedPostsData } from '@/lib/posts';
import { getAllNotesTranslationsMap, getSortedNotesData } from '@/lib/notes';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { ReadingListProvider } from '@/hooks/use-reading-list';
import { BackToTop } from '@/components/layout/back-to-top';
import { getDictionary } from '@/lib/get-dictionary';

export const metadata: Metadata = {
  // The user should update this URL to their actual domain.
  metadataBase: new URL('https://your-site-url.com'),
  title: 'SnipGeek - A Modern Minimalist Tech Blog',
  description: 'A modern minimalist tech blog for geeks, powered by local MDX.',
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
  params: { locale: string };
}) {
  const postTranslationsMap = getAllPostTranslationsMap();
  const noteTranslationsMap = getAllNotesTranslationsMap();
  const translationsMap = {...postTranslationsMap, ...noteTranslationsMap};

  const posts = getSortedPostsData(params.locale);
  const notes = getSortedNotesData(params.locale);
  const linkPrefix = params.locale === i18n.defaultLocale ? '' : `/${params.locale}`;

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
  const dictionary = await getDictionary(params.locale);
  
  return (
    <html lang={params.locale} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased fade-in-on-load">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <ReadingListProvider>
            <Header translationsMap={translationsMap} searchableData={searchableData} dictionary={dictionary} />
            <main>{children}</main>
            <Footer dictionary={dictionary} />
            <Toaster />
            <BackToTop />
          </ReadingListProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
