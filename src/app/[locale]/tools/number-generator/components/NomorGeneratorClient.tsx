
'use client';

import { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Database, CheckCircle, LogIn, PlusCircle, Trash2, Copy, Check, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth } from '@/firebase';
import { collection, query, where, getDocs, runTransaction, doc, limit, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAILY_LIMIT = 10;
const ADMIN_EMAIL = 'iwan.efndi@gmail.com';

const documentCategories: Record<string, { name: string; types: string[] }> = {
  'UM.000': { name: 'Umum', types: ['ND UT'] },
  'HK.800': { name: 'Hukum', types: ['BAUT', 'LAUT', 'BA ABD', 'BA REKON'] },
  'HK.820': { name: 'Amandemen', types: ['AMD PERTAMA', 'AMD KEDUA', 'AMD KETIGA', 'AMD KEEMPAT', 'AMD PENUTUP'] },
  'LG.270': { name: 'Penetapan', types: ['PENETAPAN'] },
};

const allDocTypes = Object.entries(documentCategories).flatMap(([category, { types }]) => 
    types.map(type => ({
        value: `${category}__${type}`, // e.g., "HK.800__BAUT"
        label: `${type} (${category})`,
        category: category,
        docType: type
    }))
).sort((a, b) => a.label.localeCompare(b.label));

type ValueCategory = 'below_500m' | 'above_500m';

interface GenerationRequest {
    id: string;
    category: string;
    docType: string;
    docDate: Date | undefined;
    quantity: number;
}

interface GeneratedResult {
  text: string;
  date: Date;
  docType: string;
}

interface RemainingCount {
    label: string;
    count: number;
}

interface StockMatrix {
    [category: string]: {
        [period: string]: number; // period is 'YYYY-MM'
    };
}

interface UserLimit {
    count: number;
    isLimited: boolean;
}

function createNewRequest(): GenerationRequest {
    return {
        id: `req_${Date.now()}_${Math.random()}`,
        category: '',
        docType: '',
        docDate: new Date(),
        quantity: 1,
    };
}

export function NomorGeneratorClient() {
    const [requests, setRequests] = useState<GenerationRequest[]>([createNewRequest()]);
    const [valueCategory, setValueCategory] = useState<ValueCategory>('below_500m');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedNumbers, setGeneratedNumbers] = useState<GeneratedResult[]>([]);
    const [remainingCounts, setRemainingCounts] = useState<RemainingCount[]>([]);
    const [isCopied, setIsCopied] = useState<'full' | 'numbers' | null>(null);
    
    // State for Stock Dialog
    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
    const [stockMatrix, setStockMatrix] = useState<StockMatrix>({});
    const [stockPeriods2025, setStockPeriods2025] = useState<string[]>([]);
    const [stockPeriods2026, setStockPeriods2026] = useState<string[]>([]);
    const [stockCategories, setStockCategories] = useState<string[]>([]);
    const [isStockLoading, setIsStockLoading] = useState(false);
    
    // State for user limits
    const [userLimit, setUserLimit] = useState<UserLimit>({ count: 0, isLimited: false });
    const [isLimitLoading, setIsLimitLoading] = useState(true);

    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading } = useAuth();

    const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

    const fetchUserLimit = useCallback(async () => {
        if (!firestore || !user || isAdmin) {
            setIsLimitLoading(false);
            return;
        }

        setIsLimitLoading(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const limitRef = doc(firestore, 'userGenerationLimits', user.uid);
        
        try {
            const docSnap = await getDoc(limitRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.lastGeneratedDate === todayStr) {
                    const currentCount = data.dailyCount || 0;
                    setUserLimit({ count: currentCount, isLimited: currentCount >= DAILY_LIMIT });
                } else {
                    setUserLimit({ count: 0, isLimited: false });
                }
            } else {
                setUserLimit({ count: 0, isLimited: false });
            }
        } catch (error) {
            console.error("Error fetching user limit:", error);
            setUserLimit({ count: 0, isLimited: false });
        } finally {
            setIsLimitLoading(false);
        }
    }, [firestore, user, isAdmin]);

    useEffect(() => {
        fetchUserLimit();
    }, [fetchUserLimit]);


    const fetchStockSummary = useCallback(async () => {
        if (!firestore) return;
        setIsStockLoading(true);

        try {
            const q = query(
                collection(firestore, 'availableNumbers'),
                where("isUsed", "==", false)
            );

            const querySnapshot = await getDocs(q);
            
            const periods2025: string[] = [];
            let currentDate2025 = new Date(2025, 0, 1);
            const endDate2025 = new Date(2025, 11, 1);
             while (currentDate2025 <= endDate2025) {
                periods2025.push(format(currentDate2025, 'yyyy-MM'));
                currentDate2025 = addMonths(currentDate2025, 1);
            }
            setStockPeriods2025(periods2025);

            const periods2026: string[] = [];
            let currentDate2026 = new Date(2026, 0, 1);
            const endDate2026 = new Date(2026, 2, 1);
            while (currentDate2026 <= endDate2026) {
                periods2026.push(format(currentDate2026, 'yyyy-MM'));
                currentDate2026 = addMonths(currentDate2026, 1);
            }
            setStockPeriods2026(periods2026);


            const categories = Object.keys(documentCategories);
            setStockCategories(categories);

            const allPeriods = [...periods2025, ...periods2026];
            const matrix: StockMatrix = {};
            categories.forEach(cat => {
                matrix[cat] = {};
                allPeriods.forEach(p => {
                    matrix[cat][p] = 0;
                });
            });

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const year = data.year;
                if (year === 2025 || year === 2026) {
                  const periodKey = format(new Date(year, data.month - 1), 'yyyy-MM');
                  if (matrix[data.category] && typeof matrix[data.category][periodKey] !== 'undefined') {
                      matrix[data.category][periodKey]++;
                  }
                }
            });
            
            setStockMatrix(matrix);

        } catch (error) {
            console.error("Error fetching stock summary:", error);
            toast({ variant: "destructive", title: "Gagal Mengambil Stok", description: "Tidak dapat memuat ringkasan stok. Mungkin perlu membuat index di Firestore." });
        } finally {
            setIsStockLoading(false);
        }
    }, [firestore, toast]);

    const handleDocTypeChange = (id: string, value: string) => {
        if (!value) return;
        const [category, docType] = value.split('__');
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, category, docType } : req
        ));
    };

    const handleRequestChange = (id: string, field: keyof GenerationRequest, value: any) => {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, [field]: value } : req));
    };

    const addRequest = () => {
        setRequests(prev => [...prev, createNewRequest()]);
    };

    const removeRequest = (id: string) => {
        setRequests(prev => prev.filter(req => req.id !== id));
    };

    const handleGenerate = async () => {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Koneksi Gagal", description: "Tidak dapat terhubung ke database atau Anda belum login." });
            return;
        }

        for (const req of requests) {
            if (!req.category || !req.docType || !req.docDate || req.quantity < 1) {
                toast({ variant: "destructive", title: "Input Tidak Lengkap", description: "Pastikan semua baris permintaan terisi dengan benar." });
                return;
            }
        }
        
        setIsGenerating(true);
        setGeneratedNumbers([]);
        setRemainingCounts([]);

        try {
            const totalRequested = requests.reduce((sum, req) => sum + req.quantity, 0);

            const generated = await runTransaction(firestore, async (transaction) => {
                const limitRef = doc(firestore, 'userGenerationLimits', user.uid);
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                let currentCount = 0;
                let newDailyCount = 0;

                if (!isAdmin) {
                    const limitDoc = await transaction.get(limitRef);
                    if (limitDoc.exists()) {
                        const limitData = limitDoc.data();
                        if (limitData.lastGeneratedDate === todayStr) {
                            currentCount = limitData.dailyCount;
                        }
                    }
                    
                    if (currentCount >= DAILY_LIMIT) {
                        throw new Error(`Anda telah mencapai batas generate harian (${DAILY_LIMIT} kali).`);
                    }
                    if (currentCount + totalRequested > DAILY_LIMIT) {
                        throw new Error(`Permintaan Anda (${totalRequested}) melebihi sisa kuota harian (${DAILY_LIMIT - currentCount}).`);
                    }
                    newDailyCount = currentCount + totalRequested;
                }

                const allDocRefsToUpdate: { docId: string; originalRequest: { docType: string; docDate: Date } }[] = [];
                for (const req of requests) {
                    const year = req.docDate!.getFullYear();
                    const month = req.docDate!.getMonth() + 1;
                    const numbersRef = collection(firestore, 'availableNumbers');
                    const q = query(
                        numbersRef,
                        where("category", "==", req.category),
                        where("year", "==", year),
                        where("month", "==", month),
                        where("valueCategory", "==", valueCategory),
                        where("isUsed", "==", false),
                        limit(req.quantity)
                    );
                    const querySnapshot = await getDocs(q);
                    if (querySnapshot.docs.length < req.quantity) {
                        throw new Error(`Stok tidak cukup untuk ${req.docType} (${req.category}) periode ${month}-${year}. Tersedia: ${querySnapshot.docs.length}, diminta: ${req.quantity}.`);
                    }
                    querySnapshot.docs.forEach(doc => {
                        allDocRefsToUpdate.push({ docId: doc.id, originalRequest: { docType: req.docType, docDate: req.docDate! } });
                    });
                }
                
                const docsDataToUpdate: { ref: any, data: any, originalRequest: any }[] = [];
                const docsToRead = allDocRefsToUpdate.map(item => doc(firestore, 'availableNumbers', item.docId));
                const snapshots = await Promise.all(docsToRead.map(ref => transaction.get(ref)));

                for (let i = 0; i < snapshots.length; i++) {
                    const docSnapshot = snapshots[i];
                    if (!docSnapshot.exists() || docSnapshot.data().isUsed === true) {
                        throw new Error(`Konflik: Nomor ${docSnapshot.id} sudah terpakai. Transaksi dibatalkan.`);
                    }
                    docsDataToUpdate.push({
                        ref: docSnapshot.ref,
                        data: docSnapshot.data(),
                        originalRequest: allDocRefsToUpdate[i].originalRequest,
                    });
                }
                
                for (const item of docsDataToUpdate) {
                    transaction.update(item.ref, {
                        isUsed: true,
                        assignedTo: user.email,
                        assignedDate: new Date().toISOString()
                    });
                }

                if (!isAdmin) {
                    transaction.set(limitRef, { dailyCount: newDailyCount, lastGeneratedDate: todayStr }, { merge: true });
                }

                return docsDataToUpdate.map(item => ({
                    text: `${item.data.fullNumber.replace('{DOCTYPE}', item.originalRequest.docType)}`,
                    docType: item.originalRequest.docType,
                    date: item.originalRequest.docDate
                }));
            });

            await fetchUserLimit();

            const counts = await Promise.all(
                Array.from(new Set(requests.map(r => `${r.category}|${r.docDate!.getFullYear()}|${r.docDate!.getMonth() + 1}`)))
                    .map(async (uniqueReqKey) => {
                        const [category, yearStr, monthStr] = uniqueReqKey.split('|');
                        const q = query(
                            collection(firestore, 'availableNumbers'),
                            where("category", "==", category),
                            where("year", "==", parseInt(yearStr)),
                            where("month", "==", parseInt(monthStr)),
                            where("valueCategory", "==", valueCategory),
                            where("isUsed", "==", false)
                        );
                        const snapshot = await getDocs(q);
                        const docTypeLabel = requests.find(r => r.category === category)?.docType || category;
                        return {
                            label: `${docTypeLabel} (${category}) - ${format(new Date(parseInt(yearStr), parseInt(monthStr) - 1), 'MMM yyyy', { locale: id })}`,
                            count: snapshot.size,
                        };
                    })
            );
            setRemainingCounts(counts.sort((a,b) => a.label.localeCompare(b.label)));

            const sortedGenerated = generated.sort((a, b) => a.date.getTime() - b.date.getTime());
            setGeneratedNumbers(sortedGenerated);
            toast({ title: "Sukses!", description: `${generated.length} nomor berhasil dibuat.` });

        } catch (error: any) {
            console.error("Error generating numbers:", error);
            toast({ variant: "destructive", title: "Gagal Membuat Nomor", description: error.message || "Terjadi kesalahan saat transaksi." });
            setGeneratedNumbers([]);
            setRemainingCounts([]);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleReset = () => {
        setRequests([createNewRequest()]);
        setGeneratedNumbers([]);
        setRemainingCounts([]);
    };
    
    const copyFullResults = () => {
        if (generatedNumbers.length === 0) return;
        const textToCopy = generatedNumbers
            .map((result, index) => `${index + 1}. ${result.docType} ${result.text} Tanggal ${format(result.date, 'd MMMM yyyy', { locale: id })}`)
            .join('\n');
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "Tersalin!", description: "Hasil lengkap berhasil disalin ke clipboard." });
        setIsCopied('full');
        setTimeout(() => setIsCopied(null), 2000);
    };

    const copyNumbersOnly = () => {
        if (generatedNumbers.length === 0) return;
        const textToCopy = generatedNumbers.map(result => result.text).join('\n');
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "Tersalin!", description: "Hanya nomor yang berhasil disalin." });
        setIsCopied('numbers');
        setTimeout(() => setIsCopied(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Memuat komponen...</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <Card className="text-center mt-8">
                <CardHeader>
                    <CardTitle className="font-heading">Akses Dibatasi</CardTitle>
                    <CardDescription>Anda harus login untuk menggunakan fitur ini.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4"/>
                            Login
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Parameter Generator</CardTitle>
                    <CardDescription>Isi permintaan nomor di bawah ini. Anda bisa menambah beberapa permintaan sekaligus.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Kategori Nilai Proyek</Label>
                        <RadioGroup defaultValue="below_500m" value={valueCategory} className="flex items-center space-x-4" onValueChange={(value) => setValueCategory(value as ValueCategory)}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="below_500m" id="below" /><Label htmlFor="below">Di bawah 500 Juta</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="above_500m" id="above" disabled /><Label htmlFor="above" className="text-muted-foreground">500 Juta atau lebih (belum didukung)</Label></div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {requests.map((req, index) => (
                                <motion.div 
                                    key={req.id} 
                                    className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_0.5fr_auto] gap-4 items-end p-4 border rounded-lg bg-background"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="space-y-2">
                                        {index === 0 && <Label>Jenis Dokumen</Label>}
                                        <Select onValueChange={(v) => handleDocTypeChange(req.id, v)} value={req.category && req.docType ? `${req.category}__${req.docType}` : ''}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Jenis Dokumen..." /></SelectTrigger>
                                            <SelectContent>
                                                {allDocTypes.map(typeInfo => (
                                                    <SelectItem key={typeInfo.value} value={typeInfo.value}>
                                                        {typeInfo.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        {index === 0 && <Label>Tanggal Dokumen</Label>}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !req.docDate && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {req.docDate ? format(req.docDate, 'd MMM yyyy', { locale: id }) : <span>Pilih tanggal</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={req.docDate} onSelect={(d) => handleRequestChange(req.id, 'docDate', d)} initialFocus/></PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                         {index === 0 && <Label>Jumlah</Label>}
                                        <Input type="number" min="1" max="20" value={req.quantity} onChange={(e) => handleRequestChange(req.id, 'quantity', Number(e.target.value))} className="w-full md:w-20"/>
                                    </div>
                                    <div className="flex items-center h-10">
                                      {requests.length > 1 && (
                                        <Button variant="ghost" size="icon" onClick={() => removeRequest(req.id)} aria-label="Hapus Permintaan">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Button variant="outline" onClick={addRequest} className="w-full md:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Permintaan
                        </Button>
                        
                        <Dialog open={isStockDialogOpen} onOpenChange={(isOpen) => {
                            if (isOpen) { fetchStockSummary(); }
                            setIsStockDialogOpen(isOpen);
                        }}>
                             <DialogTrigger asChild>
                                 <Button variant="secondary" className="w-full md:w-auto">
                                     <Database className="mr-2 h-4 w-4" />
                                     Lihat Stok
                                 </Button>
                             </DialogTrigger>
                             <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Matriks Stok Nomor Tersedia</DialogTitle>
                                    <DialogDescription>
                                        Ringkasan lengkap jumlah nomor yang tersedia per kategori dan periode.
                                    </DialogDescription>
                                </DialogHeader>
                                {isStockLoading ? (
                                    <div className="p-4"><Skeleton className="h-[50vh] w-full" /></div>
                                ) : (
                                <div className="rounded-lg border overflow-hidden">
                                    <Tabs defaultValue="2025" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                                            <TabsTrigger value="2025" className="rounded-none">Tahun 2025</TabsTrigger>
                                            <TabsTrigger value="2026" className="rounded-none">Tahun 2026</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="2025" className="mt-0">
                                            <div className="relative max-h-[60vh] overflow-auto">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead className="sticky top-0 z-10 bg-secondary">
                                                        <tr className="border-b">
                                                            <th scope="col" className="sticky left-0 z-20 bg-inherit p-4 text-left font-medium text-muted-foreground w-[100px] min-w-[100px]">Kategori</th>
                                                            {stockPeriods2025.map(period => (
                                                                <th scope="col" key={period} className="p-4 text-center font-medium text-muted-foreground min-w-[70px]">
                                                                    {format(new Date(period), 'MMM', { locale: id })}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-background">
                                                        {stockCategories.map(category => (
                                                            <tr key={category} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                                                                <th scope="row" className="sticky left-0 bg-inherit p-4 text-left font-semibold">{category}</th>
                                                                {stockPeriods2025.map(period => (
                                                                    <td key={`${category}-${period}`} className={cn(
                                                                        "p-4 text-center font-mono",
                                                                        stockMatrix[category]?.[period] === 0 && "text-muted-foreground/50",
                                                                        stockMatrix[category]?.[period] > 0 && stockMatrix[category]?.[period] <= 5 && "text-destructive font-bold",
                                                                        stockMatrix[category]?.[period] > 5 && "text-primary font-semibold"
                                                                    )}>
                                                                        {stockMatrix[category]?.[period] ?? 0}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="2026" className="mt-0">
                                            <div className="relative max-h-[60vh] overflow-auto">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead className="sticky top-0 z-10 bg-secondary">
                                                        <tr className="border-b">
                                                            <th scope="col" className="sticky left-0 z-20 bg-inherit p-4 text-left font-medium text-muted-foreground w-[100px] min-w-[100px]">Kategori</th>
                                                            {stockPeriods2026.map(period => (
                                                                <th scope="col" key={period} className="p-4 text-center font-medium text-muted-foreground min-w-[70px]">
                                                                    {format(new Date(period), 'MMM', { locale: id })}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-background">
                                                        {stockCategories.map(category => (
                                                            <tr key={category} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                                                                <th scope="row" className="sticky left-0 bg-inherit p-4 text-left font-semibold">{category}</th>
                                                                {stockPeriods2026.map(period => (
                                                                    <td key={`${category}-${period}`} className={cn(
                                                                        "p-4 text-center font-mono",
                                                                        stockMatrix[category]?.[period] === 0 && "text-muted-foreground/50",
                                                                        stockMatrix[category]?.[period] > 0 && stockMatrix[category]?.[period] <= 5 && "text-destructive font-bold",
                                                                        stockMatrix[category]?.[period] > 5 && "text-primary font-semibold"
                                                                    )}>
                                                                        {stockMatrix[category]?.[period] ?? 0}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <div className="flex-1">
                            <Button onClick={handleGenerate} disabled={isGenerating || userLimit.isLimited} className="w-full">
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isGenerating ? 'Memproses...' : `Generate Semua Permintaan (${requests.reduce((a,b) => a+b.quantity, 0)})`}
                            </Button>
                            {!isAdmin && (
                                <p className="mt-2 text-xs text-center text-muted-foreground">
                                    {isLimitLoading ? 'Memeriksa kuota...' : `Kuota harian: ${userLimit.count}/${DAILY_LIMIT}`}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {!isAdmin && userLimit.isLimited && (
                        <div className="mt-4 flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive-foreground">
                            <Info className="h-5 w-5 flex-shrink-0" />
                            <p>Anda telah mencapai batas generate harian. Silakan kembali lagi besok.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AnimatePresence>
                {(generatedNumbers.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-6 w-6 text-green-500"/>
                                    <span>Hasil Generate</span>
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                        <Label className="text-base font-semibold text-foreground">
                                            Nomor yang Berhasil Dibuat:
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" onClick={copyFullResults}>
                                                {isCopied === 'full' ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                                                {isCopied === 'full' ? 'Tersalin!' : 'Salin (Lengkap)'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={copyNumbersOnly}>
                                                {isCopied === 'numbers' ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                                                {isCopied === 'numbers' ? 'Tersalin!' : 'Salin (Nomor Saja)'}
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={handleReset}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Buat Baru
                                            </Button>
                                        </div>
                                    </div>
                                    <ol className="mt-2 space-y-1.5 list-decimal list-inside font-mono rounded-lg border bg-muted/50 p-4">
                                        {generatedNumbers.map((result, index) => (
                                            <li key={index} className="text-sm">
                                                <span className="font-sans font-semibold text-primary">{result.docType}</span>
                                                <span className="font-sans text-foreground"> {result.text}</span> 
                                                <span className="font-sans text-muted-foreground"> Tanggal {format(result.date, 'd MMMM yyyy', { locale: id })}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                                
                                {remainingCounts.length > 0 && (
                                     <div className="space-y-2">
                                        <Label className="text-base font-semibold text-foreground">
                                            Sisa Nomor Tersedia:
                                        </Label>
                                        <div className="space-y-3">
                                            {remainingCounts.map((item, index) => (
                                                <div key={index} className="rounded-lg border p-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                        <span className={cn("font-mono font-semibold", item.count <= 3 ? 'text-destructive' : 'text-primary')}>{item.count}</span>
                                                    </div>
                                                    {item.count <= 3 && (
                                                        <div className="mt-2 flex items-start gap-2 rounded-md border-l-4 border-destructive bg-destructive/10 p-2 text-xs">
                                                            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                Stok menipis! Mohon segera laporkan ke pemilik situs melalui <a href="https://t.me/si_lula" target="_blank" className="font-bold underline hover:text-destructive">Telegram</a> atau halaman <a href="/kontak" target="_blank" className="font-bold underline hover:text-destructive">kontak</a>.
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


    