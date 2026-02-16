import { getNoteData, getAllNoteSlugs, getAllLocales } from '@/lib/notes';
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
        siteName: 'Iwan Efendi',
        locale: params.locale,
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

export default async function NotePage({ params }: { params: { slug: string, locale: string } }) {
  const note = await getNoteData(params.slug, params.locale);
  if (!note || !note.frontmatter.published) {
    notFound();
  }
  const linkPrefix = params.locale === i18n.defaultLocale ? '' : `/${params.locale}`;
  const dictionary = await getDictionary(params.locale);

  const itemForMeta = {
      slug: note.slug,
      title: note.frontmatter.title,
      description: note.frontmatter.description,
      href: `${linkPrefix}/notes/${note.slug}`,
      type: 'note' as const
  };

  return (
    <main className="w-full">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
            {note.frontmatter.title}
          </h1>
        </header>

        <PostMeta
            frontmatter={note.frontmatter}
            item={itemForMeta}
            locale={params.locale}
            dictionary={dictionary}
        />
        
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

        <div className="mt-12 flex flex-col gap-4 text-center">
            <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
            <ShareButtons
                title={note.frontmatter.title}
            />
        </div>
        
        <PostComments article={{ slug: note.slug, title: note.frontmatter.title }} type="note" locale={params.locale} />

      </article>
    </main>
  );
}
