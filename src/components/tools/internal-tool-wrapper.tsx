'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
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
  AlertCircle, 
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
}

export function InternalToolWrapper({ children, title, description, dictionary }: InternalToolWrapperProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();
  const [missingVars, setMissingVars] = useState<string[]>([]);
  
  // Diagnostic check
  useEffect(() => {
    const required = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
    ];
    const missing = required.filter(key => {
      const val = process.env[key];
      return !val || val === '';
    });
    setMissingVars(missing);
  }, []);

  const t = dictionary?.tools?.systemNotReady || {
    title: "SISTEM BELUM SIAP",
    description: "Aplikasi belum bisa mendeteksi Kunci API.",
    connecting: "Menghubungkan...",
    restrictedAccess: "Akses Terbatas",
    restrictedDesc: "Tool ini memerlukan login.",
    loginWithGoogle: "Masuk dengan Google"
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

  // JIKA KUNCI API TIDAK TERDETEKSI
  if (!auth || missingVars.length > 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-700">
        <Card className="border-destructive/20 bg-destructive/[0.02] p-8 rounded-2xl shadow-xl border-t-4 border-t-destructive">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-destructive/10 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter text-destructive">{t.title}</CardTitle>
              <CardDescription className="text-base text-foreground/70">
                Next.js tidak menemukan kunci rahasia di dalam website yang sudah dirakit.
              </CardDescription>
            </div>
            
            <div className="bg-background/80 p-6 rounded-xl border text-left w-full space-y-4 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <Terminal className="h-3 w-3" /> Hasil Diagnosa Sistem:
              </p>
              {missingVars.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-primary italic">Variabel berikut terdeteksi KOSONG:</p>
                  <ul className="space-y-1">
                    {missingVars.map(v => (
                      <li key={v} className="text-[10px] font-mono bg-destructive/5 text-destructive px-2 py-1 rounded border border-destructive/10">
                        ❌ {v}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-bold">✅ Semua variabel terdefinisi, namun Firebase gagal inisialisasi.</p>
              )}

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">1</div>
                  <div className="space-y-1">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Cek Dashboard Firebase</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Pastikan nama variabel di tab <b>Settings &rarr; Environment Variables</b> menggunakan awalan <b>NEXT_PUBLIC_</b> dan di-set ke <b>Build & Runtime</b>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">2</div>
                  <div className="space-y-1">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Wajib Start Rollout</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Setiap ada perubahan variabel, Mas Iwan wajib klik tombol <b>Start Rollout</b> agar Google menyeduh ulang websitenya.</p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-10 px-8 rounded-full" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Segarkan Halaman
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <Card className="text-center mt-8 border-primary/10 bg-card/50 shadow-xl rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-accent" />
          <CardHeader className="pt-8 pb-4">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-muted rounded-full">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
            </div>
            <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">{t.restrictedAccess}</CardTitle>
            <CardDescription className="text-sm px-6">
              {t.restrictedDesc.replace('{tool}', title)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <Button 
              onClick={handleGoogleLogin}
              className="h-14 px-10 rounded-full shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95 text-base font-black uppercase tracking-widest"
            >
              <Chrome className="mr-3 h-5 w-5"/>
              {t.loginWithGoogle}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-inner">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-md">
            <AvatarImage src={user.photoURL || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground font-black">
              {user.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black text-primary leading-none mb-1">{user.displayName || 'Editor SnipGeek'}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex text-[8px] font-black uppercase border-primary/10 bg-background/50 text-emerald-500">
              <CheckCircle2 className="mr-1 h-2 w-2" /> Authorized
            </Badge>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-9 px-6 transition-all active:scale-95"
            >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Logout
            </Button>
        </div>
      </div>

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
