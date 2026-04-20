"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/toaster";

const emptySubscribe = () => () => {};

/**
 * Wraps any authenticated admin page with the sidebar + access guard.
 * Pages under /admin/** use this to avoid duplicating layout markup.
 *
 * We defer rendering until after client mount (via useSyncExternalStore) to
 * avoid a hydration mismatch: Firebase services are null during SSR, so
 * AdminGuard's initial state differs from the first client render.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
      <Toaster />
    </AdminGuard>
  );
}
