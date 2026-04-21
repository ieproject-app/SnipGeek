
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LogOut, 
  ExternalLink,
  LayoutDashboard,
  ListChecks,
} from 'lucide-react';
import { SnipGeekLogo } from '@/components/icons/snipgeek-logo';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = getAuth();

  const menuItems = [
    { name: 'Dashboard', href: '/admin', exact: true, icon: LayoutDashboard },
    { name: 'Index Monitor', href: '/admin/index-monitor', icon: ListChecks },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border/70 bg-background/95 backdrop-blur">
      {/* Masthead */}
      <div className="border-b border-border/70 px-4 py-4">
        <Link href="/admin" className="flex items-center gap-3">
          <SnipGeekLogo className="h-8 w-8" />
          <div className="leading-none">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              SnipGeek
            </p>
            <p className="mt-1 font-display text-lg font-black uppercase tracking-tighter">
              Control<span className="text-accent">.</span>
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="mb-2 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          — Navigation
        </p>
        {menuItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all",
                isActive
                  ? "bg-accent/10 text-foreground shadow-[inset_0_0_0_1px_rgba(125,211,252,0.28)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border/70 p-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <Link href="/" target="_blank">
            <ExternalLink className="h-3.5 w-3.5" />
            View Site
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
