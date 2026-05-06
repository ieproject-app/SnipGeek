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
  Users,
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
  {
    name: "Employee History",
    href: "/admin/employee-history",
    icon: Users,
    description: "Search employee · signer generator · data injection",
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
    <aside
      className={cn(
        "sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur",
        mobile ? "w-72 border-r-0" : "",
      )}
    >
      {/* ── Brand ────────────────────────────── */}
      <div className="border-b border-border/40 px-5 py-5">
        <Link
          href="/admin"
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent px-3 py-2 transition-shadow hover:shadow-lg"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-105">
            <SnipGeekLogo className="h-6 w-6 shrink-0" />
          </span>
          <div className="leading-tight">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              SnipGeek
            </p>
            <p className="mt-1 font-display text-base font-semibold tracking-tight text-foreground">
              Admin <span className="text-accent">Control</span>
            </p>
          </div>
        </Link>
      </div>

      {/* ── Primary nav ──────────────────────── */}
      <nav className="flex-1 space-y-4 px-4 py-4">
        <p className="px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Navigation
        </p>
        <div className="space-y-1">
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
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                  isActive
                    ? "bg-accent/15 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-1 left-1 w-1 rounded-full bg-accent" aria-hidden />
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
        <p className="px-2 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Quick actions
        </p>
        <a
          href={GSC_PROPERTY_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-3 py-2 text-muted-foreground transition-colors hover:border-accent/40 hover:bg-card/90 hover:text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent group-hover:bg-accent/20">
            <SearchIcon className="h-4 w-4 shrink-0" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold tracking-tight">
            Open GSC
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground/70" />
        </a>
      </nav>

      {/* ── Footer actions ────────────────────── */}
      <div className="space-y-2 border-t border-border/40 px-4 py-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-start gap-2 rounded-xl border border-border/40 bg-card/80 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-accent/40 hover:bg-card/90 hover:text-foreground"
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
          className="h-9 w-full justify-start gap-2 rounded-xl border border-border/40 bg-destructive/10 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive shadow-sm transition hover:bg-destructive/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
