import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';
import type { PostFrontmatter } from '@/lib/posts';
import type { NoteFrontmatter } from '@/lib/notes';
import type { Dictionary } from '@/lib/get-dictionary';
import type { ReadingListItem } from '@/hooks/use-reading-list';

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

  return (
    <div className="my-8 rounded-2xl border bg-card text-card-foreground p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        {/* Author and Date Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback>{authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-primary">{authorName}</p>
            <p className="text-sm text-muted-foreground">
              {`${dateLabel} ${new Date(displayDate).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <AddToReadingListButton 
            item={item}
            dictionary={dictionary.readingList}
          />
        </div>
      </div>
      
      {/* Tags */}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {frontmatter.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
