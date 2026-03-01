
'use client';

import React, { useMemo } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { mdxComponents } from '@/components/mdx-components';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PostComments } from '@/components/blog/post-comments';
import { PostMeta } from '@/components/blog/post-meta';
import { ShareButtons } from '@/components/blog/share-buttons';
import { RelatedPosts } from '@/components/blog/related-posts';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { extractHeadings } from '@/lib/mdx-utils';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { notFound } from 'next/navigation';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';

export function PostPageClient({ initialPost, slug, locale, dictionary, initialRelatedContent }: { initialPost: any, slug: string, locale: string, dictionary: any, initialRelatedContent: any[] }) {
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  // Pure MDX logic, no Firestore fetch for posts
  if (!initialPost) {
    notFound();
  }

  const { heroImage: heroImageValue, imageAlt } = initialPost.frontmatter;
  let heroSource: { url: string; hint?: string } | undefined;

  if (heroImageValue) {
    if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
      heroSource = { url: heroImageValue, hint: imageAlt?.toLowerCase().split(' ').slice(0, 2).join(' ') };
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

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <article>
            <header className="mb-12">
                <Breadcrumbs segments={breadcrumbSegments} className="mb-10" />
                <div className="relative mt-0 mb-8 rounded-lg overflow-hidden shadow-xl bg-muted group">
                    {heroSource ? (
                        <Image
                            src={heroSource.url}
                            alt={imageAlt || initialPost.frontmatter.title}
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
                </div>
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-6">
                    {initialPost.frontmatter.title}
                </h1>
                <PostMeta frontmatter={initialPost.frontmatter} item={itemForMeta} locale={locale} dictionary={dictionary} readingTime={readingTime} isOverlay={false} />
            </header>
            <TableOfContents headings={headings} title={dictionary.post.toc} />
            <div className="text-lg text-foreground/80">
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
            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
                <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
                <ShareButtons title={initialPost.frontmatter.title} imageUrl={heroSource?.url} />
            </div>
            <PostComments article={{ slug: initialPost.slug, title: initialPost.frontmatter.title }} type="blog" locale={locale} />
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
