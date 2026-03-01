'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  FileText, 
  StickyNote, 
  TrendingUp, 
  Plus, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useUser();

  const stats = [
    { title: 'Published Posts', value: '0', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { title: 'Draft Notes', value: '0', icon: StickyNote, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Total Views', value: '--', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="font-headline text-4xl font-black tracking-tighter text-primary">
                Welcome back, {user?.displayName || 'Admin'}
            </h1>
            <p className="text-muted-foreground mt-1">
                Here's what's happening with SnipGeek today.
            </p>
        </div>
        <div className="flex gap-3">
            <Button asChild variant="outline">
                <Link href="/admin/notes/new">
                    <Plus className="mr-2 h-4 w-4" /> New Note
                </Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
                <Link href="/admin/posts/new">
                    <Plus className="mr-2 h-4 w-4" /> New Article
                </Link>
            </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
            <Card key={stat.title} className="border-primary/5 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {stat.title}
                    </CardTitle>
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* Recent Activity / Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/10">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" /> Recent Content
                </CardTitle>
                <CardDescription>Your latest modifications will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/5 rounded-b-lg border-t border-dashed">
                <p className="italic text-sm">No recent activity found.</p>
                <Button variant="link" className="mt-2 text-accent" asChild>
                    <Link href="/admin/posts">Go to Article List <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Quick Guide</CardTitle>
                <CardDescription className="text-primary-foreground/60">How to manage your SnipGeek blog.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                    <p className="text-sm leading-relaxed">Add your UID to <code>roles_admin</code> in Firestore to unlock all features.</p>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                    <p className="text-sm leading-relaxed">Go to "New Article" to start writing with the MDX Editor.</p>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                    <p className="text-sm leading-relaxed">Upload images directly to Firebase Storage via the dashboard.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function needed for stats
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
