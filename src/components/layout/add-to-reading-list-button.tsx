'use client';

import { useReadingList, type ReadingListItem } from '@/hooks/use-reading-list';
import { useNotification } from '@/hooks/use-notification';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/get-dictionary';

interface AddToReadingListButtonProps {
  item: ReadingListItem;
  dictionary: Dictionary['readingList'];
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
      notify(dictionary.remove);
    } else {
      addItem(item);
      notify(dictionary.add);
    }
  };

  const buttonText = isSaved 
    ? dictionary.remove
    : dictionary.add;

  return (
    <Button
      variant={showText ? "outline" : "ghost"}
      size={showText ? "sm" : "icon"}
      onClick={handleClick}
      className={cn(
        !showText && 'h-8 w-8 rounded-full',
        className
      )}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-colors',
          showText && 'mr-2',
          isSaved && 'fill-current'
        )}
      />
      {showText && buttonText}
      {!showText && <span className="sr-only">{buttonText}</span>}
    </Button>
  );
}
