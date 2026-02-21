import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { PostFrontmatter } from '@/lib/posts';
import type { NoteFrontmatter } from '@/lib/notes';
import type { Dictionary } from '@/lib/get-dictionary';
import type { ReadingListItem } from '@/hooks/use-reading-list';
import Link from 'next/link';
import { i18n } from '@/i18n-config';
import { cn } from '@/lib/utils';

interface PostMetaProps {
  frontmatter: PostFrontmatter | NoteFrontmatter;
  item: ReadingListItem;
  locale: string;
  dictionary: Dictionary;
  readingTime?: number;
  isOverlay?: boolean;
}

export function PostMeta({ frontmatter, item, locale, dictionary, readingTime, isOverlay = false }: PostMetaProps) {
  const authorName = "Iwan Efendi";
  const displayDate = frontmatter.updated || frontmatter.date;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const dateStr = new Date(displayDate).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isOverlay) {
    return (
      <>
        {/* Top Section: Tags & Action Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {frontmatter.tags && frontmatter.tags.slice(0, 3).map(tag => (
              <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 hover:bg-accent hover:text-accent-foreground transition-all">
                  {tag}
                </span>
              </Link>
            ))}
          </div>
          <AddToReadingListButton 
            item={item}
            dictionary={dictionary.readingList}
            showText={false}
            className="h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-primary shadow-xl transition-all"
          />
        </div>

        {/* Bottom Section: Main Metadata */}
        <div className="mt-auto">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
            <span className="font-bold text-white">{authorName}</span>
            <span className="opacity-40">•</span>
            <time>{dateStr}</time>
            {readingTime && (
              <>
                <span className="opacity-40">•</span>
                <span className="bg-accent/20 px-2 py-0.5 rounded text-xs font-bold text-accent">
                  {readingTime} min
                </span>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Standalone Minimalist Style (Default)
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-8 border-b border-primary/5">
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <span className="text-primary font-bold">{authorName}</span>
        <span className="opacity-30">•</span>
        <time>{dateStr}</time>
        {readingTime && (
          <>
            <span className="opacity-30">•</span>
            <span>{readingTime} min</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {frontmatter.tags && frontmatter.tags.slice(0, 2).map(tag => (
          <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
            <span className="text-xs font-bold text-accent/80 hover:text-accent">#{tag}</span>
          </Link>
        ))}
        <div className="w-px h-4 bg-border mx-2" />
        <AddToReadingListButton 
          item={item}
          dictionary={dictionary.readingList}
          showText={false}
          className="h-8 w-8 rounded-full border-none bg-muted/50 text-primary shadow-none"
        />
      </div>
    </div>
  );
}
