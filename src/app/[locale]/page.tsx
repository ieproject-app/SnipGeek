import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  const allPostsData = getSortedPostsData(locale);
  const featuredPosts = allPostsData.filter(post => post.frontmatter.featured).slice(0, 4);
  const otherPosts = allPostsData.filter(post => !post.frontmatter.featured);
  
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  return (
    <div className="w-full">
      <header className="text-center pt-24 pb-12 sm:pt-32 sm:pb-16 px-4">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary">
          {locale === 'id' ? 'Blog Teknologi Modern' : 'SnipGeek'}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          {locale === 'id' ? 'Blog teknologi minimalis modern untuk para geek, didukung oleh MDX lokal.' : 'A modern minimalist tech blog for geeks, powered by local MDX.'}
        </p>
      </header>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="mb-20 sm:mb-28">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-10 text-center">{locale === 'id' ? 'Unggulan' : 'Featured Posts'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPosts.map((post, index) => {
                const heroImage = PlaceHolderImages.find(p => p.id === post.frontmatter.heroImage);
                return (
                  <div
                    key={post.slug}
                    className={cn(
                      "transform transition-all duration-300 ease-in-out hover:scale-105 hover:z-10",
                      (index === 0 || index === 2) ? "lg:-translate-y-4" : ""
                    )}
                  >
                    <Link href={`${linkPrefix}/blog/${post.slug}`} className="block group" aria-label={`Read more about ${post.frontmatter.title}`}>
                      <article className="relative w-full h-96 rounded-xl overflow-hidden shadow-2xl">
                        {heroImage && (
                          <Image
                            src={heroImage.imageUrl}
                            alt={post.frontmatter.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            data-ai-hint={heroImage.imageHint}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                          <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{post.frontmatter.category}</p>
                          <h3 className="font-headline text-2xl font-bold">
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
      )}

      {/* Other Posts Section */}
      {otherPosts.length > 0 && (
        <section className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-8 text-center">{locale === 'id' ? 'Semua Postingan' : 'All Posts'}</h2>
          <div className="space-y-8">
            {otherPosts.map(({ slug, frontmatter }) => (
              <Link key={slug} href={`${linkPrefix}/blog/${slug}`} className="block group" aria-label={`Read more about ${frontmatter.title}`}>
                <article className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-300 hover:border-accent">
                  <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">
                    {frontmatter.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 mb-3 text-sm">
                    {new Date(frontmatter.date).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    {frontmatter.description}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
