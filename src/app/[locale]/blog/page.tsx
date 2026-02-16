import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { getDictionary } from '@/lib/get-dictionary';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function BlogPage({ params: { locale } }: { params: { locale: string } }) {
  const allPostsData = getSortedPostsData(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.navigation.blog}
            </h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {allPostsData.map((post) => {
                const heroImage = PlaceHolderImages.find(p => p.id === post.frontmatter.heroImage);
                const item = {
                    slug: post.slug,
                    title: post.frontmatter.title,
                    description: post.frontmatter.description,
                    href: `${linkPrefix}/blog/${post.slug}`,
                    type: 'blog' as const,
                };
                return (
                    <div key={post.slug} className="group relative">
                        <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                            <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4">
                                {heroImage && (
                                    <Image
                                        src={heroImage.imageUrl}
                                        alt={post.frontmatter.imageAlt || post.frontmatter.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        data-ai-hint={heroImage.imageHint}
                                    />
                                )}
                            </div>

                            {post.frontmatter.category && <p className="text-sm text-muted-foreground mb-1">{post.frontmatter.category}</p>}
                            <h3 className="font-headline text-xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
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
