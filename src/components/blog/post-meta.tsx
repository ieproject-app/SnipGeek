
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { PostFrontmatter } from '@/lib/posts';
import type { NoteFrontmatter } from '@/lib/notes';
import type { Dictionary } from '@/lib/get-dictionary';
import type { ReadingListItem } from '@/hooks/use-reading-list';
import Link from 'next/link';
import { i18n } from '@/i18n-config';

interface PostMetaProps {
  frontmatter: PostFrontmatter | NoteFrontmatter;
  item: ReadingListItem;
  locale: string;
  dictionary: Dictionary;
  readingTime?: number;
}

export function PostMeta({ frontmatter, item, locale, dictionary, readingTime }: PostMetaProps) {
  const authorName = "Iwan Efendi";
  
  const displayDate = frontmatter.updated || frontmatter.date;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const dateStr = new Date(displayDate).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="my-8 pb-8 border-b border-primary/10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Minimalist Author and Date Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <span className="text-primary font-bold">{dictionary.post.by} {authorName}</span>
          <span className="opacity-30">•</span>
          <time>{dateStr}</time>
          {readingTime && (
            <>
              <span className="opacity-30">•</span>
              <span>{dictionary.post.readingTime.replace('{minutes}', readingTime.toString())}</span>
            </>
          )}
        </div>

        {/* Action Buttons - Minimalist */}
        <div className="flex items-center gap-3 shrink-0">
          <AddToReadingListButton 
            item={item}
            dictionary={dictionary.readingList}
            showText={false}
            className="h-9 w-9 rounded-full border-none bg-muted/50 hover:bg-muted text-primary shadow-none"
          />
        </div>
      </div>
      
      {/* Tags - Subtle Style */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {frontmatter.tags.map(tag => (
            <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
              <span className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors">
                # {tag}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
