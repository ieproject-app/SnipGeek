'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Info, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch, collection } from 'firebase/firestore';

const ADMIN_EMAIL = 'iwan.efndi@gmail.com';
const REGION_CODE = 'TA-760103';

// Daftar tugas sesuai data asli Mas Iwan
const populateTasks = [
  { category: 'HK.800', year: 2026, month: 2, start: 100, end: 199 },
  { category: 'HK.800', year: 2026, month: 1, start: 2322, end: 2421 },
  { category: 'HK.820', year: 2026, month: 1, start: 12782, end: 12881 },
  { category: 'HK.820', year: 2026, month: 2, start: 5251, end: 5350 },
  { category: 'UM.000', year: 2026, month: 1, start: 7535, end: 7634 },
  { category: 'UM.000', year: 2026, month: 2, start: 5351, end: 5450 },
  { category: 'HK.800', year: 2025, month: 12, start: 15187, end: 15286 },
  { category: 'HK.800', year: 2025, month: 11, start: 11363, end: 11462 },
  { category: 'HK.800', year: 2025, month: 10, start: 8374, end: 8473 },
  { category: 'HK.820', year: 2025, month: 12, start: 9872, end: 9971 },
  { category: 'HK.820', year: 2025, month: 11, start: 6124, end: 6223 },
  { category: 'UM.000', year: 2025, month: 12, start: 20515, end: 20564 },
  { category: 'UM.000', year: 2025, month: 11, start: 11313, end: 11362 },
  { category: 'LG.270', year: 2026, month: 1, start: 7640, end: 7669 },
  { category: 'LG.270', year: 2026, month: 2, start: 5462, end: 5491 },
  { category: 'HK.820', year: 2025, month: 10, start: 13599, end: 13698 },
  { category: 'UM.000', year: 2025, month: 10, start: 13699, end: 13748 },
  { category: 'LG.270', year: 2025, month: 2, start: 11383, end: 11411 },
];

export function MaintenanceClient({ dictionary }: { dictionary: any }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // Cek tambahan ke koleksi roles_admin agar lebih stabil
  const adminDocRef = useMemoFirebase(() => (user ? doc(db, 'roles_admin', user.uid) : null), [db, user]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading || isAdminDocLoading) {
    return (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Memverifikasi Hak Akses...</p>
        </div>
    );
  }

  // Verifikasi apakah ini Mas Iwan (berdasarkan email atau dokumen roles_admin)
  const isEmailAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isAuthorized = isEmailAdmin || !!adminDoc;

  if (!user || !isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="p-6 bg-destructive/10 rounded-full ring-8 ring-destructive/5">
            <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter text-primary">
                Akses Ditolak
            </h2>
            <p className="text-muted-foreground mt-2 italic">Halaman ini hanya untuk Mas Iwan Efendi ({ADMIN_EMAIL}).</p>
            <p className="text-[10px] mt-4 opacity-50 uppercase font-bold">User: {user?.email || 'Unknown'}</p>
        </div>
      </div>
    );
  }

  const handlePopulate = async () => {
    console.log("Memulai proses injeksi nomor...");
    const isConfirmed = window.confirm("KONFIRMASI: Mas Iwan akan menyuntikkan ribuan nomor baru ke database. Lanjutkan?");
    
    if (!isConfirmed) return;

    setIsProcessing(true);
    let totalCreated = 0;

    try {
        // Proses setiap tugas populasi
        for (const task of populateTasks) {
            const { category, year, month, start, end } = task;
            console.log(`Sedang memproses kategori ${category} periode ${month}-${year}...`);
            
            let batch = writeBatch(db);
            let batchCount = 0;

            for (let i = start; i <= end; i++) {
                const sequence = String(i).padStart(5, '0');
                const dateString = `${String(month).padStart(2, '0')}-${year}`;
                
                // Format nomor placeholder
                const fullNumber = `{DOCTYPE} ${sequence}/${category}/${REGION_CODE}/${dateString}`;
                
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

                // Kirim per 450 dokumen (limit Firestore 500)
                if (batchCount === 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    batchCount = 0;
                }
            }

            // Kirim sisa batch untuk tugas ini
            if (batchCount > 0) {
                await batch.commit();
            }
        }

        setStats(totalCreated);
        setIsFinished(true);
        console.log(`Berhasil menyuntikkan ${totalCreated} nomor.`);
        toast({ title: "Injeksi Berhasil!", description: `${totalCreated} nomor telah masuk ke stok.` });
    } catch (error: any) {
        console.error("Gagal melakukan injeksi:", error);
        toast({ 
            variant: "destructive", 
            title: "Gagal Injeksi", 
            description: error.message || "Pastikan koneksi internet stabil dan Firestore sudah aktif." 
        });
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
          <CardDescription className="text-base leading-relaxed">
            Satu klik untuk mengisi ribuan nomor dokumen periode 2025-2026 ke dalam Firestore.
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
                    <p className="text-muted-foreground font-mono text-sm mt-1">Total: {stats} nomor berhasil masuk ke database.</p>
                </div>
                <Button variant="outline" className="mt-4 rounded-full px-8" onClick={() => setIsFinished(false)}>
                    Ingin Suntik Lagi?
                </Button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-600">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-medium space-y-1">
                        <p>Sistem akan mengirim ribuan data dalam beberapa grup otomatis.</p>
                        <p className="text-[10px] uppercase font-black opacity-70">PENTING: Jangan tutup halaman ini sampai muncul tanda centang.</p>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-sky-500/5 border border-sky-500/20 flex gap-3 text-sky-700">
                    <Terminal className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">Mas sedang login sebagai: <strong>{user.email}</strong></p>
                </div>
                
                <Button 
                    onClick={handlePopulate} 
                    disabled={isProcessing}
                    className="w-full h-16 font-black uppercase tracking-widest text-lg shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl bg-primary text-primary-foreground"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Sedang Menyuntik Data...
                        </>
                    ) : (
                        <>
                            <Database className="mr-3 h-6 w-6" />
                            Suntik Ribuan Nomor Sekarang
                        </>
                    )}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">
        Internal Management Area &bull; Restricted to Admin
      </p>
    </div>
  );
}
