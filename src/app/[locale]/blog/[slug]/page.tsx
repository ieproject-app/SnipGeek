import { getPostData, getAllPostSlugs, getAllLocales, getSortedPostsData } from '@/lib/posts';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n } from '@/i18n-config';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import Link from 'next/link';
import { mdxComponents } from '@/components/mdx-components';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PostComments } from '@/components/blog/post-comments';
import { PostMeta } from '@/components/blog/post-meta';
import { ShareButtons } from '@/components/blog/share-buttons';
import { RelatedPosts } from '@/components/blog/related-posts';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { extractHeadings } from '@/lib/mdx-utils';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';

export async function generateStaticParams() {
  const locales = await getAllLocales();
  const allSlugs = await Promise.all(
    locales.map(async (locale) => {
      const slugs = await getAllPostSlugs(locale);
      return slugs.map(item => ({ slug: item.slug, locale }));
    })
  );
  return allSlugs.flat();
}

export default async function Page({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params;
  const initialPost = await getPostData(slug, locale);
  const dictionary = await getDictionary(locale as any);
  
  if (!initialPost) {
    notFound();
  }

  const linkPrefix = locale === 'en' ? '' : `/${locale}`;
  const { heroImage: heroImageValue, imageAlt, title } = initialPost.frontmatter;
  let heroSource: { url: string; hint?: string } | undefined;

  if (heroImageValue) {
    if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
      // Safe splitting by ensuring we have a string
      const imageHint = (imageAlt || title || 'article')
        .toString()
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 2)
        .join(' ');
        
      heroSource = { url: heroImageValue, hint: imageHint };
    } else {
      const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
      if (placeholder) {
        heroSource = { url: placeholder.imageUrl, hint: placeholder.imageHint };
      }
    }
  }
  
  const headings = extractHeadings(initialPost.content);
  const wordCount = initialPost.content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const itemForMeta = {
      slug: initialPost.slug,
      title: initialPost.frontmatter.title,
      description: initialPost.frontmatter.description,
      href: `${linkPrefix}/blog/${initialPost.slug}`,
      type: 'blog' as const,
  };

  const breadcrumbSegments = [
    { label: dictionary.home.breadcrumbHome, href: linkPrefix || '/' },
    { label: dictionary.navigation.blog, href: `${linkPrefix}/blog` },
    { label: initialPost.frontmatter.category || 'Blog' }
  ];

  const allPosts = await getSortedPostsData(locale);
  const initialRelatedContent = allPosts
    .filter(p => p.slug !== slug)
    .slice(0, 10);

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <article>
            <header className="mb-12 text-center">
                <Breadcrumbs segments={breadcrumbSegments} className="mb-6 justify-center" />
                
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-primary mb-6 max-w-3xl mx-auto">
                    {initialPost.frontmatter.title}
                </h1>

                <PostMeta 
                    frontmatter={initialPost.frontmatter} 
                    item={itemForMeta} 
                    locale={locale} 
                    dictionary={dictionary} 
                    readingTime={readingTime} 
                    isOverlay={false} 
                    isCentered={true}
                />

                <div className="relative mt-8 mb-12 rounded-xl overflow-hidden shadow-2xl bg-muted group ring-1 ring-primary/5">
                    {heroSource ? (
                        <Image
                            src={heroSource.url}
                            alt={imageAlt || initialPost.frontmatter.title}
                            width={1200}
                            height={630}
                            className="w-full h-auto aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 1200px) 100vw, 1200px"
                            priority
                            data-ai-hint={heroSource.hint}
                        />
                    ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-primary/5">
                            <span className="text-primary/20 font-headline text-6xl font-black">SnipGeek</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-3xl mx-auto">
                <TableOfContents headings={headings} title={dictionary.post.toc} />
                
                <div className="text-lg text-foreground/80 prose-content">
                    <MDXRemote
                        source={initialPost.content}
                        components={mdxComponents}
                        options={{
                            mdxOptions: {
                                remarkPlugins: [remarkGfm],
                                rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]],
                            },
                        }}
                    />
                </div>

                {initialPost.frontmatter.tags && initialPost.frontmatter.tags.length > 0 && (
                    <div className="mt-12 flex flex-wrap justify-center gap-3">
                        {initialPost.frontmatter.tags.map(tag => (
                            <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
                                <span className="text-sm font-bold text-accent hover:text-primary transition-all duration-300">#{tag}</span>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
                    <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
                    <ShareButtons title={initialPost.frontmatter.title} imageUrl={heroSource?.url} />
                </div>
                
                <PostComments article={{ slug: initialPost.slug, title: initialPost.frontmatter.title }} type="blog" locale={locale} />
            </div>
        </article>
      </main>
      <RelatedPosts 
        type="blog" 
        locale={locale} 
        currentSlug={initialPost.slug} 
        currentTags={initialPost.frontmatter.tags} 
        currentCategory={initialPost.frontmatter.category} 
        initialRelatedContent={initialRelatedContent}
        dictionary={dictionary}
      />
    </div>
  );
}
