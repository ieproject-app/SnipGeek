
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    CalendarIcon,
    Loader2,
    Database,
    CheckCircle,
    PlusCircle,
    Trash2,
    Copy,
    Check,
    RotateCcw,
    AlertTriangle,
    Plus,
    Minus,
    Zap,
    Hash,
    History,
    FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, writeBatch } from 'firebase/firestore';
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
import { useNotification } from '@/hooks/use-notification';
import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Dictionary } from '@/lib/get-dictionary';

const DAILY_LIMIT = 15;

const STATIC_DOCUMENT_CATEGORIES: Record<string, { name: string; types: string[] }> = {
    'UM.000': { name: 'Umum', types: ['ND UT'] },
    'HK.800': { name: 'Hukum', types: ['BAUT', 'LAUT', 'BA ABD', 'BA REKON'] },
    'HK.820': { name: 'Amandemen', types: ['AMD PERTAMA', 'AMD KEDUA', 'AMD KETIGA', 'AMD KEEMPAT', 'AMD PENUTUP'] },
    'LG.270': { name: 'Penetapan', types: ['PENETAPAN'] },
    'LG.000': { name: 'Justifikasi', types: ['JUSTIFIKASI'] },
};

function buildDocTypes(categories: Record<string, { name: string; types: string[] }>) {
    return Object.entries(categories).flatMap(([category, { types }]) =>
        types.map(type => ({
            value: `${category}__${type}`,
            label: `${type} (${category})`,
            category: category,
            docType: type
        }))
    ).sort((a, b) => a.label.localeCompare(b.label));
}

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
    rawNumber: string;
    date: Date;
    docType: string;
    isError?: boolean;
}

