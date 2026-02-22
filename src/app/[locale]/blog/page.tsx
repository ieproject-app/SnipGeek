
import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { getDictionary } from '@/lib/get-dictionary';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const currentPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const canonicalPath = `${currentPrefix}/blog`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? '' : `/${loc}`;
    languages[loc] = `${prefix}/blog`;
  });

  return {
    title: dictionary.blog.title,
    description: dictionary.blog.description,
    alternates: {
        canonical: canonicalPath,
        languages: {
            ...languages,
            'x-default': languages[i18n.defaultLocale] || canonicalPath
        }
    }
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const allPostsData = getSortedPostsData(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-16 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.navigation.blog}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
                {dictionary.blog.description}
            </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {allPostsData.map((post) => {
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
                    <div key={post.slug} className="group relative transition-all duration-300 hover:-translate-y-2">
                        <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                            <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4 shadow-sm group-hover:shadow-xl transition-shadow duration-300">
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

                            {post.frontmatter.category && <p className="text-sm text-muted-foreground mb-1">{post.frontmatter.category}</p>}
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
