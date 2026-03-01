
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  StickyNote, 
  LogOut, 
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { SnipGeekLogo } from '@/components/icons/snipgeek-logo';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = getAuth();

  const menuItems = [
    { name: 'Blog Posts', href: '/admin/posts', icon: FileText },
    { name: 'Quick Notes', href: '/admin/notes', icon: StickyNote },
    { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link href="/admin/posts" className="flex items-center gap-3">
          <SnipGeekLogo className="h-8 w-8" />
          <div className="font-headline text-xl font-black tracking-tighter">
            Control<span className="text-accent">Panel</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-accent" : "")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Button 
            asChild 
            variant="ghost" 
            className="w-full justify-start text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
            <Link href="/" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Website
            </Link>
        </Button>
        <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
