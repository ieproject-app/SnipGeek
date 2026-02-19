
import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Flame } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function Home({ params: { locale } }: { params: { locale: string } }) {
  const allPostsData = getSortedPostsData(locale);
  
  // 1. Featured Posts (Top 4)
  const featuredPosts = allPostsData.filter(post => post.frontmatter.featured).slice(0, 4);
  const featuredSlugs = new Set(featuredPosts.map(p => p.slug));

  // 2. Latest Posts (Excluding Featured, Top 4)
  const latestPosts = allPostsData
    .filter(post => !featuredSlugs.has(post.slug))
    .slice(0, 4);
  const latestSlugs = new Set(latestPosts.map(p => p.slug));
  
  // 3. Special Tag Section (Excluding Featured & Latest, Top 4)
  const specialTag = "Windows"; 
  const specialTagPosts = allPostsData
    .filter(post => 
      post.frontmatter.tags?.some(tag => tag.toLowerCase() === specialTag.toLowerCase()) &&
      !featuredSlugs.has(post.slug) &&
      !latestSlugs.has(post.slug)
    )
    .slice(0, 4);

  const dictionary = await getDictionary(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const renderPostCard = (post: (typeof allPostsData)[0], isFeatured: boolean) => {
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

    if (isFeatured) {
        return (
            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group" aria-label={`Read more about ${post.frontmatter.title}`}>
                <article className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
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
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            data-ai-hint={heroImageHint}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{post.frontmatter.category}</p>
                        <h3 className="font-headline text-xl font-bold line-clamp-2">
                            {post.frontmatter.title}
                        </h3>
                        <p className="text-xs opacity-70 mt-2 line-clamp-2 font-medium">
                            {post.frontmatter.description}
                        </p>
                    </div>
                </article>
            </Link>
        );
    }

    return (
        <div key={post.slug} className="group relative">
            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4">
                    {heroImageSrc && (
                        <Image
                            src={heroImageSrc}
                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            data-ai-hint={heroImageHint}
                        />
                    )}
                </div>

                {post.frontmatter.category && <p className="text-sm text-muted-foreground mb-1">{post.frontmatter.category}</p>}
                <h3 className="font-headline text-xl font-bold tracking-tight text-primary transition-colors">
                    {post.frontmatter.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground mt-2 text-sm line-clamp-3">
                    {post.frontmatter.description}
                </p>
            </Link>
            
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.frontmatter.tags.slice(0, 3).map(tag => (
                        <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
                            <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                                {tag}
                            </Badge>
                        </Link>
                    ))}
                </div>
            )}

            <AddToReadingListButton 
                item={item}
                showText={false}
                dictionary={dictionary.readingList}
                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </div>
    );
  }


  return (
    <div className="w-full">
      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="pt-24 sm:pt-32 mb-20 sm:mb-28">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {featuredPosts.map((post, index) => (
                  <div
                    key={post.slug}
                    className={cn(
                      "transform transition-all duration-300 ease-in-out hover:scale-105",
                      (index === 0 || index === 2) && "rotate-2 -translate-y-4 hover:-translate-y-6",
                      (index === 1 || index === 3) && "-rotate-2 z-10 hover:-translate-y-2"
                    )}
                  >
                    {renderPostCard(post, true)}
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      {latestPosts.length > 0 && (
        <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-8 text-center">{dictionary.home.latestPosts}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mb-12">
            {latestPosts.map((post) => renderPostCard(post, false))}
          </div>
          <div className="flex justify-center mb-16">
            <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href={`${linkPrefix}/blog`}>
                    {dictionary.home.viewAllPosts}
                </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Special Tag Section */}
      {specialTagPosts.length > 0 && (
        <section className="bg-muted/30 py-16 mb-12">
            <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-8 text-center">
                    {dictionary.home.specialTagSectionTitle.replace('{tag}', specialTag)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                    {specialTagPosts.map((post) => renderPostCard(post, false))}
                </div>
                <div className="flex justify-center mt-12">
                    <Button asChild variant="ghost" className="rounded-full">
                        <Link href={`${linkPrefix}/tags/${specialTag.toLowerCase()}`}>
                            {dictionary.home.viewAllPosts}
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
      )}
    </div>
  );
}
