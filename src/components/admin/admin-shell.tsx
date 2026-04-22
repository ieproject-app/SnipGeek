"use client";

import { ReactNode, useSyncExternalStore, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Menu, X } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/**
 * Wraps any authenticated admin page with the sidebar + access guard.
 * - Desktop: fixed sidebar on the left
 * - Mobile: slide-in drawer with hamburger toggle
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleCloseDrawer = () => setDrawerOpen(false);

  const handleNavigate = (href: string) => {
    handleCloseDrawer();
    router.push(href);
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <AdminGuard>
      {/* ── Mobile top bar ─────────────────────────────── */}
      <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border/70 bg-background/95 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-3 leading-none">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
            SnipGeek
          </p>
          <span className="mt-1 block font-display text-sm font-black tracking-tight">
            Control <span className="text-accent">workspace.</span>
          </span>
        </div>
      </div>

      {/* ── Mobile drawer backdrop ──────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close button inside drawer */}
        <div className="absolute right-0 top-0 translate-y-0 translate-x-full p-2">
          <button
            onClick={handleCloseDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/85 text-muted-foreground shadow-md backdrop-blur transition-colors hover:border-border hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <AdminSidebar
          mobile
          currentPath={pathname}
          onNavigateAction={handleNavigate}
          onCloseAction={handleCloseDrawer}
        />
      </div>

      {/* ── Desktop layout ───────────────────────────────── */}
      <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar: hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <main className="min-w-0 overflow-x-hidden bg-background">
          {children}
        </main>
      </div>

      <Toaster />
    </AdminGuard>
  );
}
