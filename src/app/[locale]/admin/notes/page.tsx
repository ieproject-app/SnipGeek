
'use client';

import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, Trash2, Edit3, Loader2, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminNotesPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Notes (Assuming similar structure to articles for now)
  const notesQuery = useMemoFirebase(() => collection(db, 'notes_published'), [db]);
  const { data: notes, isLoading } = useCollection(notesQuery);

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
        deleteDocumentNonBlocking(doc(db, 'notes_published', id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="font-headline text-4xl font-black tracking-tighter text-primary uppercase">
                Notes.
            </h1>
            <p className="text-muted-foreground mt-1">Manage technical snippets and quick references.</p>
        </div>
        <Button asChild className="rounded-lg shadow-lg shadow-primary/20">
            <Link href="/admin/notes/new">
                <Plus className="mr-2 h-4 w-4" /> New Quick Note
            </Link>
        </Button>
      </header>

      <Card className="border-primary/10 bg-card/50">
        <CardHeader className="pb-0">
            <div className="relative max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search notes..." 
                    className="pl-10 bg-background/50 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border border-primary/5 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Title</TableHead>
                            <TableHead className="font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/20" />
                                </TableCell>
                            </TableRow>
                        ) : filteredNotes.length > 0 ? (
                            filteredNotes.map((note) => (
                                <TableRow key={note.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-amber-500/10 rounded">
                                                <StickyNote className="h-3 w-3 text-amber-600" />
                                            </div>
                                            <span className="font-bold text-primary">{note.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(note.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                                                <Link href={`/admin/notes/edit/${note.id}`}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(note.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground italic">
                                    No notes found in Firestore.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
