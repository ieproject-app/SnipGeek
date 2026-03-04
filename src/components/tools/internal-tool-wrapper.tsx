
'use client';

import React from 'react';
import { useUser, useAuth, isFirebaseInitialized, firebaseConfigStatus } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Chrome, 
  LogOut, 
  User as UserIcon, 
  Lock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Terminal,
  ShieldX
} from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';
import { Separator } from '@/components/ui/separator';

interface InternalToolWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
  dictionary: Dictionary;
  isPublic?: boolean;
}

export function InternalToolWrapper({ children, title, description, dictionary, isPublic = false }: InternalToolWrapperProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();

  const t = dictionary?.tools?.systemNotReady || {
    title: "SISTEM BELUM SIAP",
    description: "Next.js tidak menemukan kunci rahasia di dalam website yang sudah dirakit.",
    connecting: "Menghubungkan...",
    restrictedAccess: "Akses Terbatas",
    restrictedDesc: "Tool ini memerlukan login untuk dapat digunakan.",
    loginWithGoogle: "Masuk dengan Google",
  };

  const handleGoogleLogin = () => {
    if (!auth) return;
    initiateGoogleSignIn(auth);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      notify(dictionary?.notifications?.logoutSuccess || "Successfully logged out.", <LogOut className="h-4 w-4" />);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          {t.connecting}
        </p>
      </div>
    );
  }

  // BLOCKER: Jika sistem Firebase TIDAK siap SAMA SEKALI, dan tool ini TIDAK publik.
  if (!isFirebaseInitialized && !isPublic) {
    const missingVars = Object.entries(firebaseConfigStatus.config)
      .filter(([_, value]) => !value)
      .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace('Id', '_ID').toUpperCase()}`);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-700">
        <Card className="border-destructive/20 bg-destructive/[0.02] p-8 rounded-2xl shadow-xl border-t-4 border-t-destructive">
          {/* ... konten error seperti sebelumnya ... */}
        </Card>
      </div>
    );
  }

  // LOGIN WALL: Jika tool TIDAK publik dan user BELUM login.
  if (!isPublic && !user) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <Card className="text-center mt-8 border-primary/10 bg-card/50 shadow-xl rounded-2xl overflow-hidden">
          {/* ... konten login seperti sebelumnya ... */}
        </Card>
      </div>
    );
  }
  
  // RENDER KONTEN UTAMA
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Peringatan kecil jika sistem belum siap tapi toolnya publik */}
      {!isFirebaseInitialized && isPublic && (
        <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg text-amber-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-xs font-bold">Fitur yang memerlukan login (seperti menyimpan atau memuat data) tidak akan berfungsi karena sistem belum terkonfigurasi dengan benar.</p>
          </div>
        </div>
      )}

      {user && (
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-inner">
          {/* ... header user seperti sebelumnya ... */}
        </div>
      )}

      <header className="text-center space-y-3">
        <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl">
            {title}
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground italic text-lg">
            {description}
        </p>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
