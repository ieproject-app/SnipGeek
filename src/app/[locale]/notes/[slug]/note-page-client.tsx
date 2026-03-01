
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { MDXRemote } from 'next-mdx-remote/rsc';
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

export function NotePageClient({ initialNote, slug, locale, dictionary }: { initialNote: any, slug: string, locale: string, dictionary: any }) {
  const db = useFirestore();
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  const noteQuery = useMemoFirebase(() => 
    query(
        collection(db, 'notes_published'),
        where('slug', '==', slug),
        where('locale', '==', locale),
        limit(1)
    ), [db, slug, locale]);
  
  const { data: fsResults, isLoading } = useCollection(noteQuery);
  
  const note = useMemo(() => {
    if (initialNote) return initialNote;
    if (fsResults && fsResults.length > 0) {
        const fn = fsResults[0];
        return {
            slug: fn.slug,
            content: fn.contentMdx,
            frontmatter: {
                ...fn,
                date: fn.publishDate || fn.date,
                published: true
            }
        };
    }
    return null;
  }, [initialNote, fsResults]);

  if (!note && !isLoading) {
    notFound();
  }

  if (!note) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="animate-pulse text-primary font-headline font-black">SNIPGEEK.</div>
        </div>
    );
  }

  const headings = extractHeadings(note.content);
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <article>
            <header className="mb-8">
                <Breadcrumbs segments={breadcrumbSegments} className="mb-10" />
                <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-6">
                    {note.frontmatter.title}
                </h1>
                <PostMeta frontmatter={note.frontmatter} item={itemForMeta} locale={locale} dictionary={dictionary} readingTime={readingTime} isOverlay={false} isCentered={false} />
            </header>
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
                <ShareButtons title={note.frontmatter.title} />
            </div>
            <PostComments article={{ slug: note.slug, title: note.frontmatter.title }} type="note" locale={locale} />
        </article>
      </main>
      <RelatedPosts type="note" locale={locale} currentSlug={note.slug} currentTags={note.frontmatter.tags} />
    </div>
  );
}
