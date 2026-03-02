
'use client';

import React, { useMemo } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { mdxComponents } from '@/components/mdx-components';
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

export function NotePageClient({ initialNote, slug, locale, dictionary, initialRelatedContent }: { initialNote: any, slug: string, locale: string, dictionary: any, initialRelatedContent: any[] }) {
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  if (!initialNote) {
    notFound();
  }

  const headings = extractHeadings(initialNote.content);
  const wordCount = initialNote.content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const itemForMeta = {
      slug: initialNote.slug,
      title: initialNote.frontmatter.title,
      description: initialNote.frontmatter.description,
      href: `${linkPrefix}/notes/${initialNote.slug}`,
      type: 'note' as const
  };

  const breadcrumbSegments = [
    { label: dictionary.home.breadcrumbHome, href: linkPrefix || '/' },
    { label: dictionary.navigation.notes, href: `${linkPrefix}/notes` }
  ];

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <article>
            <header className="mb-8">
                <Breadcrumbs segments={breadcrumbSegments} className="mb-10" />
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-6">
                    {initialNote.frontmatter.title}
                </h1>
                <PostMeta frontmatter={initialNote.frontmatter} item={itemForMeta} locale={locale} dictionary={dictionary} readingTime={readingTime} isOverlay={false} isCentered={false} />
            </header>
            <TableOfContents headings={headings} title={dictionary.post.toc} />
            <div className="text-lg text-foreground/80">
                <MDXRemote
                    source={initialNote.content}
                    components={mdxComponents}
                    options={{
                        mdxOptions: {
                            remarkPlugins: [remarkGfm],
                            rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]],
                        },
                    }}
                />
            </div>

            {/* Tags section moved here */}
            {initialNote.frontmatter.tags && initialNote.frontmatter.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-3">
                    {initialNote.frontmatter.tags.map(tag => (
                        <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
                            <span className="text-sm font-bold text-accent hover:text-primary transition-all duration-300">#{tag}</span>
                        </Link>
                    ))}
                </div>
            )}

            <div className="mt-16 flex flex-col gap-4 text-center border-t pt-12">
                <h3 className="text-lg font-semibold tracking-tight text-primary">{dictionary.post.shareArticle}</h3>
                <ShareButtons title={initialNote.frontmatter.title} />
            </div>
            <PostComments article={{ slug: initialNote.slug, title: initialNote.frontmatter.title }} type="note" locale={locale} />
        </article>
      </main>
      <RelatedPosts 
        type="note" 
        locale={locale} 
        currentSlug={initialNote.slug} 
        currentTags={initialNote.frontmatter.tags} 
        initialRelatedContent={initialRelatedContent}
        dictionary={dictionary}
      />
    </div>
  );
}
