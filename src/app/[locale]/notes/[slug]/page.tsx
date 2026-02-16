import { getNoteData, getAllNoteSlugs, getAllLocales } from '@/lib/notes';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx-components';
import type { Metadata } from 'next';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';

export async function generateStaticParams() {
  const locales = getAllLocales();
  const allParams = locales.flatMap((locale) => {
    const slugs = getAllNoteSlugs(locale);
    return slugs.map(item => ({ slug: item.slug, locale: locale }));
  });
  return allParams;
}

export async function generateMetadata({ params }: { params: { slug: string, locale: string } }): Promise<Metadata> {
  const note = await getNoteData(params.slug, params.locale);
  if (!note) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  const path = `/${params.locale}/notes/${note.slug}`;

  return {
    title: note.frontmatter.title,
    description: note.frontmatter.description,
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: note.frontmatter.title,
        description: note.frontmatter.description,
        url: path,
        siteName: 'SnipGeek',
        locale: params.locale,
        type: 'article',
        publishedTime: note.frontmatter.date,
        authors: ['SnipGeek'],
    },
    twitter: {
        card: 'summary_large_image',
        title: note.frontmatter.title,
        description: note.frontmatter.description,
    },
  };
}

export default async function NotePage({ params }: { params: { slug: string, locale: string } }) {
  const note = await getNoteData(params.slug, params.locale);
  if (!note) {
    notFound();
  }
  const linkPrefix = params.locale === i18n.defaultLocale ? '' : `/${params.locale}`;
  const dictionary = await getDictionary(params.locale);

  return (
    <main className="w-full">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
            {note.frontmatter.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <p className="text-muted-foreground text-base">
                {new Date(note.frontmatter.date).toLocaleDateString(params.locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                })}
            </p>
            <AddToReadingListButton 
                item={{
                    slug: note.slug,
                    title: note.frontmatter.title,
                    description: note.frontmatter.description,
                    href: `${linkPrefix}/notes/${note.slug}`,
                    type: 'note'
                }}
                dictionary={dictionary.readingList}
            />
          </div>
        </header>
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
      </article>
    </main>
  );
}
