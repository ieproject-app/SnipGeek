
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { populateDatabaseAction } from '@/app/actions/populate-numbers';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'iwan.efndi@gmail.com';

export function MaintenanceClient({ dictionary }: { dictionary: any }) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState<number>(0);

  if (isUserLoading) {
    return (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Verifying Admin Access...</p>
        </div>
    );
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="p-6 bg-destructive/10 rounded-full ring-8 ring-destructive/5">
            <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter text-primary">
                {dictionary.unauthorized}
            </h2>
            <p className="text-muted-foreground mt-2 italic">Akses ini hanya diperuntukkan bagi Mas Iwan Efendi.</p>
        </div>
      </div>
    );
  }

  const handlePopulate = async () => {
    if (window.confirm("PERINGATAN: Anda akan menyuntikkan ribuan nomor baru ke database Firestore. Lanjutkan?")) {
        setIsProcessing(true);
        try {
            // Gunakan user.email dengan fallback null untuk keamanan
            const result = await populateDatabaseAction(user.email || null);
            setStats(result);
            setIsFinished(true);
            toast({ title: "Injeksi Berhasil!", description: `${result} nomor baru telah ditambahkan.` });
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Terjadi Kesalahan", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-700">
      <Card className="border-primary/10 bg-card/50 shadow-xl overflow-hidden">
        <div className="h-1.5 w-full bg-accent" />
        <CardHeader className="bg-muted/20 border-b p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
                <Database className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl font-black uppercase tracking-tight">
                Database Sync
            </CardTitle>
          </div>
          <CardDescription className="text-base leading-relaxed">
            Gunakan alat ini untuk mengisi stok nomor dokumen terbaru periode 2025-2026.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isFinished ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-500">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-xl text-primary">{dictionary.success}</h3>
                    <p className="text-muted-foreground font-mono text-sm mt-1">Total: {stats} nomor berhasil disinkronkan.</p>
                </div>
                <Button variant="outline" className="mt-4 rounded-full px-8" onClick={() => setIsFinished(false)}>
                    Ulangi Proses?
                </Button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-600">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-medium space-y-1">
                        <p>Proses ini akan mengirim ribuan data dalam beberapa kelompok (batch).</p>
                        <p className="text-[10px] uppercase font-bold opacity-70">Jangan tutup halaman ini sampai selesai.</p>
                    </div>
                </div>
                
                <Button 
                    onClick={handlePopulate} 
                    disabled={isProcessing}
                    className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Memproses Injeksi...
                        </>
                    ) : (
                        <>
                            <Database className="mr-3 h-6 w-6" />
                            Suntik Nomor Sekarang
                        </>
                    )}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">
        System Maintenance Area &bull; Restricted to Admin
      </p>
    </div>
  );
}
