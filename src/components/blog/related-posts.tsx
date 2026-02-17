import { getSortedPostsData, type Post, type PostFrontmatter } from '@/lib/posts';
import { getSortedNotesData, type Note, type NoteFrontmatter } from '@/lib/notes';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getDictionary } from '@/lib/get-dictionary';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { i18n } from '@/i18n-config';

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
                <h3 className="font-headline text-xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
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
    const authorName = "Iwan Efendi"; // Hardcoded as per project structure
    const authorAvatar = "/images/profile/profile.png";
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
        <li key={note.slug} className="relative group border bg-card rounded-lg p-6 shadow-sm transition-shadow hover:shadow-lg hover:border-primary">
            <Link href={`${linkPrefix}/notes/${note.slug}`} className="block">
                <article className="flex gap-4 sm:gap-6">
                    <div className="flex w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary p-2 text-center text-primary-foreground">
                        <p className="text-3xl font-bold">{formatDatePart(noteDate, { day: 'numeric' })}</p>
                        <p className="text-sm font-semibold uppercase">{formatDatePart(noteDate, { month: 'short' })}</p>
                        <p className="text-xs">{formatDatePart(noteDate, { year: 'numeric' })}</p>
                    </div>
                    <div className="flex-1">
                        <h2 className="font-headline text-2xl font-bold tracking-tight text-primary group-hover:text-accent transition-colors">
                        {note.frontmatter.title}
                        </h2>
                        <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={authorAvatar} alt={authorName} />
                                <AvatarFallback>{authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span>{authorName}</span>
                            {note.frontmatter.tags && note.frontmatter.tags.length > 0 && (
                                <>
                                    <span className="hidden sm:inline">•</span>
                                    <div className="flex flex-wrap gap-1">
                                        {note.frontmatter.tags.map(tag => (
                                            <Badge key={tag} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                            {note.frontmatter.description}
                        </p>
                    </div>
                </article>
            </Link>
            <AddToReadingListButton 
                item={item}
                showText={false}
                dictionary={dictionary.readingList}
                className="absolute top-4 right-4 text-muted-foreground hover:text-primary z-10"
            />
        </li>
    );
  }

  return (
    <section className="max-w-5xl mx-auto py-16 sm:py-24 border-t mt-16">
      <h2 className="text-3xl font-bold font-headline tracking-tighter text-primary mb-8 text-center">
        {dictionary.post.relatedContent}
      </h2>
      {type === 'blog' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedContent.map(item => renderBlogPostCard(item as Post<PostFrontmatter>))}
        </div>
      ) : (
        <ul className="space-y-8">
            {relatedContent.map(item => renderNoteCard(item as Note<NoteFrontmatter>))}
        </ul>
      )}
    </section>
  );
}
