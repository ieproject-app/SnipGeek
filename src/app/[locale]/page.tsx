import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Flame, ChevronRight } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { FeatureSlider } from '@/components/home/feature-slider';
import { TopicSection } from '@/components/home/topic-section';
import { HorizontalSlider } from '@/components/home/horizontal-slider';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const allPostsData = getSortedPostsData(locale);
  
  // 1. Featured Posts (Top 4)
  const featuredPosts = allPostsData.filter(post => post.frontmatter.published && post.frontmatter.featured).slice(0, 4);
  const featuredSlugs = new Set(featuredPosts.map(p => p.slug));

  // 2. Latest Posts (Excluding Featured, Top 6)
  const latestPosts = allPostsData
    .filter(post => post.frontmatter.published && !featuredSlugs.has(post.slug))
    .slice(0, 6);
  
  // 3. Slider (Filtered by category 'Tutorial')
  const sliderCategory = "Tutorial";
  const sliderPosts = allPostsData
    .filter(post => 
      post.frontmatter.published && 
      post.frontmatter.category?.toLowerCase() === sliderCategory.toLowerCase()
    )
    .slice(0, 6); 
  
  if (sliderPosts.length < 6) {
      sliderPosts.push(...allPostsData
        .filter(p => p.frontmatter.published && !sliderPosts.some(sp => sp.slug === p.slug))
        .slice(0, 6 - sliderPosts.length)
      );
  }

  // 4. Topic Section (Filtered by tag 'Windows', 8 items)
  const topicTag = "Windows"; 
  const topicPosts = allPostsData
    .filter(post => 
      post.frontmatter.published &&
      post.frontmatter.tags?.some(tag => tag.toLowerCase() === topicTag.toLowerCase())
    )
    .slice(0, 8);

  // 5. Software Updates Slider (Filtered by tag 'Android' for testing, 6 items)
  const updateTag = "Android";
  const updatePosts = allPostsData
    .filter(post => 
      post.frontmatter.published &&
      post.frontmatter.tags?.some(tag => tag.toLowerCase() === updateTag.toLowerCase())
    )
    .slice(0, 6);

  const dictionary = await getDictionary(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const renderFeaturedCard = (post: (typeof allPostsData)[0], index: number) => {
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
        <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group" aria-label={`Read more about ${post.frontmatter.title}`}>
            <article className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-2xl transition-all duration-300 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-primary/5">
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
                        className="object-cover transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 2}
                        data-ai-hint={heroImageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                    <p className="text-xs font-semibold mb-1 opacity-80">{post.frontmatter.category}</p>
                    <h3 className="font-headline text-xl font-extrabold leading-tight">
                        {post.frontmatter.title}
                    </h3>
                </div>
            </article>
        </Link>
    );
  }

  const renderLatestCard = (post: (typeof allPostsData)[0]) => {
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

    return (
        <div key={post.slug} className="group relative transition-all duration-300 hover:-translate-y-1">
            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
                    {heroImageSrc && (
                        <Image
                            src={heroImageSrc}
                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                            data-ai-hint={heroImageHint}
                        />
                    )}
                </div>

                {post.frontmatter.category && (
                    <p className="text-[10px] font-black tracking-wider text-accent mb-1.5">
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
      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-12 sm:py-16 mb-20 sm:mb-28 bg-primary/[0.03] dark:bg-muted/30 border-y border-primary/5">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {featuredPosts.map((post, index) => (
                  <div
                    key={post.slug}
                    className={cn(
                      "transform transition-all duration-300 ease-in-out will-change-transform",
                      (index === 0 || index === 2) && "rotate-2 -translate-y-4 hover:-translate-y-8",
                      (index === 1 || index === 3) && "-rotate-2 z-10 hover:-translate-y-4"
                    )}
                  >
                    {renderFeaturedCard(post, index)}
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      {latestPosts.length > 0 && (
        <section className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-12 text-center">{dictionary.home.latestPosts}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-16">
            {latestPosts.map((post) => renderLatestCard(post))}
          </div>
          
          {/* Custom "View All" Button Style */}
          <div className="flex justify-center">
            <Link 
                href={`${linkPrefix}/blog`}
                className="flex items-center gap-6 bg-muted/30 px-6 py-3 rounded-full border border-primary/5 hover:bg-muted/50 transition-all group"
            >
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

      {/* FeatureSlider Section (Tutorials) */}
      {sliderPosts.length > 0 && (
        <FeatureSlider 
          posts={sliderPosts as any} 
          title={dictionary.home.sliderAndShadow.title}
          viewMoreText={dictionary.home.sliderAndShadow.viewMore}
          locale={locale}
          tag={sliderCategory}
        />
      )}

      {/* TopicSection (Windows Style) */}
      {topicPosts.length > 0 && (
        <TopicSection 
          posts={topicPosts as any} 
          title={dictionary.home.specialTagSectionTitle}
          breadcrumbHome={dictionary.home.breadcrumbHome}
          viewAllText={dictionary.home.viewAllPosts}
          locale={locale}
          linkPrefix={linkPrefix}
          tag={topicTag}
        />
      )}

      {/* HorizontalSlider Section (Software Updates) */}
      {updatePosts.length > 0 && (
        <HorizontalSlider 
          posts={updatePosts as any}
          title={dictionary.home.softwareUpdateSlider.title}
          viewMoreText={dictionary.home.softwareUpdateSlider.viewMore}
          locale={locale}
          tag={updateTag}
        />
      )}
    </div>
  );
}
