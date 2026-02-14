import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';

export default function Home() {
  const allPostsData = getSortedPostsData();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
      <header className="text-center mb-12 sm:mb-16">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary">
          SnipBlog
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          A modern minimalist tech blog for geeks, powered by local MDX.
        </p>
      </header>
      <section>
        <div className="space-y-8">
          {allPostsData.map(({ slug, frontmatter }) => (
            <Link key={slug} href={`/blog/${slug}`} className="block group" aria-label={`Read more about ${frontmatter.title}`}>
              <article className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-300 hover:border-accent">
                <h2 className="font-headline text-2xl font-bold tracking-tight text-primary">
                  {frontmatter.title}
                </h2>
                <p className="text-muted-foreground mt-1 mb-3 text-sm">
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
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
    </div>
  );
}
