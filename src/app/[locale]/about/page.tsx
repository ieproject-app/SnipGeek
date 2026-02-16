import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/pages';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx-components';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { getDictionary } from '@/lib/get-dictionary';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { frontmatter } = await getPageContent('about', params.locale);

  return {
    title: frontmatter.title || 'About',
    description: frontmatter.description || 'Learn more about SnipGeek.',
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  const { content, frontmatter } = await getPageContent('about', locale);
  
  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16 text-foreground/80">
        <header className="mb-12">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {frontmatter.title}
            </h1>
        </header>

        <section className="text-lg">
           <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]],
              },
            }}
          />
        </section>
      </main>
    </div>
  );
}
