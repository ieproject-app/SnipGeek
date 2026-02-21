import { getPostData, getAllPostSlugs, getAllLocales, getAllTranslationsMap as getAllPostTranslationsMap } from '@/lib/posts';
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
import { RelatedPosts } from '@/components/blog/related-posts';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { extractHeadings } from '@/lib/mdx-utils';

export async function generateStaticParams() {
  const locales = getAllLocales();
  const allParams = locales.flatMap((locale) => {
    const slugs = getAllPostSlugs(locale);
    return slugs.map(item => ({ slug: item.slug, locale: locale }));
  });
  return allParams;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getPostData(slug, locale);
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

  const translationsMap = getAllPostTranslationsMap();
  const translationKey = post.frontmatter.translationKey;
  const languages: Record<string, string> = {};
  
  i18n.locales.forEach((loc) => {
    const translation = translationsMap[translationKey]?.find(t => t.locale === loc);
    if (translation) {
      const prefix = loc === i18n.defaultLocale ? '' : `/${loc}`;
      languages[loc] = `${prefix}/blog/${translation.slug}`;
    }
  });

  const currentPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const canonicalPath = `${currentPrefix}/blog/${post.slug}`;
  const imageAlt = postImageAlt || post.frontmatter.title;

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: {
        canonical: canonicalPath,
        languages: {
            ...languages,
            'x-default': languages[i18n.defaultLocale] || canonicalPath
        }
    },
    openGraph: {
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        url: canonicalPath,
        siteName: 'SnipGeek',
        images: heroImageUrl ? [
            {
                url: heroImageUrl,
                width: 1200,
                height: 630,
                alt: imageAlt,
            },
        ] : [],
        locale: locale,
        type: 'article',
        publishedTime: post.frontmatter.date,
        modifiedTime: post.frontmatter.updated,
        authors: ['Iwan Efendi'],
    },
    twitter: {
        card: 'summary_large_image',
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        images: heroImageUrl ? [{url: heroImageUrl, alt: imageAlt}] : [],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params;
  const post = await getPostData(slug, locale);
  if (!post || !post.frontmatter.published) {
    notFound();
  }

  const { heroImage: heroImageValue, imageAlt } = post.frontmatter;
  let heroSource: { url: string; hint?: string } | undefined;

  if (heroImageValue) {
    if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
      heroSource = { 
        url: heroImageValue,
        hint: imageAlt?.toLowerCase().split(' ').slice(0, 2).join(' ') 
      };
    } else {
      const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
      if (placeholder) {
        heroSource = { url: placeholder.imageUrl, hint: placeholder.imageHint };
      }
    }
  }
  
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const dictionary = await getDictionary(locale as any);
  const headings = extractHeadings(post.content);

  const wordCount = post.content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const itemForMeta = {
      slug: post.slug,
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      href: `${linkPrefix}/blog/${post.slug}`,
      type: 'blog' as const,
  };

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <article>
            <header className="text-center mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
                    {post.frontmatter.title}
                </h1>
            </header>

            <div className="relative my-8 sm:my-12 rounded-2xl overflow-hidden shadow-2xl bg-muted group">
                {heroSource ? (
                    <Image
                        src={heroSource.url}
                        alt={imageAlt || post.frontmatter.title}
                        width={1200}
                        height={630}
                        className="w-full h-auto aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                        priority
                        data-ai-hint={heroSource.hint}
                    />
                ) : (
                    <div className="w-full aspect-video flex items-center justify-center bg-primary/5">
                        <span className="text-primary/20 font-headline text-6xl font-black">SnipGeek</span>
                    </div>
                )}
                
                {/* Minimalist Overlay Metadata */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-6 sm:p-8">
                    <PostMeta 
                        frontmatter={post.frontmatter}
                        item={itemForMeta}
                        locale={locale}
                        dictionary={dictionary}
                        readingTime={readingTime}
                        isOverlay={true}
                    />
                </div>
            </div>

            <TableOfContents headings={headings} title={dictionary.post.toc} />
            
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

            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
                <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
                <ShareButtons
                    title={post.frontmatter.title}
                    imageUrl={heroSource?.url}
                />
            </div>
            
            <PostComments article={{ slug: post.slug, title: post.frontmatter.title }} type="blog" locale={locale} />
        </article>
      </main>

      <RelatedPosts 
        type="blog"
        locale={locale}
        currentSlug={post.slug}
        currentTags={post.frontmatter.tags}
        currentCategory={post.frontmatter.category}
      />
    </div>
  );
}
