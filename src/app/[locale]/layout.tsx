import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { i18n } from '@/i18n-config';
import { getAllTranslationsMap as getAllPostTranslationsMap, getSortedPostsData, getDraftPostsData } from '@/lib/posts';
import { getAllNotesTranslationsMap, getSortedNotesData, getDraftNotesData } from '@/lib/notes';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { ReadingListProvider } from '@/hooks/use-reading-list';
import { BackToTop } from '@/components/layout/back-to-top';
import { getDictionary } from '@/lib/get-dictionary';
import { DraftList } from '@/components/layout/draft-list';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['400', '500', '700'],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-code-pro',
});

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
  const draftPosts = getDraftPostsData('id');
  const draftNotes = getDraftNotesData('id');
  
  return (
    <html lang={params.locale} className={cn(inter.variable, spaceGrotesk.variable, sourceCodePro.variable, "scroll-smooth")} suppressHydrationWarning>
      <head />
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
            <DraftList draftPosts={draftPosts} draftNotes={draftNotes} dictionary={dictionary} />
          </ReadingListProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
