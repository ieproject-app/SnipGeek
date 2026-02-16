import { getPostData, getAllPostSlugs, getAllLocales } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { mdxComponents } from '@/components/mdx-components';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Metadata } from 'next';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import { Badge } from '@/components/ui/badge';
import { PostComments } from '@/components/blog/post-comments';

export async function generateStaticParams() {
  const locales = getAllLocales();
  const allParams = locales.flatMap((locale) => {
    const slugs = getAllPostSlugs(locale);
    return slugs.map(item => ({ slug: item.slug, locale: locale }));
  });
  return allParams;
}

export async function generateMetadata({ params }: { params: { slug: string, locale: string } }): Promise<Metadata> {
  const post = await getPostData(params.slug, params.locale);
  if (!post) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  const heroImage = PlaceHolderImages.find(p => p.id === post.frontmatter.heroImage);
  const path = `/${params.locale}/blog/${post.slug}`;
  const imageAlt = post.frontmatter.imageAlt || post.frontmatter.title;

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        url: path,
        siteName: 'SnipGeek',
        images: heroImage ? [
            {
                url: heroImage.imageUrl,
                width: 1200,
                height: 630,
                alt: imageAlt,
            },
        ] : [],
        locale: params.locale,
        type: 'article',
        publishedTime: post.frontmatter.date,
        modifiedTime: post.frontmatter.updated,
        authors: ['SnipGeek'],
    },
    twitter: {
        card: 'summary_large_image',
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        images: heroImage ? [{url: heroImage.imageUrl, alt: imageAlt}] : [],
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string, locale: string } }) {
  const post = await getPostData(params.slug, params.locale);
  if (!post || !post.frontmatter.published) {
    notFound();
  }

  const heroImage = PlaceHolderImages.find(p => p.id === post.frontmatter.heroImage);
  const linkPrefix = params.locale === i18n.defaultLocale ? '' : `/${params.locale}`;
  const dictionary = await getDictionary(params.locale);

  return (
    <main className="w-full">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        {heroImage && (
          <div className="mb-8 sm:mb-12">
            <Image
              src={heroImage.imageUrl}
              alt={post.frontmatter.imageAlt || post.frontmatter.title}
              width={1200}
              height={630}
              className="w-full h-auto rounded-xl shadow-lg object-cover"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          </div>
        )}
        <header>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
            {post.frontmatter.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm mb-4">
            <p>
              {`Published on ${new Date(post.frontmatter.date).toLocaleDateString(params.locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`}
            </p>
            {post.frontmatter.updated && (
                <p>
                    {`(Updated on ${new Date(post.frontmatter.updated).toLocaleDateString(params.locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })})`}
                </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <AddToReadingListButton 
              item={{
                  slug: post.slug,
                  title: post.frontmatter.title,
                  description: post.frontmatter.description,
                  href: `${linkPrefix}/blog/${post.slug}`,
                  type: 'blog'
              }}
              dictionary={dictionary.readingList}
            />
             {post.frontmatter.tags && post.frontmatter.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </header>
        <div className="text-lg text-foreground/80">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]],
              },
            }}
          />
        </div>
        
        {/* Disqus Comments Section */}
        <PostComments article={{ slug: post.slug, title: post.frontmatter.title }} type="blog" locale={params.locale} />

      </article>
    </main>
  );
}
