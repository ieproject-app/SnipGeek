
import { getNoteData, getAllNoteSlugs, getAllLocales, getAllNotesTranslationsMap } from '@/lib/notes';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx-components';
import type { Metadata } from 'next';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import { PostComments } from '@/components/blog/post-comments';
import { PostMeta } from '@/components/blog/post-meta';
import { ShareButtons } from '@/components/blog/share-buttons';
import { RelatedPosts } from '@/components/blog/related-posts';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { extractHeadings } from '@/lib/mdx-utils';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export async function generateStaticParams() {
  const locales = getAllLocales();
  const allParams = locales.flatMap((locale) => {
    const slugs = getAllNoteSlugs(locale);
    return slugs.map(item => ({ slug: item.slug, locale: locale }));
  });
  return allParams;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const note = await getNoteData(slug, locale);
  if (!note) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  // Multi-language SEO Logic
  const translationsMap = getAllNotesTranslationsMap();
  const translationKey = note.frontmatter.translationKey;
  const languages: Record<string, string> = {};
  
  i18n.locales.forEach((loc) => {
    const translation = translationsMap[translationKey]?.find(t => t.locale === loc);
    if (translation) {
      const prefix = loc === i18n.defaultLocale ? '' : `/${loc}`;
      languages[loc] = `${prefix}/notes/${translation.slug}`;
    }
  });

  const currentPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const canonicalPath = `${currentPrefix}/notes/${note.slug}`;

  return {
    title: note.frontmatter.title,
    description: note.frontmatter.description,
    alternates: {
        canonical: canonicalPath,
        languages: {
            ...languages,
            'x-default': languages[i18n.defaultLocale] || canonicalPath
        }
    },
    openGraph: {
        title: note.frontmatter.title,
        description: note.frontmatter.description,
        url: canonicalPath,
        siteName: 'SnipGeek',
        locale: locale,
        type: 'article',
        publishedTime: note.frontmatter.date,
        modifiedTime: note.frontmatter.updated,
        authors: ['Iwan Efendi'],
    },
    twitter: {
        card: 'summary_large_image',
        title: note.frontmatter.title,
        description: note.frontmatter.description,
    },
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params;
  const note = await getNoteData(slug, locale);
  if (!note || !note.frontmatter.published) {
    notFound();
  }
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const dictionary = await getDictionary(locale as any);
  const headings = extractHeadings(note.content);

  // Reading time calculation (average 200 wpm)
  const wordCount = note.content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const itemForMeta = {
      slug: note.slug,
      title: note.frontmatter.title,
      description: note.frontmatter.description,
      href: `${linkPrefix}/notes/${note.slug}`,
      type: 'note' as const
  };

  const breadcrumbSegments = [
    { label: dictionary.home.breadcrumbHome, href: linkPrefix || '/' },
    { label: dictionary.navigation.notes, href: `${linkPrefix}/notes` }
  ];

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <article>
            <header className="text-center mb-8">
                <Breadcrumbs segments={breadcrumbSegments} className="justify-center mb-4" />
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
                    {note.frontmatter.title}
                </h1>
            </header>

            <PostMeta
                frontmatter={note.frontmatter}
                item={itemForMeta}
                locale={locale}
                dictionary={dictionary}
                readingTime={readingTime}
                isOverlay={false}
                isCentered={true}
            />

            <TableOfContents headings={headings} title={dictionary.post.toc} />
            
            <div className="text-lg text-foreground/80">
                <MDXRemote
                    source={note.content}
                    components={mdxComponents}
                    options={{
                        mdxOptions: {
                            remarkPlugins: [remarkGfm],
                            rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]],
                        },
                    }}
                />
            </div>

            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
                <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
                <ShareButtons
                    title={note.frontmatter.title}
                />
            </div>
            
            <PostComments article={{ slug: note.slug, title: note.frontmatter.title }} type="note" locale={locale} />
        </article>
      </main>

      <RelatedPosts 
        type="note"
        locale={locale}
        currentSlug={note.slug}
        currentTags={note.frontmatter.tags}
      />
    </div>
  );
}
