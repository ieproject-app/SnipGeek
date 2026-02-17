import { getSortedPostsData, type Post, type PostFrontmatter } from '@/lib/posts';
import { getSortedNotesData, type Note, type NoteFrontmatter } from '@/lib/notes';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getDictionary } from '@/lib/get-dictionary';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Badge } from '@/components/ui/badge';
import { i18n } from '@/i18n-config';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

type RelatedPostsProps = {
  type: 'blog' | 'note';
  locale: string;
  currentSlug: string;
  currentTags?: string[];
  currentCategory?: string;
};

// This function will contain the core logic
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

    // Score based on category (for blogs)
    if (type === 'blog' && currentCategory && itemCategory && currentCategory === itemCategory) {
      score += 5;
    }

    // Score based on tags
    currentTags.forEach(tag => {
      if (itemTags.includes(tag)) {
        score += 1;
      }
    });

    return { ...item, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // Shuffle the top N relevant items
  const topN = scoredContent.slice(0, 10);
  for (let i = topN.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topN[i], topN[j]] = [topN[j], topN[i]];
  }
  
  const relatedCount = 3;
  let related = topN.slice(0, relatedCount);
  
  // Fill with latest content if not enough related items
  if (related.length < relatedCount) {
    const moreNeeded = relatedCount - related.length;
    const latestContent = otherContent
      .filter(item => !related.some(r => r.slug === item.slug)) // Exclude already selected
      .filter(item => !scoredContent.some(s => s.slug === item.slug)) // Exclude already scored
      .slice(0, moreNeeded);
    related.push(...latestContent);
  }

  return related;
};


// The main component
export async function RelatedPosts({ type, locale, currentSlug, currentTags, currentCategory }: RelatedPostsProps) {
  const relatedContent = getRelatedContent(type, locale, currentSlug, currentTags, currentCategory);

  if (relatedContent.length === 0) {
    return null;
  }
  
  const dictionary = await getDictionary(locale);
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  // Renderer for Blog Posts
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
            <AddToReadingListButton 
                item={item}
                showText={false}
                dictionary={dictionary.readingList}
                className="absolute top-3 right-3 z-10 text-white bg-black/30 hover:bg-black/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </div>
    );
  }

  // Renderer for Notes
  const renderNoteCard = (note: Note<NoteFrontmatter>) => {
    const noteDate = new Date(note.frontmatter.date);
    const formatDatePart = (date: Date, options: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat(locale, options).format(date);
    };
    const item = {
        slug: note.slug,
        title: note.frontmatter.title,
        description: note.frontmatter.description,
        href: `${linkPrefix}/notes/${note.slug}`,
        type: 'note' as const
    };

    return (
        <Card key={note.slug} className="group relative bg-card/50 border border-l-4 border-l-primary">
            <CardContent className="flex items-stretch gap-6 p-6">
                <Link href={`${linkPrefix}/notes/${note.slug}`} aria-label={note.frontmatter.title} className="block shrink-0">
                    <div className="flex h-full w-20 flex-col items-center justify-center rounded-lg bg-primary p-2 text-center text-primary-foreground transition-transform group-hover:scale-105">
                        <p className="text-3xl font-bold">{formatDatePart(noteDate, { day: 'numeric' })}</p>
                        <p className="text-sm font-semibold uppercase">{formatDatePart(noteDate, { month: 'short' })}</p>
                        <p className="text-xs">{formatDatePart(noteDate, { year: 'numeric' })}</p>
                    </div>
                </Link>
                
                <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`${linkPrefix}/notes/${note.slug}`} aria-label={note.frontmatter.title} className="flex-1">
                        <h2 className="font-headline text-2xl font-bold tracking-tight text-primary transition-colors">
                            {note.frontmatter.title}
                        </h2>
                        <p className="text-muted-foreground mt-2 line-clamp-3">
                            {note.frontmatter.description}
                        </p>
                    </Link>
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-4 border-t px-6 py-4">
                <div className="flex flex-wrap gap-1">
                    {note.frontmatter.tags && note.frontmatter.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
                <AddToReadingListButton 
                    item={item}
                    showText={false}
                    dictionary={dictionary.readingList}
                    className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
            </CardFooter>
      </Card>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t mt-16">
      <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-8 text-center">
        {dictionary.post.relatedContent}
      </h2>
      {type === 'blog' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedContent.map(item => renderBlogPostCard(item as Post<PostFrontmatter>))}
        </div>
      ) : (
        <div className="space-y-8">
            {relatedContent.map(item => renderNoteCard(item as Note<NoteFrontmatter>))}
        </div>
      )}
    </section>
  );
}
