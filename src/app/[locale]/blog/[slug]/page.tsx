import { getPostData, getAllPostSlugs, getAllLocales } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { mdxComponents } from '@/components/mdx-components';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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

  const { heroImage: heroImageValue, imageAlt: postImageAlt } = post.frontmatter;
  let heroImageUrl: string | undefined;

  if (heroImageValue) {
    if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
      heroImageUrl = heroImageValue;
    } else {
      const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
      if (placeholder) {
        heroImageUrl = placeholder.imageUrl;
      }
    }
  }

  const path = `/${params.locale}/blog/${post.slug}`;
  const imageAlt = postImageAlt || post.frontmatter.title;

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
        images: heroImageUrl ? [
            {
                url: heroImageUrl,
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
        images: heroImageUrl ? [{url: heroImageUrl, alt: imageAlt}] : [],
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string, locale: string } }) {
  const post = await getPostData(params.slug, params.locale);
  if (!post || !post.frontmatter.published) {
    notFound();
  }

  const { heroImage: heroImageValue, imageAlt } = post.frontmatter;
  let heroSource: { url: string; hint?: string } | undefined;

  if (heroImageValue) {
    // Check if heroImage is a full URL or a local path
    if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
      heroSource = { 
        url: heroImageValue,
        // Generate a hint from the alt text if available
        hint: imageAlt?.toLowerCase().split(' ').slice(0, 2).join(' ') 
      };
    } else {
      // Otherwise, treat it as an ID for placeholder images
      const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
      if (placeholder) {
        heroSource = { url: placeholder.imageUrl, hint: placeholder.imageHint };
      }
    }
  }
  
  const linkPrefix = params.locale === i18n.defaultLocale ? '' : `/${params.locale}`;
  const dictionary = await getDictionary(params.locale);

  const itemForMeta = {
      slug: post.slug,
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      href: `${linkPrefix}/blog/${post.slug}`,
      type: 'blog' as const,
  };

  return (
    <main className="w-full">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
            {post.frontmatter.title}
          </h1>
        </header>

        {heroSource && (
          <div className="my-8 sm:my-12">
            <Image
              src={heroSource.url}
              alt={imageAlt || post.frontmatter.title}
              width={1200}
              height={630}
              className="w-full h-auto rounded-xl shadow-lg object-cover"
              priority
              data-ai-hint={heroSource.hint}
            />
          </div>
        )}

        <PostMeta 
          frontmatter={post.frontmatter}
          item={itemForMeta}
          locale={params.locale}
          dictionary={dictionary}
        />
        
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

        <div className="mt-12 flex flex-col gap-4 text-center">
            <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
            <ShareButtons
                title={post.frontmatter.title}
                imageUrl={heroSource?.url}
            />
        </div>
        
        <PostComments article={{ slug: post.slug, title: post.frontmatter.title }} type="blog" locale={params.locale} />

      </article>
    </main>
  );
}
