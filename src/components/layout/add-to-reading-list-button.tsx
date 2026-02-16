'use client';

import { useReadingList, type ReadingListItem } from '@/hooks/use-reading-list';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

interface AddToReadingListButtonProps {
  item: ReadingListItem;
  showText?: boolean;
  className?: string;
}

export function AddToReadingListButton({ item, showText = true, className }: AddToReadingListButtonProps) {
  const { addItem, removeItem, isItemSaved } = useReadingList();
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as string;

  const isSaved = isItemSaved(item.slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaved) {
      removeItem(item.slug);
      toast({
        title: locale === 'id' ? 'Dihapus dari Daftar Baca' : 'Removed from Reading List',
        description: `"${item.title}" ${locale === 'id' ? 'telah dihapus.' : 'has been removed.'}`,
      });
    } else {
      addItem(item);
      toast({
        title: locale === 'id' ? 'Disimpan ke Daftar Baca' : 'Saved to Reading List',
        description: `"${item.title}" ${locale === 'id' ? 'telah ditambahkan.' : 'has been added.'}`,
      });
    }
  };

  const buttonText = isSaved 
    ? (locale === 'id' ? 'Hapus dari Daftar' : 'Remove from List')
    : (locale === 'id' ? 'Simpan ke Daftar' : 'Save to List');

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
          isSaved && 'fill-primary text-primary'
        )}
      />
      {showText && buttonText}
      {!showText && <span className="sr-only">{buttonText}</span>}
    </Button>
  );
}
