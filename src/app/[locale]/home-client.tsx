
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { ChevronRight } from 'lucide-react';
import { FeatureSlider } from '@/components/home/feature-slider';
import { TopicSection } from '@/components/home/topic-section';
import { HorizontalSlider } from '@/components/home/horizontal-slider';
import { FeaturedPosts } from '@/components/home/featured-posts';

export function HomeClient({ initialPosts, dictionary, locale }: { initialPosts: any[], dictionary: any, locale: string }) {
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  // We now only use initialPosts from local MDX files
  const allPosts = useMemo(() => {
    return [...initialPosts].sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  }, [initialPosts]);

  // 1. Featured Posts (Top 4)
  const featuredPosts = allPosts.filter(post => post.frontmatter.published && post.frontmatter.featured).slice(0, 4);
  const featuredSlugs = new Set(featuredPosts.map(p => p.slug));

  // 2. Latest Posts (Excluding Featured, Top 6)
  const latestPosts = allPosts
    .filter(post => post.frontmatter.published && !featuredSlugs.has(post.slug))
    .slice(0, 6);
  
  // 3. Slider (Filtered by category 'Tutorial')
  const sliderCategory = "Tutorial";
  const sliderPosts = allPosts
    .filter(post => 
      post.frontmatter.published && 
      post.frontmatter.category?.toLowerCase() === sliderCategory.toLowerCase()
    )
    .slice(0, 6); 

  // 4. Topic Section (Filtered by tag 'Windows', 8 items)
  const topicTag = "Windows"; 
  const topicPosts = allPosts
    .filter(post => 
      post.frontmatter.published &&
      post.frontmatter.tags?.some((tag: string) => tag.toLowerCase() === "windows")
    )
    .slice(0, 8);

  // 5. Software Updates Slider
  const updateTag = "Android";
  const updatePosts = allPosts
    .filter(post => 
      post.frontmatter.published &&
      post.frontmatter.tags?.some((tag: string) => tag.toLowerCase() === updateTag.toLowerCase())
    )
    .slice(0, 6);

  const renderLatestCard = (post: any) => {
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
        <div key={post.slug} className="group relative transition-all duration-500 hover:-translate-y-1">
            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg mb-4 shadow-sm transition-all duration-500 border border-primary/5">
                    {heroImageSrc && (
                        <Image
                            src={heroImageSrc}
                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                            data-ai-hint={heroImageHint}
                        />
                    )}
                    <AddToReadingListButton 
                        item={item}
                        dictionary={dictionary.readingList}
                        showText={false}
                        className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>

                {post.frontmatter.category && (
                    <p className="text-[10px] font-bold tracking-wider text-accent mb-1.5 uppercase">
                        {post.frontmatter.category}
                    </p>
                )}
                <h3 className="font-headline text-base font-bold tracking-tight text-primary transition-colors group-hover:text-accent leading-tight">
                    {post.frontmatter.title}
                </h3>
                <time className="text-[10px] font-medium text-muted-foreground mt-2 block opacity-60">
                    {formatRelativeTime(new Date(post.frontmatter.date), locale)}
                </time>
            </Link>
        </div>
    );
  }

  return (
    <div className="w-full">
      <FeaturedPosts posts={featuredPosts as any} dictionary={dictionary} locale={locale} linkPrefix={linkPrefix} />

      {latestPosts.length > 0 && (
        <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pb-16">
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-12 text-center">
            {dictionary.home.latestPosts}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-16">
            {latestPosts.map((post) => renderLatestCard(post))}
          </div>
          <div className="flex justify-center">
            <Link href={`${linkPrefix}/blog`} className="flex items-center gap-6 bg-muted/30 px-6 py-3 rounded-full border border-primary/5 hover:bg-muted/50 transition-all group">
                <div className="flex items-center gap-2 pr-4 border-r border-primary/10">
                    <div className="h-1.5 w-8 bg-accent rounded-full" />
                    <div className="h-1.5 w-1.5 bg-primary/20 rounded-full" />
                    <div className="h-1.5 w-1.5 bg-primary/20 rounded-full" />
                </div>
                <span className="text-sm font-bold text-primary/80 group-hover:text-primary transition-all flex items-center gap-2">
                    {dictionary.home.viewAllPosts}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
            </Link>
          </div>
        </section>
      )}

      {sliderPosts.length > 0 && (
        <FeatureSlider posts={sliderPosts as any} title={dictionary.home.sliderAndShadow.title} viewMoreText={dictionary.home.sliderAndShadow.viewMore} readingListDictionary={dictionary.readingList} locale={locale} tag={sliderCategory} />
      )}

      {topicPosts.length > 0 && (
        <TopicSection posts={topicPosts as any} title={dictionary.home.specialTagSectionTitle} breadcrumbHome={dictionary.home.breadcrumbHome} viewAllText={dictionary.home.viewAllPosts} readingListDictionary={dictionary.readingList} locale={locale} linkPrefix={linkPrefix} tag={topicTag} />
      )}

      {updatePosts.length > 0 && (
        <HorizontalSlider posts={updatePosts as any} title={dictionary.home.softwareUpdateSlider.title} viewMoreText={dictionary.home.softwareUpdateSlider.viewMore} readingListDictionary={dictionary.readingList} locale={locale} tag={updateTag} />
      )}
    </div>
  );
}
