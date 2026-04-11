
'use client';

import { useReadingList, type ReadingListItem } from '@/hooks/use-reading-list';
import { useNotification } from '@/hooks/use-notification';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/get-dictionary';

interface AddToReadingListButtonProps {
  item: ReadingListItem;
  dictionary: Dictionary;
  showText?: boolean;
  className?: string;
}

export function AddToReadingListButton({ item, dictionary, showText = true, className }: AddToReadingListButtonProps) {
  const { addItem, removeItem, isItemSaved } = useReadingList();
  const { notify } = useNotification();
  
  const isSaved = isItemSaved(item.slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaved) {
      removeItem(item.slug);
      // Trigger notification bar in Header using the centralized notification key
      notify(dictionary.notifications.readingListRemoved, <Bookmark className="h-4 w-4 text-accent" />);
    } else {
      addItem(item);
      // Trigger notification bar in Header using the centralized notification key
      notify(dictionary.notifications.readingListAdded, <Bookmark className="h-4 w-4 text-accent" />);
    }
  };

  const buttonText = isSaved 
    ? dictionary.readingList.remove
    : dictionary.readingList.add;

  return (
    <Button
      variant={showText ? "outline" : "ghost"}
      size={showText ? "sm" : "icon"}
      onClick={handleClick}
      aria-label={isSaved ? dictionary.readingList.remove : dictionary.readingList.add}
      className={cn(
        !showText && 'h-8 w-8 rounded-full',
        className,
        "group/btn"
      )}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-all duration-300',
          showText && 'mr-2',
          isSaved && 'fill-current',
          "group-hover/btn:-translate-y-1"
        )}
      />
      {showText && buttonText}
      {!showText && <span className="sr-only">{buttonText}</span>}
    </Button>
  );
}
