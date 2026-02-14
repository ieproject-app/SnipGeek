import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';
import { i18n } from '@/i18n-config';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  const allPostsData = getSortedPostsData(locale);
  const featuredPost = allPostsData.find(post => post.frontmatter.featured);
  const otherPosts = allPostsData.filter(post => !post.frontmatter.featured);
  
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
      <header className="text-center mb-12 sm:mb-16">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary">
          {locale === 'id' ? 'Blog Teknologi Modern' : 'SnipBlog'}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          {locale === 'id' ? 'Blog teknologi minimalis modern untuk para geek, didukung oleh MDX lokal.' : 'A modern minimalist tech blog for geeks, powered by local MDX.'}
        </p>
      </header>
      
      <section className="space-y-12">
        {featuredPost && (
          <div className='mb-16'>
            <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-6 text-center">{locale === 'id' ? 'Unggulan' : 'Featured Post'}</h2>
            <Link href={`${linkPrefix}/blog/${featuredPost.slug}`} className="block group" aria-label={`Read more about ${featuredPost.frontmatter.title}`}>
              <article className="p-6 rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 hover:border-accent transform hover:-translate-y-1">
                <h3 className="font-headline text-3xl font-bold tracking-tight text-primary">
                  {featuredPost.frontmatter.title}
                </h3>
                <p className="text-muted-foreground mt-2 mb-4 text-sm">
                  {new Date(featuredPost.frontmatter.date).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="leading-relaxed text-muted-foreground text-lg">
                  {featuredPost.frontmatter.description}
                </p>
              </article>
            </Link>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-6 text-center">{locale === 'id' ? 'Semua Postingan' : 'All Posts'}</h2>
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
        </div>
      </section>
    </div>
  );
}
