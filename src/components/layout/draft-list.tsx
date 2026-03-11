'use client';

import { useState } from 'react';
import { DraftingCompass, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Post, PostFrontmatter } from '@/lib/posts';
import type { Note, NoteFrontmatter } from '@/lib/notes';
import type { Dictionary } from '@/lib/get-dictionary';
import { useNotification } from '@/hooks/use-notification';

type DraftListProps = {
  draftPosts: Post<PostFrontmatter>[];
  draftNotes: Note<NoteFrontmatter>[];
  dictionary: Dictionary;
};

export function DraftList({ draftPosts, draftNotes, dictionary }: DraftListProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const { notify } = useNotification();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleCopy = (slug: string, type: 'post' | 'note') => {
    const textToCopy = `${slug}.mdx`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSlug(`${type}-${slug}`);
    notify('File Copied');
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  };

  const totalDrafts = draftPosts.length + draftNotes.length;

  if (totalDrafts === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-34 right-6 z-50">
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
        <SheetContent side="right" className="w-[350px] sm:w-[400px] flex flex-col">
          <SheetHeader>
            <SheetTitle>{dictionary.drafts.title}</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="blog" className="py-4 flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blog">{dictionary.navigation.blog} ({draftPosts.length})</TabsTrigger>
              <TabsTrigger value="notes">{dictionary.navigation.notes} ({draftNotes.length})</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              <TabsContent value="blog" className="mt-0">
                {draftPosts.length > 0 ? (
                  <ul className="space-y-2">
                    {draftPosts.map(post => (
                      <li key={post.slug} className="text-sm p-3 border rounded-lg bg-muted/50">
                        <p className="font-medium text-primary break-words">{post.frontmatter.title}</p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs text-muted-foreground font-mono break-all">{post.slug}.mdx</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleCopy(post.slug, 'post')}
                            aria-label="Copy filename"
                          >
                            {copiedSlug === `post-${post.slug}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                    <p className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed text-center">{dictionary.drafts.noDrafts}</p>
                )}
              </TabsContent>
              <TabsContent value="notes" className="mt-0">
                {draftNotes.length > 0 ? (
                  <ul className="space-y-2">
                    {draftNotes.map(note => (
                      <li key={note.slug} className="text-sm p-3 border rounded-lg bg-muted/50">
                        <p className="font-medium text-primary break-words">{note.frontmatter.title}</p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs text-muted-foreground font-mono break-all">{note.slug}.mdx</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleCopy(note.slug, 'note')}
                             aria-label="Copy filename"
                          >
                            {copiedSlug === `note-${note.slug}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                    <p className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed text-center">{dictionary.drafts.noDrafts}</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
