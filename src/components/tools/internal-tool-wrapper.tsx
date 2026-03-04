'use client';

import React from 'react';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Chrome, LogOut, User as UserIcon, Lock, Github, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';

interface InternalToolWrapperProps {
  children: React.Node;
  title: string;
  description: string;
  dictionary: Dictionary;
}

export function InternalToolWrapper({ children, title, description, dictionary }: InternalToolWrapperProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();
  
  // Safety check for dictionary
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

  // JIKA AUTH TIDAK ADA (Konfigurasi belum mengalir ke browser)
  if (!auth) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="border-accent/20 bg-accent/5 p-8 rounded-2xl shadow-xl border-t-4 border-t-accent">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-accent/10 rounded-full">
              <Github className="h-12 w-12 text-accent" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter">{t.title}</CardTitle>
              <CardDescription className="text-base text-foreground/70">
                {t.description}
              </CardDescription>
            </div>
            
            <div className="bg-background/80 p-6 rounded-xl border text-left w-full space-y-5 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-primary uppercase tracking-tight">{(t as any).step1 || "LANGKAH 1"}</p>
                    <p className="text-xs text-muted-foreground">{(t as any).step1Desc || "Pastikan variabel sudah di-save."}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="h-4 w-4 text-amber-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-primary uppercase tracking-tight">{(t as any).step2 || "LANGKAH 2"}</p>
                    <p className="text-xs text-muted-foreground">{(t as any).step2Desc || "Klik Start Rollout di dashboard."}</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground italic max-w-sm">
              {(t as any).footer || "Website perlu dirakit ulang agar kunci API bisa terbaca."}
            </p>
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
            <Badge variant="outline" className="hidden sm:inline-flex text-[8px] font-black uppercase border-primary/10 bg-background/50">Authorized</Badge>
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
