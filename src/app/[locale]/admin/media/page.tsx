
'use client';

import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { deleteFile } from '@/firebase/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ImageIcon, 
    Trash2, 
    Copy, 
    Loader2, 
    Check,
    Search,
    Grid2X2,
    List
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminMediaPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mediaQuery = useMemoFirebase(() => 
    query(collection(db, 'media_library'), orderBy('uploadedAt', 'desc')), [db]
  );
  
  const { data: mediaItems, isLoading } = useCollection(mediaQuery);

  const filteredMedia = mediaItems?.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCopy = (e: React.MouseEvent, url: string, name: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const mdx = `![${name}](${url})`;
    navigator.clipboard.writeText(mdx);
    setCopiedId(id);
    toast({ title: "MDX Tersalin!", description: "Silakan paste di editor." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Pastikan ID ada
    if (!item.id) {
        toast({ variant: "destructive", title: "Error", description: "ID gambar tidak valid." });
        return;
    }

    const confirmDelete = window.confirm(`Hapus permanen ${item.name || 'gambar ini'} dari server?`);
    
    if (confirmDelete) {
        setDeletingId(item.id);
        try {
            // 1. Cek apakah path tersedia untuk hapus di Storage
            if (item.path) {
                await deleteFile(item.path);
            } else {
                console.warn("Item path missing, only deleting Firestore record.");
            }

            // 2. Hapus dari Firestore
            deleteDocumentNonBlocking(doc(db, 'media_library', item.id));
            
            toast({ title: "Terhapus!", description: "Gambar berhasil dibersihkan." });
        } catch (error: any) {
            console.error("Delete operation failed:", error);
            toast({ 
                variant: "destructive", 
                title: "Gagal Hapus", 
                description: error.message || "Terjadi kesalahan saat menghapus file." 
            });
        } finally {
            setDeletingId(null);
        }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="font-headline text-4xl font-black tracking-tighter text-primary uppercase">
                Media Library.
            </h1>
            <p className="text-muted-foreground mt-1">Manage all uploaded assets across the blog.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
            <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
            >
                <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Search files..." 
            className="pl-10 bg-card/50 rounded-lg border-primary/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"
        )}>
            {filteredMedia.map((item) => (
                <Card key={item.id} className="group overflow-hidden border-primary/5 bg-card/50 hover:border-accent/30 transition-all relative">
                    {viewMode === 'grid' ? (
                        <>
                            <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                {item.url && (
                                    <Image 
                                        src={item.url} 
                                        alt={item.name || 'Media'} 
                                        fill 
                                        className="object-cover" 
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                )}
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 pointer-events-none group-hover:pointer-events-auto z-10">
                                    <Button 
                                        size="sm" variant="secondary" className="w-full h-8 text-[10px] gap-2"
                                        onClick={(e) => handleCopy(e, item.url, item.name, item.id)}
                                    >
                                        {copiedId === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        MDX CODE
                                    </Button>
                                    <Button 
                                        size="sm" variant="destructive" className="w-full h-8 text-[10px] gap-2"
                                        disabled={deletingId === item.id}
                                        onClick={(e) => handleDelete(e, item)}
                                    >
                                        {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        DELETE
                                    </Button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-[10px] font-bold text-primary truncate" title={item.name}>{item.name || 'Unnamed File'}</p>
                                <p className="text-[8px] text-muted-foreground uppercase mt-1">
                                    {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown Date'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 p-3">
                            <div className="relative h-12 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                {item.url && <Image src={item.url} alt={item.name || 'Media'} fill className="object-cover" sizes="64px" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-primary truncate">{item.name || 'Unnamed File'}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="ghost" size="icon" onClick={(e) => handleCopy(e, item.url, item.name, item.id)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:bg-destructive/10" 
                                    disabled={deletingId === item.id}
                                    onClick={(e) => handleDelete(e, item)}
                                >
                                    {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="font-bold text-muted-foreground/40 uppercase tracking-widest">No media found</p>
        </div>
      )}
    </div>
  );
}
