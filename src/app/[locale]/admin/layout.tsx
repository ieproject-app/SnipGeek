'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { FirebaseClientProvider } from '@/firebase';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't apply AdminGuard or Admin Sidebar to the login page itself
  const isLoginPage = pathname.includes('/admin/login');

  if (isLoginPage) {
    return (
        <FirebaseClientProvider>
            {children}
        </FirebaseClientProvider>
    );
  }

  return (
    <FirebaseClientProvider>
      <AdminGuard>
        <div className="flex min-h-screen bg-background text-foreground">
          <AdminSidebar />
          <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
                {children}
            </div>
          </main>
        </div>
      </AdminGuard>
    </FirebaseClientProvider>
  );
}
