
import { getSortedPostsData, type Post, type PostFrontmatter } from '@/lib/posts';
import { getSortedNotesData, type Note, type NoteFrontmatter } from '@/lib/notes';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getDictionary } from '@/lib/get-dictionary';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Badge } from '@/components/ui/badge';
import { i18n } from '@/i18n-config';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { StickyNote } from 'lucide-react';

type RelatedPostsProps = {
  type: 'blog' | 'note';
  locale: string;
  currentSlug: string;
  currentTags?: string[];
  currentCategory?: string;
};

const getRelatedContent = (
  type: 'blog' | 'note',
  locale: string,
  currentSlug: string,
  currentTags: string[] = [],
  currentCategory?: string
): (Post<PostFrontmatter> | Note<NoteFrontmatter>)[] => {
  const allContent = type === 'blog' ? getSortedPostsData(locale) : getSortedNotesData(locale);
  const otherContent = allContent.filter(item => item.slug !== currentSlug);

  const scoredContent = otherContent.map(item => {
    let score = 0;
    const itemTags = item.frontmatter.tags || [];
    const itemCategory = (item.frontmatter as PostFrontmatter).category;

    if (type === 'blog' && currentCategory && itemCategory && currentCategory === itemCategory) {
      score += 5;
    }

    currentTags.forEach(tag => {
      if (itemTags.includes(tag)) {
        score += 1;
      }
    });

    return { ...item, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  const topN = scoredContent.slice(0, 10);
  for (let i = topN.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topN[i], topN[j]] = [topN[j], topN[i]];
  }
  
  const relatedCount = 3;
  let related = topN.slice(0, relatedCount);
  
  if (related.length < relatedCount) {
    const moreNeeded = relatedCount - related.length;
    const latestContent = otherContent
      .filter(item => !related.some(r => r.slug === item.slug))
      .filter(item => !scoredContent.some(s => s.slug === item.slug))
      .slice(0, moreNeeded);
    related.push(...latestContent);
  }

  return related;
};

export async function RelatedPosts({ type, locale, currentSlug, currentTags, currentCategory }: RelatedPostsProps) {
  const relatedContent = getRelatedContent(type, locale, currentSlug, currentTags, currentCategory);

  if (relatedContent.length === 0) {
    return null;
  }
  
  const dictionary = await getDictionary(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const renderBlogPostCard = (post: Post<PostFrontmatter>) => {
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
        <div key={post.slug} className="group relative transition-all duration-300 hover:-translate-y-2 will-change-transform">
            <Link href={`${linkPrefix}/blog/${post.slug}`} className="block" aria-label={`Read more about ${post.frontmatter.title}`}>
                <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-4 shadow-sm group-hover:shadow-xl transition-shadow duration-300">
                    {heroImageSrc && (
                        <Image
                            src={heroImageSrc}
                            alt={post.frontmatter.imageAlt || post.frontmatter.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
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
                showText={false}
                dictionary={dictionary.readingList}
                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </div>
    );
  }

  const renderNoteCard = (note: Note<NoteFrontmatter>) => {
    const noteDate = new Date(note.frontmatter.date);
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    };
    const item = {
        slug: note.slug,
        title: note.frontmatter.title,
        description: note.frontmatter.description,
        href: `${linkPrefix}/notes/${note.slug}`,
        type: 'note' as const
    };

    return (
      <Card key={note.slug} className="group relative flex flex-col overflow-hidden rounded-lg border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 will-change-transform h-full">
        <CardHeader className="p-6 pb-0 flex-row justify-between items-start space-y-0">
            <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                <StickyNote className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <AddToReadingListButton 
                item={item}
                showText={false}
                dictionary={dictionary.readingList}
                className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
        </CardHeader>

        <CardContent className="p-6 pt-4 flex-1">
          <Link href={`${linkPrefix}/notes/${note.slug}`} aria-label={note.frontmatter.title} className="block group/link">
            <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                {formatDate(noteDate)}
            </time>
            <h3 className="font-headline text-lg font-bold tracking-tight text-primary transition-colors group-hover/link:text-accent mb-2">
                {note.frontmatter.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {note.frontmatter.description}
            </p>
          </Link>
        </CardContent>
        
        <CardFooter className="px-6 py-4 border-t bg-muted/5">
            <div className="flex flex-wrap gap-1">
                {note.frontmatter.tags && note.frontmatter.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] font-medium bg-background/50">
                        {tag}
                    </Badge>
                ))}
                {note.frontmatter.tags && note.frontmatter.tags.length > 2 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{note.frontmatter.tags.length - 2}</span>
                )}
            </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t mt-16">
      <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-12 text-center">
        {dictionary.post.relatedContent}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {type === 'blog' 
            ? (relatedContent as Post<PostFrontmatter>[]).map(item => renderBlogPostCard(item))
            : (relatedContent as Note<NoteFrontmatter>[]).map(item => renderNoteCard(item))
        }
      </div>
    </section>
  );
}
