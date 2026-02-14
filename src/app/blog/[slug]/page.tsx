import { getPostData, getAllPostSlugs } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { mdxComponents } from '@/components/mdx-components';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map(item => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostData(params.slug);
  if (!post) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) {
    notFound();
  }

  const heroImage = PlaceHolderImages.find(p => p.id === post.frontmatter.heroImage);

  return (
    <main className="w-full">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        {heroImage && (
          <div className="mb-8 sm:mb-12">
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              width={1200}
              height={630}
              className="w-full h-auto rounded-xl shadow-lg object-cover"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          </div>
        )}
        <header>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
            {post.frontmatter.title}
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>
        <div className="text-lg text-foreground/80">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>
    </main>
  );
}
