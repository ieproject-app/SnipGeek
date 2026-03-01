
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { StickyNote } from 'lucide-react';
import { AddToReadingListButton } from '@/components/layout/add-to-reading-list-button';

export function NotesListClient({ initialNotes, dictionary, locale }: { initialNotes: any[], dictionary: any, locale: string }) {
  const db = useFirestore();
  const linkPrefix = locale === 'en' ? '' : `/${locale}`;

  const notesQuery = useMemoFirebase(() => 
    query(
        collection(db, 'notes_published'),
        where('locale', '==', locale)
    ), [db, locale]);
  
  const { data: firestoreNotes } = useCollection(notesQuery);

  const allNotes = useMemo(() => {
    const merged = [...initialNotes];
    if (firestoreNotes) {
        firestoreNotes.forEach(fn => {
            if (!merged.find(n => n.slug === fn.slug)) {
                merged.push({
                    slug: fn.slug,
                    frontmatter: {
                        ...fn,
                        date: fn.publishDate || fn.date,
                        published: true
                    }
                });
            }
        });
    }
    return merged.sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  }, [initialNotes, firestoreNotes]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    }).format(date);
  };

  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <header className="mb-16 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.notes.title}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg italic">
                {dictionary.notes.description}
            </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {allNotes.map((note) => {
            const noteDate = new Date(note.frontmatter.date);
            const item = {
                slug: note.slug,
                title: note.frontmatter.title,
                description: note.frontmatter.description,
                href: `${linkPrefix}/notes/${note.slug}`,
                type: 'note' as const
            };
            return (
              <Card key={note.slug} className="group relative flex flex-col overflow-hidden rounded-lg border bg-card/50 shadow-sm transition-all hover:shadow-lg hover:-translate-y-2 h-full">
                <CardHeader className="p-6 pb-0 flex-row justify-between items-start space-y-0">
                    <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <StickyNote className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <AddToReadingListButton 
                        item={item}
                        showText={false}
                        dictionary={dictionary.readingList}
                        className="text-muted-foreground hover:text-primary z-10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    />
                </CardHeader>

                <CardContent className="p-6 pt-4 flex-1">
                  <Link href={`${linkPrefix}/notes/${note.slug}`} className="block group/link">
                    <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        {formatDate(noteDate)}
                    </time>
                    <h3 className="font-headline text-lg font-bold tracking-tight text-primary transition-colors group-hover/link:text-accent mb-2">
                        {note.frontmatter.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.frontmatter.description}
                    </p>
                  </Link>
                </CardContent>
                
                <CardFooter className="px-6 py-4 border-t bg-muted/5">
                    <div className="flex flex-wrap gap-1">
                        {note.frontmatter.tags && note.frontmatter.tags.slice(0, 2).map((tag: string) => (
                            <Link key={tag} href={`${linkPrefix}/tags/${tag.toLowerCase()}`}>
                                <Badge variant="outline" className="text-[10px] font-medium bg-background/50 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                                    {tag}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </CardFooter>
              </Card>
            )})}
        </section>
      </main>
    </div>
  );
}
