"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ExternalLink,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  Search as SearchIcon,
} from "lucide-react";
import { SnipGeekLogo } from "@/components/icons/snipgeek-logo";
import { Button } from "@/components/ui/button";
import { getAuth, signOut } from "firebase/auth";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    exact: true,
    icon: LayoutDashboard,
    description: "Backlog, cadence, dan priority queue",
  },
  {
    name: "Index Monitor",
    href: "/admin/index-monitor",
    icon: ListChecks,
    description: "Workspace eksekusi · review status · aksi GSC",
  },
  {
    name: "Prompt Generator",
    href: "/admin/prompt-generator",
    icon: Sparkles,
    description: "Editorial brief builder · create atau revise prompt kerja",
  },
];

const GSC_PROPERTY_URL =
  "https://search.google.com/u/0/search-console?resource_id=sc-domain:snipgeek.com";

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
  const router = useRouter();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-background/95 backdrop-blur">
      {/* ── Brand ───────────────────────────────────── */}
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

      {/* ── Primary nav ─────────────────────────────── */}
      <nav className="flex-1 space-y-1 p-3">
        <p className="mb-2 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          — Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.description}
              onClick={(event) => {
                if (mobile && onNavigateAction) {
                  event.preventDefault();
                  onNavigateAction(item.href);
                  return;
                }
                onCloseAction?.();
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                isActive
                  ? "border-accent/40 bg-accent/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-card/50 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isActive
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border/60 bg-background/60 text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* ── Quick actions ──────────────────────────── */}
        <div className="mt-6">
          <p className="mb-2 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            — Quick actions
          </p>
          <a
            href={GSC_PROPERTY_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition-all hover:border-border/70 hover:bg-card/50 hover:text-foreground"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60">
              <SearchIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold tracking-tight">
              Open GSC
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60" />
          </a>
        </div>
      </nav>

      {/* ── Footer actions ──────────────────────────── */}
      <div className="space-y-1 border-t border-border/70 p-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-start gap-2 rounded-xl px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-card/50 hover:text-foreground"
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
          className="h-9 w-full justify-start gap-2 rounded-xl px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
