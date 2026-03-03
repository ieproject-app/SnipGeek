
'use client';

import React from 'react';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Chrome, LogOut, User as UserIcon, Lock, AlertTriangle, RefreshCcw, Github } from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';

interface InternalToolWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function InternalToolWrapper({ children, title, description }: InternalToolWrapperProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();

  const handleGoogleLogin = () => {
    if (!auth) return;
    initiateGoogleSignIn(auth);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      notify("Berhasil keluar akun.", <LogOut className="h-4 w-4" />);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Menghubungkan ke Cloud...</p>
      </div>
    );
  }

  // JIKA AUTH TIDAK ADA (Variabel Environment Belum Aktif)
  if (!auth) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-accent/20 bg-accent/5 p-8 rounded-2xl shadow-xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-accent/10 rounded-full animate-bounce">
              <Github className="h-12 w-12 text-accent" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Konfigurasi Belum Aktif</CardTitle>
              <CardDescription className="text-base text-foreground/70">
                Data API Key di dashboard Firebase belum terserap ke dalam sistem website.
              </CardDescription>
            </div>
            
            <div className="bg-background/80 p-6 rounded-xl border text-left w-full space-y-4 shadow-inner">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Langkah Penyelesaian:</p>
              <ol className="text-sm space-y-3 list-decimal pl-4 font-medium">
                <li>Pastikan kodenya sudah di-push ke <strong>GitHub</strong>.</li>
                <li>Hubungkan GitHub tersebut ke menu <strong>App Hosting</strong> di Firebase.</li>
                <li>Lakukan <strong>Deployment Baru</strong> agar variabel di dashboard Mas Iwan ikut terbaca saat proses Build.</li>
              </ol>
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              Tanpa proses Build via GitHub, browser tidak diizinkan membaca kunci rahasia Mas Iwan demi keamanan.
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
            <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">Akses Terbatas</CardTitle>
            <CardDescription className="text-sm px-6">
              Tool <strong>{title}</strong> memerlukan login akun Google terdaftar untuk menjaga integritas sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <Button 
              onClick={handleGoogleLogin}
              className="h-14 px-10 rounded-full shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95 text-base font-black uppercase tracking-widest"
            >
              <Chrome className="mr-3 h-5 w-5"/>
              Masuk dengan Google
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
                Keluar Akun
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
