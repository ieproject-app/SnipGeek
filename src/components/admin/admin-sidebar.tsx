"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ExternalLink,
  LayoutDashboard,
  ListChecks,
} from "lucide-react";
import { SnipGeekLogo } from "@/components/icons/snipgeek-logo";
import { Button } from "@/components/ui/button";
import { getAuth, signOut } from "firebase/auth";

export function AdminSidebar({
  mobile = false,
  currentPath,
  onNavigateAction,
  onCloseAction,
}: {
  mobile?: boolean;
  currentPath?: string;
  onNavigateAction?: (href: string) => void;
  onCloseAction?: () => void;
}) {
  const pathnameFromHook = usePathname();
  const pathname = currentPath ?? pathnameFromHook;
  const auth = getAuth();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin",
      exact: true,
      icon: LayoutDashboard,
      eyebrow: "Overview",
      description: "Backlog, cadence, dan priority queue",
    },
    {
      name: "Index Monitor",
      href: "/admin/index-monitor",
      icon: ListChecks,
      eyebrow: "Workspace",
      description: "Review status, filter URL, dan aksi GSC",
    },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-background/95 backdrop-blur">
      <div className="border-b border-border/70 px-4 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/50">
            <SnipGeekLogo className="h-7 w-7" />
          </div>
          <div className="leading-none">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              SnipGeek
            </p>
            <p className="mt-1 font-display text-lg font-black tracking-tight text-foreground">
              Admin <span className="text-accent">Control.</span>
            </p>
          </div>
        </Link>
      </div>

      <div className="border-b border-border/70 px-4 py-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          — Editorial ops
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Gunakan dashboard untuk baca kondisi, lalu pindah ke monitor untuk
          eksekusi tindakan.
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-3">
        <p className="px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          — Navigation
        </p>
        {menuItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                if (mobile && onNavigateAction) {
                  event.preventDefault();
                  onNavigateAction(item.href);
                  return;
                }
                onCloseAction?.();
              }}
              className={cn(
                "group flex rounded-2xl border px-3 py-3 transition-all",
                isActive
                  ? "border-accent/30 bg-accent/8 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.22)]"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-card/45 hover:text-foreground",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                    isActive
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border/60 bg-background/50 text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    {item.eyebrow}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-semibold tracking-tight",
                      isActive ? "text-foreground" : "text-foreground/90",
                    )}
                  >
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border/70 p-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-10 w-full justify-start gap-2 rounded-xl px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-card/50 hover:text-foreground"
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
          className="h-10 w-full justify-start gap-2 rounded-xl px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
