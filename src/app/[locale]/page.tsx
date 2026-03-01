
import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatRelativeTime } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { ChevronRight } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { FeatureSlider } from '@/components/home/feature-slider';
import { TopicSection } from '@/components/home/topic-section';
import { HorizontalSlider } from '@/components/home/horizontal-slider';
import { FeaturedPosts } from '@/components/home/featured-posts';

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

                {/* Category Label - Moved below image, above title */}
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
      {/* Featured Posts Section */}
      <FeaturedPosts 
        posts={featuredPosts} 
        dictionary={dictionary} 
        locale={locale} 
        linkPrefix={linkPrefix} 
      />

      {/* Latest Posts Section - Container reverted to 4xl */}
      {latestPosts.length > 0 && (
        <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pb-16">
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-12 text-center">
            {dictionary.home.latestPosts}
          </h2>
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
          readingListDictionary={dictionary.readingList}
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
          readingListDictionary={dictionary.readingList}
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
          readingListDictionary={dictionary.readingList}
          locale={locale}
          tag={updateTag}
        />
      )}
    </div>
  );
}