interface DynamicCategory {
    id: string;
    category: string;
    name: string;
    types: string[];
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

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

function createNewRequest(): GenerationRequest {
    return {
        id: `req_${Date.now()}_${Math.random()}`,
        category: '',
        docType: '',
        docDate: new Date(),
        quantity: 1,
    };
}

export function ToolNumbers({ dictionary }: { dictionary: Dictionary }) {
    const [requests, setRequests] = useState<GenerationRequest[]>([createNewRequest()]);
    const [valueCategory, setValueCategory] = useState<ValueCategory>('below_500m');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedNumbers, setGeneratedNumbers] = useState<GeneratedResult[]>([]);
    const [isCopied, setIsCopied] = useState<'full' | 'numbers' | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const [myHistory, setMyHistory] = useState<GeneratedResult[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
    const [stockMatrix, setStockMatrix] = useState<StockMatrix>({});
    const [stockPeriods2025, setStockPeriods2025] = useState<string[]>([]);
    const [stockPeriods2026, setStockPeriods2026] = useState<string[]>([]);
    const [stockCategories, setStockCategories] = useState<string[]>([]);
    const [isStockLoading, setIsStockLoading] = useState(false);

    // Admin Injector states
    const [injectText, setInjectText] = useState('');
    const [injectValueCategory, setInjectValueCategory] = useState<ValueCategory>('below_500m');
    const [isInjecting, setIsInjecting] = useState(false);
    const [injectProgress, setInjectProgress] = useState('');

    const [userLimit, setUserLimit] = useState<UserLimit>({ count: 0, isLimited: false });
    const [isLimitLoading, setIsLimitLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);

    // Dynamic categories (admin-configurable, loaded from Firestore)
    const [dynamicCategories, setDynamicCategories] = useState<DynamicCategory[]>([]);
    const [newCatCode, setNewCatCode] = useState('');
    const [newCatName, setNewCatName] = useState('');
    const [newCatTypes, setNewCatTypes] = useState('');
    const [isSavingCat, setIsSavingCat] = useState(false);

    const { toast } = useToast();
    const { notify } = useNotification();
    const firestore = useFirestore();
    const { user } = useUser();

    const toolMeta = dictionary.tools.tool_list.number_generator;
    const isLoggedIn = Boolean(user);
    const remainingLimit = Math.max(0, DAILY_LIMIT - userLimit.count);

    const mergedCategories = useMemo(() => {
        const dynamic: Record<string, { name: string; types: string[] }> = {};
        dynamicCategories.forEach(dc => {
            dynamic[dc.category] = { name: dc.name, types: dc.types };
        });
        return { ...STATIC_DOCUMENT_CATEGORIES, ...dynamic };
    }, [dynamicCategories]);

    const allDocTypes = useMemo(() => buildDocTypes(mergedCategories), [mergedCategories]);

    const fetchDynamicCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/numbers/categories');
            if (!res.ok) return;
            const data = await res.json();
            setDynamicCategories(data.categories ?? []);
        } catch (error) {
            console.error('Error fetching dynamic categories:', error);
        }
    }, []);

    const handleSaveDynamicCategory = useCallback(async () => {
        if (!user || !isAdminUser) return;
        const code = newCatCode.trim().toUpperCase();
        const name = newCatName.trim();
        const types = newCatTypes.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
        if (!code || !name || types.length === 0) {
            notify('Isi semua field kategori.', <AlertTriangle className="h-4 w-4" />);
            return;
        }
        setIsSavingCat(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/numbers/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ category: code, name, types }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            notify(`Kategori ${code} berhasil disimpan.`, <CheckCircle className="h-4 w-4 text-emerald-500" />);
            setNewCatCode('');
            setNewCatName('');
            setNewCatTypes('');
            await fetchDynamicCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            notify('Gagal menyimpan kategori.', <AlertTriangle className="h-4 w-4" />);
        } finally {
            setIsSavingCat(false);
        }
    }, [user, isAdminUser, newCatCode, newCatName, newCatTypes, notify, fetchDynamicCategories]);

    const handleDeleteDynamicCategory = useCallback(async (catId: string) => {
        if (!user || !isAdminUser) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/numbers/categories?id=${encodeURIComponent(catId)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error);
            notify(`Kategori ${catId} dihapus.`, <Check className="h-4 w-4" />);
            await fetchDynamicCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    }, [user, isAdminUser, notify, fetchDynamicCategories]);

    const fetchAdminStatus = useCallback(async () => {
        if (!firestore || !user) {
            setIsAdminUser(false);
            return;
        }

        try {
            const adminDocRef = doc(firestore, 'roles_admin', user.uid);
            const adminDocSnap = await getDoc(adminDocRef);
            setIsAdminUser(adminDocSnap.exists() && adminDocSnap.data()?.role === 'admin');
        } catch (error) {
            console.error("Error fetching admin status:", error);
            setIsAdminUser(false);
        }
    }, [firestore, user]);

    useEffect(() => {
        if (user) {
            fetchAdminStatus();
            return;
        }
        setIsAdminUser(false);
    }, [user, fetchAdminStatus]);

    const fetchUserLimit = useCallback(async () => {
        setIsLimitLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (user) {
                const token = await user.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch('/api/numbers/generate', { headers });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || 'limit check failed');
            }
            const data = await res.json();
            const count = data.dailyCount ?? 0;
            const limit = data.dailyLimit ?? DAILY_LIMIT;
            setUserLimit({ count, isLimited: !data.isAdmin && count >= limit });
        } catch (error) {
            console.error('Error fetching user limit:', error);
            setUserLimit({ count: 0, isLimited: false });
        } finally {
            setIsLimitLoading(false);
        }
    }, [user]);

    const fetchMyHistory = useCallback(async () => {
        if (!firestore || !user) return;
        setIsHistoryLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStartISO = today.toISOString();

            const q = query(
                collection(firestore, 'availableNumbers'),
                where("assignedTo", "==", user.email),
                where("assignedDate", ">=", todayStartISO),
                orderBy("assignedDate", "desc")
            );

            const querySnapshot = await getDocs(q);
            const history: GeneratedResult[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const rawNum = (data.fullNumber as string).replace('{DOCTYPE} ', '');
                return {
                    text: rawNum,
                    rawNumber: rawNum,
                    docType: data.category,
                    date: new Date(data.assignedDate)
                };
            });

            setMyHistory(history);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [firestore, user]);

    useEffect(() => {
        fetchUserLimit();
        if (user) {
            fetchMyHistory();
            return;
        }
        setMyHistory([]);
        setIsHistoryLoading(false);
    }, [user, fetchUserLimit, fetchMyHistory]);

    useEffect(() => {
        fetchDynamicCategories();
    }, [fetchDynamicCategories]);


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


            const categories = Object.keys(mergedCategories);
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
            toast({ variant: "destructive", title: "Gagal Mengambil Stok", description: "Tidak dapat memuat ringkasan stok." });
        } finally {
            setIsStockLoading(false);
        }
    }, [firestore, toast, mergedCategories]);

    const handleDocTypeChange = (id: string, value: string) => {
        if (!value) return;
        const [category, docType] = value.split('__');
        setRequests(prev => {
            const updated = prev.map(req =>
                req.id === id ? { ...req, category, docType } : req
            );

            if (category === 'UM.000' && docType === 'ND UT') {
                const ndUtReq = updated.find(r => r.id === id);
                const baseDate = ndUtReq?.docDate || new Date();
                const nextDay = addDays(baseDate, 1);

                const autoTypes = [
                    { category: 'HK.800', docType: 'BAUT' },
                    { category: 'HK.800', docType: 'LAUT' },
                    { category: 'HK.800', docType: 'BA ABD' },
                ];

                const existingKeys = updated.map(r => `${r.category}__${r.docType}`);
                const toAdd = autoTypes.filter(t => !existingKeys.includes(`${t.category}__${t.docType}`));

                if (toAdd.length > 0) {
                    const newRows = toAdd.map(t => ({
                        ...createNewRequest(),
                        category: t.category,
                        docType: t.docType,
                        docDate: nextDay,
                    }));
                    return [...updated, ...newRows];
                }
            }

            return updated;
        });
    };

    const handleRequestChange = (id: string, field: keyof GenerationRequest, value: GenerationRequest[keyof GenerationRequest]) => {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, [field]: value } : req));
    };

    const addRequest = () => {
        setRequests(prev => [...prev, createNewRequest()]);
    };

    const removeRequest = (id: string) => {
        setRequests(prev => prev.filter(req => req.id !== id));
    };

    const handleGenerate = async () => {
        for (const req of requests) {
            if (!req.category || !req.docType || !req.docDate || req.quantity < 1) {
                notify('Input Tidak Lengkap: Periksa kembali baris permintaan.', <AlertTriangle className="h-4 w-4" />);
                return;
            }
        }

        setIsGenerating(true);
        setGeneratedNumbers([]);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            let idToken: string | undefined;
            if (user) {
                idToken = await user.getIdToken();
            }

            const body = {
                requests: requests.map(r => ({
                    category: r.category,
                    docType: r.docType,
                    docDate: r.docDate!.toISOString(),
                    quantity: r.quantity,
                })),
                valueCategory,
                idToken,
            };

            const res = await fetch('/api/numbers/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    notify(`Batas harian (${data.dailyLimit}) tercapai. Coba lagi besok.`, <AlertTriangle className="h-4 w-4" />);
                    setUserLimit({ count: data.dailyLimit, isLimited: true });
                } else if (res.status === 503) {
                    notify(data.error || 'Generator sementara belum siap di server. Hubungi admin untuk menyiapkan kredensial Firebase Admin.', <AlertTriangle className="h-4 w-4" />);
                } else {
                    notify(data.error || 'Generate gagal.', <AlertTriangle className="h-4 w-4" />);
                }
                return;
            }

            const generated: GeneratedResult[] = (data.results as Array<{
                text: string; rawNumber: string; date: string; docType: string; isError?: boolean;
            }>).map(r => ({
                ...r,
                date: new Date(r.date),
            }));

            if (data.dailyLimit !== null) {
                setUserLimit({ count: data.dailyCount, isLimited: data.dailyCount >= data.dailyLimit });
            }

            if (user) await fetchMyHistory();

            const sortedGenerated = generated.sort((a, b) => a.date.getTime() - b.date.getTime());
            setGeneratedNumbers(sortedGenerated);

            const successCount = generated.filter(r => !r.isError).length;
            if (successCount > 0) {
                notify(`Berhasil! ${successCount} nomor baru telah dibuat.`, <CheckCircle className="h-4 w-4 text-emerald-500" />);
            } else {
                notify(`Gagal! Tidak ada nomor yang tersedia untuk dibuat.`, <AlertTriangle className="h-4 w-4 text-destructive" />);
            }

        } catch (error: unknown) {
            console.error("Error generating numbers:", error);
            notify(getErrorMessage(error, "Gagal membuat nomor. Terjadi kesalahan sistem."), <AlertTriangle className="h-4 w-4" />);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBulkInject = async () => {
        if (!firestore || !user || !isAdminUser) {
            notify("Akses ditolak: Anda tidak memiliki izin admin.", <AlertTriangle className="h-4 w-4" />);
            return;
        }

        if (!injectText.trim()) {
            notify("Daftar nomor kosong.", <AlertTriangle className="h-4 w-4" />);
            return;
        }

        setIsInjecting(true);
        setInjectProgress("Memulai injeksi...");

        try {
            const lines = injectText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const validNumbers = [];

            for (const line of lines) {
                const parts = line.split('/');
                if (parts.length >= 4) {
                    const sequence = parts[0];
                    const category = parts[1];
                    const dateParts = parts[3].split('-'); // [MM, YYYY]

                    if (dateParts.length === 2) {
                        const month = parseInt(dateParts[0], 10);
                        const year = parseInt(dateParts[1], 10);

                        if (!isNaN(month) && !isNaN(year)) {
                            const docId = `${category}-${year}-${month}-${injectValueCategory}-${sequence}`;
                            validNumbers.push({
                                id: docId,
                                data: {
                                    fullNumber: `{DOCTYPE} ${line}`,
                                    category: category,
                                    year: year,
                                    month: month,
                                    valueCategory: injectValueCategory,
                                    isUsed: false,
                                    assignedTo: "",
                                    assignedDate: "",
                                }
                            });
                        }
                    }
                }
            }

            if (validNumbers.length === 0) {
                notify("Tidak ada format nomor yang valid (sequence/category/.../MM-YYYY).", <AlertTriangle className="h-4 w-4" />);
                setIsInjecting(false);
                return;
            }

            // Batches logic
            const BATCH_SIZE = 500;
            const collectionRef = collection(firestore, 'availableNumbers');

            for (let i = 0; i < validNumbers.length; i += BATCH_SIZE) {
                const chunk = validNumbers.slice(i, i + BATCH_SIZE);
                const batch = writeBatch(firestore);

                for (const item of chunk) {
                    const docRef = doc(collectionRef, item.id);
                    batch.set(docRef, item.data, { merge: true });
                }

                setInjectProgress(`Menyimpan batch ${Math.floor(i / BATCH_SIZE) + 1} dari ${Math.ceil(validNumbers.length / BATCH_SIZE)}...`);
                await batch.commit();
            }

            notify(`Berhasil! ${validNumbers.length} nomor berhasil disuntikkan.`, <CheckCircle className="h-4 w-4 text-emerald-500" />);
            setInjectText('');
            setInjectProgress('');
        } catch (error: unknown) {
            console.error("Error bulk injecting:", error);
            notify(getErrorMessage(error, "Gagal melakukan injeksi nomor."), <AlertTriangle className="h-4 w-4" />);
        } finally {
            setIsInjecting(false);
        }
    };

    const handleReset = () => {
        setRequests([createNewRequest()]);
        setGeneratedNumbers([]);
    };

    const copyFullResults = () => {
        if (generatedNumbers.length === 0) return;
        const textToCopy = generatedNumbers
            .map((result, index) => {
                if (result.isError) return `${index + 1}. [GAGAL] ${result.docType} periode ${format(result.date, 'MM-yyyy')}: ${result.text}`;
                return `${index + 1}. ${result.docType} ${result.text} Tanggal ${format(result.date, 'd MMMM yyyy', { locale: id })}`
            })
            .join('\n');
        navigator.clipboard.writeText(textToCopy);
        notify("Hasil lengkap berhasil disalin ke clipboard.", <Check className="h-4 w-4" />);
        setIsCopied('full');
        setTimeout(() => setIsCopied(null), 2000);
    };

    const copyNumbersOnly = () => {
        if (generatedNumbers.length === 0) return;
        const textToCopy = generatedNumbers
            .filter(r => !r.isError)
            .map(result => result.rawNumber)
            .join('\n');

        if (textToCopy === '') {
            notify("Tidak ada nomor valid untuk disalin.", <AlertTriangle className="h-4 w-4" />);
            return;
        }

        navigator.clipboard.writeText(textToCopy);
        notify("Daftar nomor berhasil disalin.", <Check className="h-4 w-4" />);
        setIsCopied('numbers');
        setTimeout(() => setIsCopied(null), 2000);
    };

    const copyItem = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        notify("Nomor disalin!", <Check className="h-4 w-4" />);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const totalQuantity = requests.reduce((sum, req) => sum + req.quantity, 0);
    const hasResults = generatedNumbers.length > 0;

    return (
        <ToolWrapper
            title={toolMeta.title}
            description={toolMeta.description}
            dictionary={dictionary}
            isPublic={true}
        >
            <div className="space-y-10">
                {/* 1. Stepper Visual */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative flex justify-between">
                        <div className="absolute top-4 left-0 right-0 h-0.5 border-t-2 border-dashed border-primary/20 -z-10" />

                        {[
                            { step: 1, label: "Pilih Jenis & Tanggal", active: !hasResults, done: hasResults },
                            { step: 2, label: "Generate Nomor", active: !hasResults, done: hasResults },
                            { step: 3, label: "Salin Hasil", active: hasResults, done: false }
                        ].map((s) => (
                            <div key={s.step} className="flex flex-col items-center gap-3 bg-background px-4">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500",
                                    s.done ? "bg-accent text-white scale-105" : s.active ? "bg-primary text-primary-foreground shadow-lg scale-110" : "bg-muted text-muted-foreground"
                                )}>
                                    {s.done ? <Check className="h-3.5 w-3.5" /> : s.step}
                                </div>
                                <span className={cn(
                                    "text-[10px] uppercase tracking-widest font-black text-center max-w-20 transition-colors duration-300",
                                    s.done ? "text-accent" : s.active ? "text-primary" : "text-muted-foreground/40"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Tabs defaultValue="generator" className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="bg-muted/40 p-1 h-12 rounded-full border border-primary/5">
                            <TabsTrigger value="generator" className="rounded-full px-8 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <Zap className="h-3.5 w-3.5" />
                                Generator
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-full px-8 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <History className="h-3.5 w-3.5" />
                                Riwayat Saya
                            </TabsTrigger>
                            {isAdminUser && (
                                <TabsTrigger value="injector" className="rounded-full px-8 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                                    <Database className="h-3.5 w-3.5" />
                                    Admin Injector
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="generator" className="space-y-10 mt-0">
                        <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
                            <CardHeader className="bg-muted/20 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                                <div className="space-y-1">
                                    <CardTitle className="font-display text-xl uppercase tracking-tight">Konfigurasi Permintaan</CardTitle>
                                    <CardDescription>Tentukan kategori dan periode dokumen yang ingin dibuat. Tool ini bisa dipakai langsung oleh siapa pun yang memiliki link.</CardDescription>
                                </div>

                                {!isAdminUser && (
                                    <div className="shrink-0">
                                        {isLimitLoading ? (
                                            <Skeleton className="h-16 w-40 rounded-xl" />
                                        ) : (
                                            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-primary/5 shadow-inner min-w-45">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                        <Database className="h-3" /> Kuota Hari Ini
                                                    </span>
                                                    <span className="text-[10px] font-bold text-primary">
                                                        {remainingLimit} / {DAILY_LIMIT} tersisa
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={(remainingLimit / DAILY_LIMIT) * 100}
                                                    className="h-1.5"
                                                    indicatorClassName={cn(
                                                        remainingLimit <= 3 ? "bg-destructive" : "bg-accent"
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-8 p-6">
                                <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] px-4 py-3 text-sm text-muted-foreground">
                                    <span className="font-black uppercase tracking-widest text-[10px] text-primary mr-2">Akses publik</span>
                                    Semua pengguna yang punya link bisa generate nomor tanpa login. Login hanya diperlukan untuk fitur admin seperti injector dan pengaturan lanjutan.
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kategori Nilai Proyek</Label>
                                    <RadioGroup defaultValue="below_500m" value={valueCategory} className="flex flex-wrap items-center gap-6" onValueChange={(value) => setValueCategory(value as ValueCategory)}>
                                        <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                                            <RadioGroupItem value="below_500m" id="below" className="focus-visible:ring-accent" />
                                            <Label htmlFor="below" className="cursor-pointer font-bold text-sm">Di bawah 500 Juta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 opacity-40">
                                            <RadioGroupItem value="above_500m" id="above" disabled />
                                            <Label htmlFor="above" className="text-sm">500 Juta atau lebih</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {requests.map((req, index) => (
                                            <motion.div
                                                key={req.id}
                                                className="grid grid-cols-1 md:grid-cols-[auto_2fr_1.5fr_1fr_auto] gap-4 items-end p-4 md:p-5 border-2 border-primary/5 hover:border-primary/15 transition-colors rounded-2xl bg-linear-to-br from-background to-muted/20 shadow-inner"
                                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.15 } }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            >
                                                <div className="hidden md:flex items-center justify-center h-11 w-8 rounded-lg bg-primary/10 text-primary font-black text-sm">
                                                    {index + 1}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jenis Dokumen</Label>
                                                    <Select onValueChange={(v) => handleDocTypeChange(req.id, v)} value={req.category && req.docType ? `${req.category}__${req.docType}` : ''}>
                                                        <SelectTrigger className="h-11 rounded-lg border-primary/10 focus:ring-accent focus:ring-offset-0"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                                        <SelectContent className="border-primary/10">
                                                            {allDocTypes.map(typeInfo => (
                                                                <SelectItem
                                                                    key={typeInfo.value}
                                                                    value={typeInfo.value}
                                                                    className="cursor-pointer focus:bg-accent/10 focus:text-accent data-[state=checked]:text-accent data-[state=checked]:font-bold"
                                                                >
                                                                    {typeInfo.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tanggal Dokumen</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant={'outline'} className={cn('w-full h-11 justify-start text-left font-normal rounded-lg border-primary/10 hover:border-primary/30 focus-visible:ring-accent', !req.docDate && 'text-muted-foreground')}>
                                                                <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                                                                {req.docDate ? format(req.docDate, 'd MMM yyyy', { locale: id }) : <span>Pilih tanggal</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 border-primary/15 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
                                                            <Calendar
                                                                mode="single"
                                                                selected={req.docDate}
                                                                onSelect={(d) => handleRequestChange(req.id, 'docDate', d)}
                                                                initialFocus
                                                                fixedWeeks={true}
                                                            />
                                                            <div className="border-t border-primary/5 px-3 py-2 flex gap-2">
                                                                <button
                                                                    onClick={() => handleRequestChange(req.id, 'docDate', new Date())}
                                                                    className="flex-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-lg py-1.5 transition-colors"
                                                                >
                                                                    Hari Ini
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRequestChange(req.id, 'docDate', addMonths(new Date(), 1))}
                                                                    className="flex-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-lg py-1.5 transition-colors"
                                                                >
                                                                    Bulan Depan
                                                                </button>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah</Label>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline" size="icon" className="h-11 w-11 rounded-lg border-primary/10 focus-visible:ring-accent"
                                                            onClick={() => handleRequestChange(req.id, 'quantity', Math.max(1, req.quantity - 1))}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <Input
                                                            type="number" min="1" max="20" value={req.quantity}
                                                            onChange={(e) => handleRequestChange(req.id, 'quantity', Number(e.target.value))}
                                                            className="h-11 flex-1 min-w-12.5 text-center rounded-lg border-primary/10 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-accent"
                                                        />
                                                        <Button
                                                            variant="outline" size="icon" className="h-11 w-11 rounded-lg border-primary/10 focus-visible:ring-accent"
                                                            onClick={() => handleRequestChange(req.id, 'quantity', Math.min(20, req.quantity + 1))}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center h-11">
                                                    {requests.length > 1 && (
                                                        <Button variant="ghost" size="icon" onClick={() => removeRequest(req.id)} className="rounded-full hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-all">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-4 pt-6 border-t border-dashed">
                                    <Button
                                        variant="ghost"
                                        onClick={addRequest}
                                        className="w-full md:w-auto h-11 px-6 rounded-full text-primary hover:bg-primary/5 transition-all duration-200 active:scale-95"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Tambah Baris
                                    </Button>

                                    <Dialog open={isStockDialogOpen} onOpenChange={(isOpen) => {
                                        if (isOpen) { fetchStockSummary(); }
                                        setIsStockDialogOpen(isOpen);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary" className="w-full md:w-auto h-11 px-6 rounded-full transition-all duration-200 active:scale-95">
                                                <Database className="mr-2 h-4 w-4 text-accent" />
                                                Cek Stok Tersedia
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-5xl p-0 overflow-hidden border-primary/10 rounded-2xl shadow-2xl shadow-primary/10">
                                            <DialogHeader className="p-6 bg-linear-to-br from-primary/5 to-accent/5 border-b border-primary/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/10">
                                                        <Database className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <DialogTitle className="font-display text-2xl font-black uppercase tracking-tighter">
                                                            Matriks Stok Nomor
                                                        </DialogTitle>
                                                        <DialogDescription className="text-xs mt-0.5">
                                                            Ringkasan sisa nomor per kategori · Periode 2025–2026
                                                        </DialogDescription>
                                                    </div>
                                                </div>
                                            </DialogHeader>
                                            {isStockLoading ? (
                                                <div className="p-16 flex flex-col items-center gap-5 bg-background">
                                                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                                    <Skeleton className="h-52 w-full rounded-xl" />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="bg-background">
                                                        <Tabs defaultValue="2025" className="w-full">
                                                            <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-b">
                                                                <TabsList className="h-9 p-1 bg-background/80 rounded-xl border border-primary/10 gap-1">
                                                                    <TabsTrigger value="2025" className="rounded-lg px-5 text-xs font-black uppercase tracking-widest">2025</TabsTrigger>
                                                                    <TabsTrigger value="2026" className="rounded-lg px-5 text-xs font-black uppercase tracking-widest">2026</TabsTrigger>
                                                                </TabsList>
                                                            </div>
                                                            <TabsContent value="2025" className="mt-0">
                                                                <div className="relative max-h-137.5 overflow-auto bg-background">
                                                                    <table className="w-full border-collapse text-[11px]">
                                                                        <thead className="sticky top-0 z-10 bg-background border-b-2 border-primary/10">
                                                                            <tr className="bg-muted/30">
                                                                                <th className="sticky left-0 z-20 bg-muted/60 backdrop-blur-sm p-4 text-left font-black uppercase tracking-widest text-muted-foreground w-27.5 border-r border-primary/10">Kategori</th>
                                                                                {stockPeriods2025.map(period => (
                                                                                    <th key={period} className="p-3 text-center font-black uppercase tracking-widest text-muted-foreground min-w-16">{format(new Date(period), 'MMM', { locale: id }).toUpperCase()}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-primary/5">
                                                                            {stockCategories.map(category => (
                                                                                <tr key={category} className="group hover:bg-primary/3 transition-colors">
                                                                                    <th className="sticky left-0 bg-background group-hover:bg-primary/3 p-4 text-left font-black text-[10px] tracking-widest text-primary/50 border-r border-primary/5 transition-colors">{category}</th>
                                                                                    {stockPeriods2025.map(period => (
                                                                                        <td key={`${category}-${period}`} className={cn(
                                                                                            "p-3 text-center font-mono text-xs transition-colors",
                                                                                            stockMatrix[category]?.[period] === 0
                                                                                                ? "text-muted-foreground/25"
                                                                                                : stockMatrix[category]?.[period] <= 5
                                                                                                    ? "text-destructive font-black bg-destructive/5"
                                                                                                    : "text-accent font-bold"
                                                                                        )}>
                                                                                            {stockMatrix[category]?.[period] === 0
                                                                                                ? <span className="text-muted-foreground/20">—</span>
                                                                                                : stockMatrix[category]?.[period] ?? 0
                                                                                            }
                                                                                        </td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </TabsContent>
                                                            <TabsContent value="2026" className="mt-0">
                                                                <div className="relative max-h-137.5 overflow-auto bg-background">
                                                                    <table className="w-full border-collapse text-[11px]">
                                                                        <thead className="sticky top-0 z-10 bg-background border-b-2 border-primary/10">
                                                                            <tr className="bg-muted/30">
                                                                                <th className="sticky left-0 z-20 bg-muted/60 backdrop-blur-sm p-4 text-left font-black uppercase tracking-widest text-muted-foreground w-27.5 border-r border-primary/10">Kategori</th>
                                                                                {stockPeriods2026.map(period => (
                                                                                    <th key={period} className="p-3 text-center font-black uppercase tracking-widest text-muted-foreground min-w-16">{format(new Date(period), 'MMM', { locale: id }).toUpperCase()}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-primary/5">
                                                                            {stockCategories.map(category => (
                                                                                <tr key={category} className="group hover:bg-primary/3 transition-colors">
                                                                                    <th className="sticky left-0 bg-background group-hover:bg-primary/3 p-4 text-left font-black text-[10px] tracking-widest text-primary/50 border-r border-primary/5 transition-colors">{category}</th>
                                                                                    {stockPeriods2026.map(period => (
                                                                                        <td key={`${category}-${period}`} className={cn(
                                                                                            "p-3 text-center font-mono text-xs transition-colors",
                                                                                            stockMatrix[category]?.[period] === 0
                                                                                                ? "text-muted-foreground/25"
                                                                                                : stockMatrix[category]?.[period] <= 5
                                                                                                    ? "text-destructive font-black bg-destructive/5"
                                                                                                    : "text-accent font-bold"
                                                                                        )}>
                                                                                            {stockMatrix[category]?.[period] === 0
                                                                                                ? <span className="text-muted-foreground/20">—</span>
                                                                                                : stockMatrix[category]?.[period] ?? 0
                                                                                            }
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
                                                    <div className="flex items-center justify-between px-6 py-3 bg-muted/10 border-t border-primary/5">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Data diambil langsung dari database · Realtime</p>
                                                        <button onClick={fetchStockSummary} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"><RotateCcw className="h-3 w-3" /> Refresh</button>
                                                    </div>
                                                </>
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <div className="flex-1">
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || userLimit.isLimited}
                                            className={cn(
                                                "w-full h-12 rounded-full shadow-lg shadow-accent/20 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest transition-all duration-200 active:scale-95",
                                                isGenerating && "ring-2 ring-accent ring-offset-2 animate-pulse"
                                            )}
                                        >
                                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                            {isGenerating ? 'Memproses...' : `Generate Semua (${totalQuantity} Nomor)`}
                                        </Button>
                                    </div>
                                </div>

                                {!isAdminUser && userLimit.isLimited && (
                                    <div className="mt-4 flex items-center gap-4 rounded-xl border border-destructive/20 bg-linear-to-r from-destructive/10 to-destructive/5 p-5 border-l-4 border-l-destructive animate-in slide-in-from-top-2">
                                        <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" />
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-destructive uppercase tracking-tight">Batas Harian Tercapai</p>
                                            <p className="text-xs text-destructive/70 font-medium">Kuota akan direset otomatis esok hari pukul 00.00.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <AnimatePresence mode="wait">
                            {hasResults && (
                                <motion.div
                                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                >
                                    <Card className="border-accent/20 bg-accent/5 shadow-xl ring-1 ring-accent/5 overflow-hidden transition-shadow duration-300 hover:shadow-2xl">
                                        <CardHeader className="bg-linear-to-r from-accent/15 to-accent/5 border-b border-accent/10 p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-accent rounded-xl shadow-lg shadow-accent/30"><CheckCircle className="h-5 w-5 text-white" /></div>
                                                    <CardTitle className="font-display text-2xl font-black uppercase tracking-tighter">Hasil Generate</CardTitle>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" onClick={copyFullResults} className="rounded-full bg-background/50 h-9 text-[10px] font-black border-accent/20 hover:border-accent transition-all active:scale-95">
                                                        {isCopied === 'full' ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
                                                        SALIN LENGKAP
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={copyNumbersOnly} className="rounded-full bg-background/50 h-9 text-[10px] font-black border-accent/20 hover:border-accent transition-all active:scale-95">
                                                        {isCopied === 'numbers' ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Hash className="mr-2 h-3.5 w-3.5" />}
                                                        SALIN NOMOR SAJA
                                                    </Button>
                                                    <Button variant="secondary" size="sm" onClick={handleReset} className="rounded-full h-9 text-[10px] font-black transition-all active:scale-95">
                                                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                                        ULANGI
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <div className="space-y-3">
                                                <ol className="space-y-3">
                                                    {generatedNumbers.map((result, index) => (
                                                        <li key={index} className={cn(
                                                            "flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-sm group border-l-4 transition-all",
                                                            result.isError
                                                                ? "border-destructive/40 border-l-destructive bg-destructive/5"
                                                                : "border-accent/10 border-l-accent/40 hover:border-accent hover:bg-accent/5"
                                                        )}>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <span className={cn(
                                                                        "text-[10px] font-black uppercase tracking-[0.15em]",
                                                                        result.isError ? "text-destructive" : "text-accent"
                                                                    )}>{result.docType}</span>
                                                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                                        {format(result.date, 'd MMMM yyyy', { locale: id })}
                                                                    </span>
                                                                </div>
                                                                <span className={cn(
                                                                    "font-mono text-lg font-black tracking-tight",
                                                                    result.isError ? "text-destructive/60 italic" : "text-primary"
                                                                )}>{result.isError ? result.text : result.rawNumber}</span>
                                                            </div>
                                                            {!result.isError && (
                                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/10 text-accent shrink-0 transition-all" onClick={() => copyItem(result.rawNumber, index)}>
                                                                    {copiedIndex === index ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                                                </Button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/20 border-b p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="font-display text-xl uppercase tracking-tight">Riwayat Hari Ini</CardTitle>
                                        <CardDescription>
                                            {isLoggedIn
                                                ? 'Daftar nomor yang telah Anda ambil pada hari ini.'
                                                : 'Riwayat pribadi tersedia setelah login. Penggunaan publik tetap bisa langsung berjalan tanpa login.'}
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={fetchMyHistory} disabled={isHistoryLoading || !isLoggedIn} className="rounded-full gap-2">
                                        <RotateCcw className={cn("h-3.5 w-3.5", isHistoryLoading && "animate-spin")} />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {!isLoggedIn ? (
                                    <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-muted/5 space-y-4">
                                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/20" />
                                        <div className="space-y-1.5">
                                            <p className="text-sm font-black uppercase tracking-widest text-primary">Login opsional untuk riwayat</p>
                                            <p className="text-sm text-muted-foreground max-w-xl mx-auto">Generator tetap dapat dipakai bebas oleh siapa pun yang memiliki link. Jika Anda login sebagai admin, Anda juga bisa membuka injector dan pengaturan internal.</p>
                                        </div>
                                    </div>
                                ) : isHistoryLoading ? (
                                    <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" /></div>
                                ) : myHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {myHistory.map((item, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-primary/5 group hover:border-accent/30 transition-all">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-primary/10">{item.docType}</Badge>
                                                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{format(item.date, 'HH:mm', { locale: id })} WIB</span>
                                                    </div>
                                                    <span className="font-mono text-base font-black tracking-tight text-primary">{item.text}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-all" onClick={() => copyItem(item.text, index + 100)}>
                                                    {copiedIndex === index + 100 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Belum ada aktivitas hari ini</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {isAdminUser && (
                        <TabsContent value="injector" className="mt-0">
                            <Card className="border-destructive/20 bg-card/50 shadow-sm overflow-hidden ring-1 ring-destructive/10">
                                <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-destructive/10 rounded-xl">
                                            <Database className="h-5 w-5 text-destructive" />
                                        </div>
                                        <div>
                                            <CardTitle className="font-display text-xl text-destructive uppercase tracking-tight">Admin Injector</CardTitle>
                                            <CardDescription>Mode admin untuk menyuntikkan stok nomor secara massal langsung ke database.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kategori Nilai Proyek</Label>
                                        <RadioGroup defaultValue="below_500m" value={injectValueCategory} className="flex flex-wrap items-center gap-6" onValueChange={(value) => setInjectValueCategory(value as ValueCategory)}>
                                            <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-destructive/20 transition-all">
                                                <RadioGroupItem value="below_500m" id="inj_below" className="focus-visible:ring-destructive" />
                                                <Label htmlFor="inj_below" className="cursor-pointer font-bold text-sm">Di bawah 500 Juta</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-destructive/20 transition-all opacity-40">
                                                <RadioGroupItem value="above_500m" id="inj_above" className="focus-visible:ring-destructive" disabled />
                                                <Label htmlFor="inj_above" className="cursor-pointer font-bold text-sm">500 Juta atau lebih</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Format: 06153/UM.000/TA-851040/03-2025 (Setiap nomor di baris baru)</Label>
                                        <textarea
                                            className="flex min-h-75 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm font-mono shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="06153/UM.000/TA-851040/03-2025&#10;06154/UM.000/TA-851040/03-2025&#10;..."
                                            value={injectText}
                                            onChange={(e) => setInjectText(e.target.value)}
                                            disabled={isInjecting}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-4">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {isInjecting ? injectProgress : `${injectText.split('\n').filter(l => l.trim().length > 0).length} baris terdeteksi`}
                                        </span>
                                        <Button
                                            onClick={handleBulkInject}
                                            disabled={isInjecting || injectText.trim() === ''}
                                            className={cn(
                                                "h-11 px-8 rounded-full shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase tracking-widest transition-all duration-200 active:scale-95",
                                                isInjecting && "opacity-80 cursor-not-allowed"
                                            )}
                                        >
                                            {isInjecting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Memproses</>
                                            ) : (
                                                <><Database className="mr-2 h-4 w-4" /> Mulai Injeksi</>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="pt-6 border-t border-destructive/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manajemen Tipe Dokumen (Dinamis)</Label>
                                            <Button variant="ghost" size="sm" onClick={fetchDynamicCategories} className="rounded-full text-[10px] h-7 gap-1.5 text-muted-foreground">
                                                <RotateCcw className="h-3 w-3" /> Refresh
                                            </Button>
                                        </div>

                                        {dynamicCategories.length > 0 && (
                                            <div className="space-y-2">
                                                {dynamicCategories.map(dc => (
                                                    <div key={dc.id} className="flex items-center justify-between px-4 py-2.5 bg-background/50 rounded-xl border border-primary/10">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-xs font-black text-primary">{dc.category}</span>
                                                            <span className="text-[10px] text-muted-foreground">{dc.name}</span>
                                                            <span className="text-[9px] text-muted-foreground/60 font-mono">[{dc.types.join(', ')}]</span>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDynamicCategory(dc.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive/40 hover:text-destructive">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end p-4 bg-background/30 rounded-xl border border-dashed border-primary/10">
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-black uppercase text-muted-foreground">Kode Kategori</Label>
                                                <Input
                                                    placeholder="LG.999"
                                                    value={newCatCode}
                                                    onChange={e => setNewCatCode(e.target.value)}
                                                    className="h-9 rounded-lg border-primary/10 font-mono text-xs focus-visible:ring-destructive/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-black uppercase text-muted-foreground">Nama Kategori</Label>
                                                <Input
                                                    placeholder="Nama"
                                                    value={newCatName}
                                                    onChange={e => setNewCatName(e.target.value)}
                                                    className="h-9 rounded-lg border-primary/10 text-xs focus-visible:ring-destructive/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-black uppercase text-muted-foreground">Tipe Dokumen (pisah koma)</Label>
                                                <Input
                                                    placeholder="TIPE A, TIPE B"
                                                    value={newCatTypes}
                                                    onChange={e => setNewCatTypes(e.target.value)}
                                                    className="h-9 rounded-lg border-primary/10 text-xs focus-visible:ring-destructive/50"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleSaveDynamicCategory}
                                                disabled={isSavingCat}
                                                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest"
                                            >
                                                {isSavingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest">Kategori baru akan tersedia di dropdown generator tanpa perlu deploy ulang.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </ToolWrapper>
    );
}
