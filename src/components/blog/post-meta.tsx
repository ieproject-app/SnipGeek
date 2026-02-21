
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
}

export function PostMeta({ frontmatter, item, locale, dictionary }: PostMetaProps) {
  // Hardcoded author data as per plan
  const authorName = "Iwan Efendi";
  const authorAvatar = "/images/profile/profile.png";
  
  const displayDate = frontmatter.updated || frontmatter.date;
  const dateLabel = frontmatter.updated ? `Updated on` : `Published on`;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  return (
    <div className="my-12 py-10 border-y border-primary/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        {/* Author and Date Info */}
        <div className="flex items-center gap-5">
          <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {authorName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-headline text-lg font-bold text-primary leading-none">{authorName}</p>
            <p className="text-sm text-muted-foreground font-medium">
              {`${dateLabel} ${new Date(displayDate).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <AddToReadingListButton 
            item={item}
            dictionary={dictionary.readingList}
            className="rounded-full px-6"
          />
        </div>
      </div>
      
      {/* Tags */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-dashed border-primary/10">
          <div className="flex flex-wrap items-center gap-3">
            {frontmatter.tags.map(tag => (
              <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
                <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer rounded-full bg-muted/50 border-none shadow-none">
                  # {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
