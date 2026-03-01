
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { CategoryBadge } from '@/components/layout/category-badge';

export function BlogListClient({ initialPosts, dictionary, locale }: { initialPosts: any[], dictionary: any, locale: string }) {
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  const allPosts = useMemo(() => {
    return [...initialPosts].sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  }, [initialPosts]);

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <header className="mb-16 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.navigation.blog}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
                {dictionary.blog.description}
            </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {allPosts.map((post) => {
                const heroImageValue = post.frontmatter.heroImage;
                let heroImageSrc: string | undefined;
                let heroImageHint: string | undefined;

                if (heroImageValue) {
                    if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
                        heroImageSrc = heroImageValue;
                        heroImageHint = post.frontmatter.imageAlt || post.frontmatter.title;
                    } else {
                        const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
                        if (placeholder) {
                            heroImageSrc = placeholder.imageUrl;
                            heroImageHint = placeholder.imageHint;
                        }
                    }
                }
                
                const item = {
                    slug: post.slug,
                    title: post.frontmatter.title,
                    description: post.frontmatter.description,
                    href: `${linkPrefix}/blog/${post.slug}`,
                    type: 'blog' as const,
                };
                return (
                    <div key={post.slug} className="group relative transition-all duration-300 hover:-translate-y-1">
                        <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                            <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4 shadow-sm transition-shadow duration-300">
                                {heroImageSrc && (
                                    <Image
                                        src={heroImageSrc}
                                        alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                                        data-ai-hint={heroImageHint}
                                    />
                                )}
                            </div>

                            <div className="mb-1.5">
                                <CategoryBadge category={post.frontmatter.category} />
                            </div>
                            <h3 className="font-headline text-xl font-bold tracking-tight text-primary transition-colors group-hover:text-accent">
                                {post.frontmatter.title}
                            </h3>
                            <p className="leading-relaxed text-muted-foreground mt-2 text-sm line-clamp-3">
                                {post.frontmatter.description}
                            </p>
                        </Link>
                         <AddToReadingListButton 
                            item={item}
                            dictionary={dictionary.readingList}
                            showText={false}
                            className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </div>
                )
            })}
          </section>
      </main>
    </div>
  );
}
