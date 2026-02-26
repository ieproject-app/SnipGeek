
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Undo2, ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

interface WindowsStylePost {
  slug: string;
  frontmatter: {
    title: string;
    category?: string;
    date: string;
    heroImage: string;
    imageAlt?: string;
  };
}

interface WindowsStyleSectionProps {
  posts: WindowsStylePost[];
  title: string;
  breadcrumbHome: string;
  viewAllText: string;
  locale: string;
  linkPrefix: string;
  tag: string;
}

export function WindowsStyleSection({ 
  posts, 
  title, 
  breadcrumbHome, 
  viewAllText,
  locale, 
  linkPrefix,
  tag
}: WindowsStyleSectionProps) {
  const renderHorizontalCard = (post: WindowsStylePost) => {
    const heroImageValue = post.frontmatter.heroImage;
    let heroImageSrc = "/images/blank/blank.webp";
    if (heroImageValue) {
        if (heroImageValue.startsWith('http') || heroImageValue.startsWith('/')) {
            heroImageSrc = heroImageValue;
        } else {
            const placeholder = PlaceHolderImages.find(p => p.id === heroImageValue);
            if (placeholder) heroImageSrc = placeholder.imageUrl;
        }
    }

    return (
        <Link 
            key={post.slug}
            href={`${linkPrefix}/blog/${post.slug}`} 
            className="flex items-start gap-4 py-3 border-b border-primary/5 transition-all duration-300 group"
        >
            <div className="relative w-[100px] h-[100px] shrink-0 overflow-hidden rounded-lg shadow-sm border border-primary/5">
                <Image
                    src={heroImageSrc}
                    alt={post.frontmatter.imageAlt || post.frontmatter.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="100px"
                />
            </div>
            <div className="flex-1 min-w-0 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1 block">
                    {post.frontmatter.category || tag}
                </span>
                <h3 className="font-headline text-[13px] md:text-sm font-medium text-primary leading-snug line-clamp-2 transition-colors group-hover:text-accent">
                    {post.frontmatter.title}
                </h3>
                <time className="text-[10px] text-muted-foreground mt-2 block font-medium">
                    {new Date(post.frontmatter.date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                </time>
            </div>
        </Link>
    );
  };

  const breadcrumbSegments = [
    { label: breadcrumbHome, href: linkPrefix || '/' },
    { label: tag }
  ];

  return (
    <section className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-10 text-left">
            <h2 className="text-3xl font-extrabold font-headline tracking-tight text-primary mb-2">
                {title}
            </h2>
            <Breadcrumbs segments={breadcrumbSegments} className="mb-4" />
            <div className="w-12 h-1 bg-accent rounded-full" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {posts.map((post) => renderHorizontalCard(post))}
        </div>

        <footer className="mt-12 flex items-center justify-between">
            <Link 
                href="/" 
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
            >
                <Undo2 className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                {breadcrumbHome}
            </Link>
            
            <Link 
                href={`${linkPrefix}/tags/${tag.toLowerCase()}`}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-primary transition-all group"
            >
                <span>{viewAllText}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
        </footer>
    </section>
  );
}
