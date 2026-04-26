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
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background">
      {/* ── Brand ────────────────────────────── */}
      <div className="border-b border-border px-4 py-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-border bg-card">
            <SnipGeekLogo className="h-6 w-6" />
          </div>
          <div className="leading-none">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              SnipGeek
            </p>
            <p className="mt-1 font-display text-base font-bold tracking-tight text-foreground">
              Admin <span className="text-accent">Control</span>
            </p>
          </div>
        </Link>
      </div>

      {/* ── Primary nav ──────────────────────── */}
      <nav className="flex-1 p-2">
        <p className="mb-2 mt-1 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Navigation
        </p>
        <div className="space-y-px">
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
                  "relative flex items-center gap-3 px-3 py-2 transition-colors",
                  isActive
                    ? "bg-accent/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" aria-hidden />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-accent" : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0 flex-1 text-sm font-semibold tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Quick actions ────────────────────── */}
        <p className="mb-2 mt-6 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Quick actions
        </p>
        <a
          href={GSC_PROPERTY_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 text-sm font-semibold tracking-tight">
            Open GSC
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60" />
        </a>
      </nav>

      {/* ── Footer actions ────────────────────── */}
      <div className="space-y-px border-t border-border p-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-2 rounded-none px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground"
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
          className="h-8 w-full justify-start gap-2 rounded-none px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
