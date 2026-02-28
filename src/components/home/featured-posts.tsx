
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post, PostFrontmatter } from '@/lib/posts';
import { Dictionary } from '@/lib/get-dictionary';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Flame } from 'lucide-react';

interface FeaturedPostsProps {
  posts: Post<PostFrontmatter>[];
  dictionary: Dictionary;
  locale: string;
  linkPrefix: string;
}

/**
 * FeaturedPosts - Dedicated component for the hero section of the homepage.
 * Currently uses a dynamic rotation layout.
 */
export function FeaturedPosts({ posts, dictionary, locale, linkPrefix }: FeaturedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-primary/[0.03] dark:bg-muted/30 border-y border-primary/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {posts.map((post, index) => {
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

            // Current visual "Config": Rotation and translation based on index
            const layoutClasses = cn(
                "transform transition-all duration-500 ease-in-out will-change-transform",
                (index === 0 || index === 2) && "rotate-2 -translate-y-4 hover:-translate-y-8",
                (index === 1 || index === 3) && "-rotate-2 z-10 hover:-translate-y-4"
            );

            return (
              <div key={post.slug} className={layoutClasses}>
                <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group" aria-label={`Read more about ${post.frontmatter.title}`}>
                    <article className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-xl transition-all duration-500 border-primary/5">
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                            <AddToReadingListButton 
                                item={item}
                                dictionary={dictionary.readingList}
                                showText={false}
                                className="text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <Flame className="h-5 w-5 text-orange-400 fill-orange-400" />
                        </div>
                        {heroImageSrc && (
                            <Image
                                src={heroImageSrc}
                                alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={index < 2}
                                data-ai-hint={heroImageHint}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                            <p className="text-[10px] font-semibold mb-1 opacity-80">{post.frontmatter.category}</p>
                            <h3 className="font-headline text-xl font-extrabold leading-tight">
                                {post.frontmatter.title}
                            </h3>
                        </div>
                    </article>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
