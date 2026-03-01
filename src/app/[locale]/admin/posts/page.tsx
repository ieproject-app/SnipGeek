
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
import { 
    Plus, 
    Search, 
    FileText, 
    Trash2, 
    ExternalLink, 
    Edit3,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminPostsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Published and Drafts separately as per backend.json structure
  const pubQuery = useMemoFirebase(() => collection(db, 'blogPosts_published'), [db]);
  const draftQuery = useMemoFirebase(() => collection(db, 'blogPosts_drafts'), [db]);

  const { data: published, isLoading: loadingPub } = useCollection(pubQuery);
  const { data: drafts, isLoading: loadingDrafts } = useCollection(draftQuery);

  const allPosts = [
    ...(published?.map(p => ({ ...p, status: 'published' })) || []),
    ...(drafts?.map(d => ({ ...d, status: 'draft' })) || [])
  ].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  const filteredPosts = allPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, status: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
        const collectionName = status === 'published' ? 'blogPosts_published' : 'blogPosts_drafts';
        deleteDocumentNonBlocking(doc(db, collectionName, id));
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="font-headline text-4xl font-black tracking-tighter text-primary uppercase">
                Articles.
            </h1>
            <p className="text-muted-foreground mt-1">Manage your blog content stored in Firestore.</p>
        </div>
        <Button asChild className="rounded-lg shadow-lg shadow-primary/20">
            <Link href="/admin/posts/new">
                <Plus className="mr-2 h-4 w-4" /> Create New Article
            </Link>
        </Button>
      </header>

      <Card className="border-primary/10 bg-card/50">
        <CardHeader className="pb-0">
            <div className="relative max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search articles..." 
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
                            <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                            <TableHead className="font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(loadingPub || loadingDrafts) ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/20" />
                                </TableCell>
                            </TableRow>
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <TableRow key={post.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary">{post.title}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground">/{post.slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={post.status === 'published' ? 'default' : 'secondary'}
                                            className={cn(
                                                "text-[10px] font-black uppercase tracking-tighter px-2",
                                                post.status === 'published' ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""
                                            )}
                                        >
                                            {post.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(post.publishDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                                                <Link href={`/admin/posts/edit/${post.id}`}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(post.id, post.status)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                                    No articles found in Firestore.
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
