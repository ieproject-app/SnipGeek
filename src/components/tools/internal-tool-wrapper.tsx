'use client';

import React from 'react';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Chrome, LogOut, User as UserIcon, Lock, AlertTriangle } from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';

interface InternalToolWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

/**
 * InternalToolWrapper - Centralizes authentication and profile UI for all internal tools.
 * Added defensive checks for null auth services to prevent crashes.
 */
export function InternalToolWrapper({ children, title, description }: InternalToolWrapperProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();

  const handleGoogleLogin = () => {
    if (!auth) {
      notify("Layanan Login belum siap. Periksa konfigurasi Firebase.", <AlertTriangle className="h-4 w-4" />);
      return;
    }
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
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Menghubungkan...</p>
      </div>
    );
  }

  // Handle case where Firebase isn't initialized yet
  if (!auth) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="border-destructive/20 bg-destructive/5 text-center p-8 rounded-2xl">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-lg font-black uppercase mb-2">Sistem Belum Siap</CardTitle>
          <CardDescription>
            Konfigurasi database (Firebase) belum terdeteksi. Silakan isi Environment Variables di dashboard hosting Anda.
          </CardDescription>
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
