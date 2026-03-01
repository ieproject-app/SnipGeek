
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Terminal as TerminalIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';

const ADMIN_EMAIL = 'iwan.efndi@gmail.com';

// Daftar tugas terbaru sesuai data yang dikirim Mas Iwan di chat
const populateTasks = [
  { category: 'HK.800', year: 2025, month: 1, start: 8338, end: 8437, regionCode: 'TA-851030' },
];

export function MaintenanceClient({ dictionary }: { dictionary: any }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading) {
    return (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Memuat Data...</p>
        </div>
    );
  }

  const isAuthorized = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!user || !isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="p-6 bg-destructive/10 rounded-full">
            <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter text-primary">
                Akses Ditolak
            </h2>
            <p className="text-muted-foreground mt-2 italic">Halaman ini hanya untuk Mas Iwan Efendi ({ADMIN_EMAIL}).</p>
        </div>
      </div>
    );
  }

  const handlePopulate = async () => {
    const totalToInfect = populateTasks.reduce((sum, t) => sum + (t.end - t.start + 1), 0);
    const isConfirmed = window.confirm(`KONFIRMASI: Mas Iwan akan menyuntikkan ${totalToInfect} nomor baru ke database. Lanjutkan?`);
    
    if (!isConfirmed) return;

    setIsProcessing(true);
    let totalCreated = 0;

    try {
        console.log("Memulai proses injeksi nomor...");
        
        for (const task of populateTasks) {
            const { category, year, month, start, end, regionCode } = task;
            console.log(`Memproses batch: ${category} periode ${month}-${year} (${regionCode})`);
            
            let batch = writeBatch(db);
            let batchCount = 0;

            for (let i = start; i <= end; i++) {
                const sequence = String(i).padStart(5, '0');
                const dateString = `${String(month).padStart(2, '0')}-${year}`;
                
                // Format: {DOCTYPE} 08338/HK.800/TA-851030/01-2025
                const fullNumber = `{DOCTYPE} ${sequence}/${category}/${regionCode}/${dateString}`;
                
                // ID unik agar tidak ada data ganda
                const docId = `${category}-${year}-${month}-below_500m-${sequence}`;
                const docRef = doc(db, 'availableNumbers', docId);

                batch.set(docRef, {
                    fullNumber,
                    category,
                    year,
                    month,
                    valueCategory: 'below_500m',
                    isUsed: false,
                    assignedTo: "",
                    assignedDate: ""
                });

                batchCount++;
                totalCreated++;

                if (batchCount === 450) {
                    console.log(`Mengirim batch (450 data)...`);
                    await batch.commit();
                    batch = writeBatch(db);
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                console.log(`Mengirim batch terakhir (${batchCount} data)...`);
                await batch.commit();
            }
        }

        setStats(totalCreated);
        setIsFinished(true);
        toast({ title: "Injeksi Berhasil!", description: `${totalCreated} nomor telah masuk ke stok.` });
    } catch (error: any) {
        console.error("Gagal saat injeksi data:", error);
        toast({ variant: "destructive", title: "Gagal Injeksi", description: error.message });
    } finally {
        setIsProcessing(false);
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
                Pusat Injeksi Stok
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            Suntik daftar nomor dokumen periode Januari 2025 ke dalam database Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isFinished ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-500">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-xl text-primary">Injeksi Selesai!</h3>
                    <p className="text-muted-foreground text-sm mt-1">Total: {stats} nomor berhasil ditambahkan.</p>
                </div>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => setIsFinished(false)}>
                    Suntik Batch Lain?
                </Button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-600">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">Data yang akan disuntik: HK.800 (Jan 2025) nomor urut 08338 s/d 08437.</p>
                </div>

                <div className="p-4 rounded-lg bg-sky-500/5 border border-sky-500/20 flex gap-3 text-sky-700">
                    <TerminalIcon className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">Login sebagai: <strong>{user.email}</strong></p>
                </div>
                
                <Button 
                    onClick={handlePopulate} 
                    disabled={isProcessing}
                    className="w-full h-16 font-black uppercase tracking-widest text-lg shadow-lg shadow-primary/10 rounded-xl"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Sedang Memproses...
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
    </div>
  );
}
