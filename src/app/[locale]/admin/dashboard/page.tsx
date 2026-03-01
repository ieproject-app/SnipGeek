
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  FileText, 
  StickyNote, 
  TrendingUp, 
  Plus, 
  ArrowUpRight,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();

  // Fetch Stats from Firestore
  const publishedQuery = useMemoFirebase(() => collection(db, 'blogPosts_published'), [db]);
  const draftsQuery = useMemoFirebase(() => collection(db, 'blogPosts_drafts'), [db]);
  const notesQuery = useMemoFirebase(() => collection(db, 'notes_published'), [db]); // Assuming notes follow similar pattern

  const { data: published, isLoading: loadingPub } = useCollection(publishedQuery);
  const { data: drafts, isLoading: loadingDrafts } = useCollection(draftsQuery);

  const stats = [
    { 
        title: 'Published Posts', 
        value: loadingPub ? '...' : (published?.length || 0).toString(), 
        icon: FileText, 
        color: 'text-sky-500', 
        bg: 'bg-sky-500/10' 
    },
    { 
        title: 'Draft Articles', 
        value: loadingDrafts ? '...' : (drafts?.length || 0).toString(), 
        icon: StickyNote, 
        color: 'text-amber-500', 
        bg: 'bg-amber-500/10' 
    },
    { 
        title: 'Engagement', 
        value: 'Live', 
        icon: TrendingUp, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-500/10' 
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="font-headline text-4xl font-black tracking-tighter text-primary uppercase">
                Console.
            </h1>
            <p className="text-muted-foreground mt-1">
                Hello, {user?.displayName || 'Admin'}. Everything is synchronized.
            </p>
        </div>
        <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-lg">
                <Link href="/admin/notes/new">
                    <Plus className="mr-2 h-4 w-4" /> New Note
                </Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20 rounded-lg">
                <Link href="/admin/posts/new">
                    <Plus className="mr-2 h-4 w-4" /> New Article
                </Link>
            </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
            <Card key={stat.title} className="border-primary/5 bg-card/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {stat.title}
                    </CardTitle>
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black tracking-tighter">
                        {stat.value === '...' ? <Loader2 className="h-6 w-6 animate-spin opacity-20" /> : stat.value}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* Recent Activity / Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/10">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" /> System Status
                </CardTitle>
                <CardDescription>Real-time database connection established.</CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/5 rounded-b-lg border-t border-dashed">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-medium">Firestore Online</p>
                </div>
                <Button variant="link" className="mt-4 text-accent" asChild>
                    <Link href="/admin/posts">Manage All Content <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Quick Workflow</CardTitle>
                <CardDescription className="text-primary-foreground/60">Phase 2: Content Management Active.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                    <p className="text-sm leading-relaxed">View and delete content in "Blog Posts" or "Quick Notes".</p>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                    <p className="text-sm leading-relaxed">Proceed to Phase 3 to build the Content Editor.</p>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                    <p className="text-sm leading-relaxed">Hybrid logic will automatically merge these with local files soon.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
