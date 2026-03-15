
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { PostFrontmatter } from '@/lib/posts';
import type { NoteFrontmatter } from '@/lib/notes';
import type { Dictionary } from '@/lib/get-dictionary';
import type { ReadingListItem } from '@/hooks/use-reading-list';
import Link from 'next/link';
import { CalendarDays, Clock3 } from 'lucide-react';
import { i18n } from '@/i18n-config';
import { cn, formatRelativeTime } from '@/lib/utils';

interface ArticleMetaProps {
  frontmatter: PostFrontmatter | NoteFrontmatter;
  item: ReadingListItem;
  locale: string;
  dictionary: Dictionary;
  readingTime?: number;
  isOverlay?: boolean;
  isCentered?: boolean;
}

export function ArticleMeta({ frontmatter, item, locale, dictionary, readingTime, isOverlay = false, isCentered = false }: ArticleMetaProps) {
  const authorName = "Iwan Efendi";
  const displayDate = frontmatter.updated || frontmatter.date;
  const isUpdated = !!frontmatter.updated;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const relativeTimeStr = formatRelativeTime(new Date(displayDate), locale);
  const timeLabel = isUpdated ? (locale === 'id' ? 'Diperbarui ' : 'Updated ') : '';

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
            dictionary={dictionary}
            showText={false}
            className="h-10 w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-slate-950 shadow-xl transition-all"
          />
        </div>

        {/* Bottom Section: Main Metadata */}
        <div className="mt-auto">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
            <span className="font-bold text-white">{authorName}</span>
            <span className="opacity-40">•</span>
            <time className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 opacity-80" />
              <span>{timeLabel}{relativeTimeStr}</span>
            </time>
            {readingTime && (
              <>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-1.5 bg-accent/20 px-2 py-0.5 rounded text-xs font-bold text-accent">
                  <Clock3 className="h-3 w-3" />
                  <span>{readingTime} min</span>
                </span>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Standalone Style (Normal page header)
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-6 py-4 mb-8 border-b border-primary/5",
      isCentered ? "justify-center" : "justify-start"
    )}>
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <span className="text-primary font-bold">{authorName}</span>
        <span className="opacity-30">•</span>
        <time className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 opacity-70" />
          <span>{timeLabel}{relativeTimeStr}</span>
        </time>
        {readingTime && (
          <>
            <span className="opacity-30">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 opacity-70" />
              <span>{readingTime} min</span>
            </span>
          </>
        )}
      </div>

      {!isCentered && (
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <AddToReadingListButton
            item={item}
            dictionary={dictionary}
            showText={false}
            className="h-8 w-8 rounded-full border-none bg-muted/50 text-primary shadow-none hover:text-primary"
          />
        </div>
      )}
    </div>
  );
}
