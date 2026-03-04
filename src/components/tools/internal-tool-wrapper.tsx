'use client';

import React from 'react';
import { useUser, useAuth, isFirebaseInitialized, firebaseConfigStatus } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, 
  Chrome, 
  LogOut, 
  User as UserIcon, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldX
} from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';
import type { Dictionary } from '@/lib/get-dictionary';

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
          {dictionary?.tools?.systemNotReady?.connecting || "Connecting..."}
        </p>
      </div>
    );
  }

  if (!isFirebaseInitialized && !isPublic) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-700">
        <Card className="border-destructive/20 bg-destructive/[0.02] p-8 rounded-2xl shadow-xl border-t-4 border-t-destructive">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-destructive/10 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-headline text-3xl font-black text-destructive uppercase tracking-tighter">
                {dictionary?.tools?.systemNotReady?.title || "SYSTEM NOT READY"}
              </CardTitle>
              <CardDescription className="text-base text-foreground/70">
                {dictionary?.tools?.systemNotReady?.description || "Firebase configuration missing."}
              </CardDescription>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {[
                    { key: 'apiKey', label: 'NEXT_PUBLIC_FIREBASE_API_KEY' },
                    { key: 'projectId', label: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' },
                    { key: 'appId', label: 'NEXT_PUBLIC_FIREBASE_APP_ID' },
                    { key: 'authDomain', label: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN' },
                ].map((v) => {
                    const configValue = firebaseConfigStatus.config[v.key as keyof typeof firebaseConfigStatus.config];
                    const isOk = !!configValue && configValue !== 'undefined' && configValue !== '';
                    
                    return (
                        <div key={v.key} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground truncate mr-2">{v.label}</span>
                            {isOk ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-background/50 p-6 rounded-xl border border-border w-full space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                  <div className="space-y-1">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-tight text-left">Cek Dashboard Firebase</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed text-left">
                        Pastikan nama variabel di tab <b>Settings - Environment Variables</b> menggunakan awalan <b>NEXT_PUBLIC_</b> dan di-set ke <b>Build & Runtime</b>.
                      </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                  <div className="space-y-1 text-left">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Start Rollout (Wajib)</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Pergi ke tab <b>Rollouts</b> dan klik <b>Start Rollout</b> untuk menyeduh ulang kode dengan variabel terbaru.
                      </p>
                  </div>
                </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!isPublic && !user) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <Card className="text-center mt-8 border-primary/10 bg-card/50 shadow-xl rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-accent" />
          <CardHeader className="pt-10 pb-6">
            <div className="mx-auto p-4 bg-primary/5 rounded-full w-fit mb-4">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">
              {dictionary?.tools?.systemNotReady?.restrictedAccess || "RESTRICTED ACCESS"}
            </CardTitle>
            <CardDescription className="px-6">
              {dictionary?.tools?.systemNotReady?.restrictedDesc?.replace('{tool}', title) || "Please login to access this tool."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 px-10">
            <Button 
              className="w-full h-12 font-black uppercase tracking-widest gap-3 rounded-full shadow-lg shadow-primary/10"
              onClick={handleGoogleLogin}
            >
              <Chrome className="h-5 w-5" /> {dictionary?.tools?.systemNotReady?.loginWithGoogle || "Login with Google"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {!isFirebaseInitialized && isPublic && (
        <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg text-amber-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-xs font-bold text-amber-800">
              API Key missing. Cloud-based features will be disabled.
            </p>
          </div>
        </div>
      )}

      {user && (
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-inner">
            <div className="flex items-center gap-4 text-left w-full">
                <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                      {dictionary?.tools?.systemNotReady?.authorized || "Authorized Personnel"}
                    </p>
                    <p className="font-bold text-sm leading-tight">{user.displayName || user.email}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{user.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[10px] font-black uppercase tracking-widest h-9 px-5">
                    <LogOut className="h-3.5 w-3.5" /> {dictionary?.tools?.systemNotReady?.logout || "Log Out"}
                </Button>
            </div>
        </div>
      )}

      <header className="text-center space-y-3">
        <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl uppercase">
            {title}
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground italic text-lg leading-relaxed">
            {description}
        </p>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
