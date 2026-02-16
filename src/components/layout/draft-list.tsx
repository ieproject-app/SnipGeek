'use client';

import { FileText, DraftingCompass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Post } from '@/lib/posts';
import type { Note } from '@/lib/notes';
import type { Dictionary } from '@/lib/get-dictionary';

type DraftListProps = {
  draftPosts: Post<any>[];
  draftNotes: Note<any>[];
  dictionary: Dictionary;
};

export function DraftList({ draftPosts, draftNotes, dictionary }: DraftListProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const totalDrafts = draftPosts.length + draftNotes.length;

  if (totalDrafts === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" className="rounded-full h-10 w-10 shadow-lg" variant="secondary">
            <DraftingCompass className="h-5 w-5" />
            <span className="sr-only">{dictionary.drafts.title}</span>
            {totalDrafts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {totalDrafts}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[350px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>{dictionary.drafts.title} ({totalDrafts})</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-6 h-full overflow-y-auto pr-4">
            <div>
              <h3 className="font-semibold mb-2">{dictionary.navigation.blog} ({draftPosts.length})</h3>
              {draftPosts.length > 0 ? (
                <ul className="space-y-2">
                  {draftPosts.map(post => (
                    <li key={post.slug} className="text-sm p-3 border rounded-lg bg-muted/50">
                      <p className="font-medium text-primary">{post.frontmatter.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">slug: {post.slug}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">{dictionary.drafts.noDrafts}</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">{dictionary.navigation.notes} ({draftNotes.length})</h3>
              {draftNotes.length > 0 ? (
                <ul className="space-y-2">
                  {draftNotes.map(note => (
                    <li key={note.slug} className="text-sm p-3 border rounded-lg bg-muted/50">
                      <p className="font-medium text-primary">{note.frontmatter.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">slug: {note.slug}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">{dictionary.drafts.noDrafts}</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
