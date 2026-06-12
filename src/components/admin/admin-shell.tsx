"use client";

import { ReactNode, useSyncExternalStore, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Menu, X } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/** Map pathname → human-readable page title for the mobile top bar. */
function resolvePageTitle(pathname: string): { eyebrow: string; title: string } {
  if (pathname.startsWith("/admin/prompt-generator")) {
    return { eyebrow: "Editorial", title: "Prompt Generator" };
  }
  if (pathname.startsWith("/admin/signatories-index")) {
    return { eyebrow: "Utility", title: "Signatories Index" };
  }
  if (pathname.startsWith("/admin/compress-pdf")) {
    return { eyebrow: "Utility", title: "Compress PDF" };
  }
  if (pathname.startsWith("/admin/address-label-generator")) {
    return { eyebrow: "Utility", title: "Address Label" };
  }
  if (pathname.startsWith("/admin/login")) {
    return { eyebrow: "Auth", title: "Sign in" };
  }
  return { eyebrow: "Overview", title: "Admin Overview" };
}

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
      <div className="relative min-h-screen overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]"
        />

        <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/40">
          {/* ── Mobile top bar ─────────────────────────────────── */}
          <div className="sticky top-0 z-40 flex h-12 items-center border-b border-border/60 bg-background/90 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur md:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:bg-muted/80 hover:text-foreground"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="ml-3 min-w-0 leading-none">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
                {resolvePageTitle(pathname).eyebrow}
              </p>
              <span className="mt-1 block truncate font-display text-sm font-bold tracking-tight">
                {resolvePageTitle(pathname).title}
              </span>
            </div>
          </div>

          {/* ── Mobile drawer backdrop ──────────────────── */}
          {drawerOpen && (
            <div
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
          )}

          {/* ── Mobile drawer ───────────────────────────────── */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 bg-background/95 shadow-xl transition-transform duration-300 ease-in-out supports-[backdrop-filter]:backdrop-blur md:hidden",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {/* Close button inside drawer */}
            <div className="absolute right-0 top-0 translate-y-0 translate-x-full p-2">
              <button
                onClick={handleCloseDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-muted/80 hover:text-foreground"
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
          <div className="relative flex-1 md:grid md:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar: hidden on mobile, visible on md+ */}
            <div className="hidden md:block">
              <AdminSidebar />
            </div>
            <main className="min-w-0 overflow-x-hidden pb-12">
              {children}
            </main>
          </div>

          <Toaster />
        </div>
      </div>
    </AdminGuard>
  );
}
