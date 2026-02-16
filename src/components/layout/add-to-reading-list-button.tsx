'use client';

import { useReadingList, type ReadingListItem } from '@/hooks/use-reading-list';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

interface AddToReadingListButtonProps {
  item: ReadingListItem;
}

export function AddToReadingListButton({ item }: AddToReadingListButtonProps) {
  const { addItem, removeItem, isItemSaved } = useReadingList();
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as string;

  const isSaved = isItemSaved(item.slug);

  const handleClick = () => {
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
    <Button variant="outline" size="sm" onClick={handleClick}>
      <Bookmark
        className={cn(
          'mr-2 h-4 w-4 transition-colors',
          isSaved && 'fill-primary text-primary'
        )}
      />
      {buttonText}
    </Button>
  );
}
