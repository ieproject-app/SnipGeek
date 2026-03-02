'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post, PostFrontmatter } from '@/lib/posts';
import { Dictionary } from '@/lib/get-dictionary';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { ArrowRight } from 'lucide-react';
import { CategoryBadge, getBadgeStyle } from '@/components/layout/category-badge';

interface FeaturedPostsProps {
  posts: Post<PostFrontmatter>[];
  dictionary: Dictionary;
  locale: string;
  linkPrefix: string;
}

/**
 * FeaturedPosts - A sophisticated 4-column staggered gallery grid using the colorful badge system.
 * Updated with standard section spacing (py-12 sm:py-16).
 */
export function FeaturedPosts({ posts, dictionary, locale, linkPrefix }: FeaturedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-primary/[0.03] border-y border-primary/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
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

            const category = post.frontmatter.category || 'Tutorial';
            const badgeStyle = getBadgeStyle(category);
            const isStaggered = index % 2 !== 0;
            
            const item = {
                slug: post.slug,
                title: post.frontmatter.title,
                description: post.frontmatter.description,
                href: `${linkPrefix}/blog/${post.slug}`,
                type: 'blog' as const,
            };

            return (
              <div 
                key={post.slug} 
                className={cn(
                    "group relative transition-all duration-500 ease-out",
                    isStaggered && "lg:mt-10"
                )}
              >
                <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read ${post.frontmatter.title}`}>
                    <article className="space-y-5">
                        {/* Image Block */}
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-md group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-500">
                            {/* Category Badge */}
                            <div className="absolute top-4 left-4 z-20">
                                <CategoryBadge 
                                    category={category} 
                                    size="sm" 
                                    className="backdrop-blur-md border-white/20 shadow-sm"
                                />
                            </div>

                            {/* Accent Bar */}
                            <div 
                                className={cn("absolute bottom-0 left-0 right-0 h-[3px] z-30 transition-opacity duration-500 opacity-0 group-hover:opacity-100", badgeStyle.dot)}
                            />

                            {/* Hero Image */}
                            {heroImageSrc && (
                                <Image
                                    src={heroImageSrc}
                                    alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                    fill
                                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.06]"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    priority={index < 4}
                                    data-ai-hint={heroImageHint}
                                />
                            )}
                        </div>

                        {/* Caption Block */}
                        <div className="px-1 space-y-3">
                            <h3 className="font-headline text-lg font-bold leading-snug text-primary group-hover:text-accent transition-colors duration-300">
                                {post.frontmatter.title}
                            </h3>

                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                                    {formatRelativeTime(new Date(post.frontmatter.date), locale)}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <AddToReadingListButton 
                                        item={item}
                                        dictionary={dictionary}
                                        showText={false}
                                        className="h-8 w-8 rounded-full border-none bg-primary/[0.03] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                    />
                                    <div 
                                        className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-transform duration-300 group-hover:translate-x-1", badgeStyle.text)}
                                    >
                                        READ <ArrowRight className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                            </div>
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
