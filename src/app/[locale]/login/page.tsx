'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SnipGeekLogo } from '@/components/icons/snipgeek-logo';
import { Loader2, AlertCircle } from 'lucide-react';
import { GoogleLogo } from '@/components/icons/google-logo';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect back to tools or home after successful login
      router.push('/tools/number-generator');
    }
  }, [user, router]);

  const handleGoogleLogin = () => {
    if (!auth) return;
    initiateGoogleSignIn(auth);
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // JIKA AUTH TIDAK ADA (Variabel Environment Belum Aktif di Browser)
  if (!auth) {
    return (
      <div className="flex min-h-[calc(100vh-68px)] w-full items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-2xl border-destructive/20 bg-destructive/5 rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-destructive" />
          <CardHeader className="space-y-4 text-center pt-10 pb-8">
            <div className="flex justify-center mb-2">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="font-display text-3xl font-black tracking-tighter uppercase text-destructive">
              Koneksi Terputus
            </CardTitle>
            <CardDescription className="text-base px-6">
              Sistem tidak dapat mendeteksi Kunci API Firebase. Pastikan proses <strong>Rollout</strong> di dashboard Firebase sudah selesai.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 text-center">
             <p className="text-xs text-muted-foreground italic">
               Halaman login tidak dapat berfungsi tanpa konfigurasi server yang benar.
             </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-68px)] w-full items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="h-1.5 w-full bg-accent" />
        <CardHeader className="space-y-4 text-center pt-10 pb-8">
          <div className="flex justify-center mb-2">
            <SnipGeekLogo className="h-16 w-16" />
          </div>
          <CardTitle className="font-display text-4xl font-black tracking-tighter uppercase">
            Masuk Akun
          </CardTitle>
          <CardDescription className="text-base px-6">
            Gunakan akun Google Anda untuk mengakses tool internal SnipGeek.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-12 px-10">
          <Button 
            variant="default" 
            type="button" 
            className="w-full h-14 font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/10 rounded-full text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleGoogleLogin}
          >
            <GoogleLogo className="h-6 w-6" />
            Lanjut dengan Google
          </Button>
          
          <p className="mt-8 text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-40">
            Akses dibatasi hanya untuk personil terdaftar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
