
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, writeBatch } from 'firebase/firestore';
import { useNotification } from '@/hooks/use-notification';
import {
    DAILY_LIMIT,
    STATIC_DOCUMENT_CATEGORIES,
    type ValueCategory,
    type GenerationRequest,
    type GeneratedResult,
    type DynamicCategory,
    type StockMatrix,
    type StockCategoryDetail,
    type UserLimit,
    getErrorMessage,
    normalizeCategory,
    createNewRequest,
} from './types';

export function useToolNumbers() {
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
    const [stockRawMatrix, setStockRawMatrix] = useState<StockMatrix>({});
    const [stockPeriodsByYear, setStockPeriodsByYear] = useState<Record<string, string[]>>({});
    const [stockYears, setStockYears] = useState<string[]>([]);
    const [stockCategories, setStockCategories] = useState<string[]>([]);
    const [stockCategoryDetails, setStockCategoryDetails] = useState<StockCategoryDetail[]>([]);
    const [isStockLoading, setIsStockLoading] = useState(false);
    const [openDatePickerId, setOpenDatePickerId] = useState<string | null>(null);
    const [calendarViewMonths, setCalendarViewMonths] = useState<Record<string, Date>>({});

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

    const isLoggedIn = Boolean(user);
    const remainingLimit = Math.max(0, DAILY_LIMIT - userLimit.count);
    const hasResults = generatedNumbers.length > 0;
    const successCount = generatedNumbers.filter(r => !r.isError).length;
    const failedCount = generatedNumbers.filter(r => r.isError).length;
    const totalQuantity = requests.reduce((sum, r) => sum + r.quantity, 0);

    const mergedCategories = useMemo(() => {
        const dynamic: Record<string, { name: string; types: string[] }> = {};
        dynamicCategories.forEach(dc => {
            const nc = normalizeCategory(dc.category);
            if (STATIC_DOCUMENT_CATEGORIES[nc]) return;
            dynamic[nc] = { name: dc.name, types: dc.types };
        });
        return { ...STATIC_DOCUMENT_CATEGORIES, ...dynamic };
    }, [dynamicCategories]);

    const categoryOptions = useMemo(() => {
        return Object.entries(mergedCategories)
            .map(([category, { name, types }]) => ({
                value: category,
                label: `${name} (${category})`,
                name,
                totalTypes: types.length,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [mergedCategories]);

    const stockCategoryDetailMap = useMemo(() => {
        return Object.fromEntries(stockCategoryDetails.map((detail) => [detail.code, detail]));
    }, [stockCategoryDetails]);

    // ── Data fetching ──────────────────────────────────────────────────────

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
            notify('Isi semua field kategori.');
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
            notify(`Kategori ${code} berhasil disimpan.`);
            setNewCatCode('');
            setNewCatName('');
            setNewCatTypes('');
            await fetchDynamicCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            notify('Gagal menyimpan kategori.');
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
            notify(`Kategori ${catId} dihapus.`);
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
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                if (res.status === 503) {
                    setUserLimit({ count: 0, isLimited: false });
                    return;
                }
                throw new Error(data?.error || 'limit check failed');
            }

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
            const history: GeneratedResult[] = querySnapshot.docs.map(d => {
                const data = d.data() as {
                    fullNumber?: string;
                    assignedDocType?: string;
                    category?: string;
                    assignedDate?: string;
                };
                const rawNum = (data.fullNumber as string).replace('{DOCTYPE} ', '');
                return {
                    text: rawNum,
                    rawNumber: rawNum,
                    docType: data.assignedDocType || data.category || '-',
                    date: data.assignedDate ? new Date(data.assignedDate) : new Date()
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
        setIsStockLoading(true);
        try {
            const params = new URLSearchParams({ valueCategory });
            const res = await fetch(`/api/numbers/stock?${params.toString()}`);
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Tidak dapat memuat ringkasan stok.');
            }

            setStockPeriodsByYear((data?.periodsByYear ?? {}) as Record<string, string[]>);
            setStockYears(Array.isArray(data?.years) ? data.years : []);
            setStockCategories(Array.isArray(data?.categories) ? data.categories : Object.keys(mergedCategories));
            setStockCategoryDetails(Array.isArray(data?.categoryDetails) ? data.categoryDetails : []);
            setStockRawMatrix((data?.rawMatrix ?? {}) as StockMatrix);
            setStockMatrix((data?.matrix ?? {}) as StockMatrix);
        } catch (error) {
            console.error("Error fetching stock summary:", error);
            toast({
                variant: "destructive",
                title: "Gagal Mengambil Stok",
                description: getErrorMessage(error, "Tidak dapat memuat ringkasan stok."),
            });
        } finally {
            setIsStockLoading(false);
        }
    }, [toast, mergedCategories, valueCategory]);

    // ── Event handlers ─────────────────────────────────────────────────────

    const handleCategoryChange = (id: string, category: string) => {
        setRequests(prev => prev.map(req => {
            if (req.id !== id) return req;
            const availableTypes = mergedCategories[category]?.types ?? [];
            const currentDocTypeValid = availableTypes.includes(req.docType);
            let nextDocType = currentDocTypeValid ? req.docType : '';
            if (!nextDocType && availableTypes.length === 1) {
                nextDocType = availableTypes[0];
            }
            return { ...req, category, docType: nextDocType };
        }));
    };

    const handleDocTypeChange = (id: string, docType: string) => {
        if (!docType) return;
        setRequests(prev => {
            const currentRequest = prev.find(req => req.id === id);
            const category = currentRequest?.category;
            if (!category) return prev;

            const updated = prev.map(req =>
                req.id === id ? { ...req, docType } : req
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

    const addRequest = () => setRequests(prev => [...prev, createNewRequest()]);
    const removeRequest = (id: string) => setRequests(prev => prev.filter(req => req.id !== id));

    const handleGenerate = async () => {
        for (const req of requests) {
            if (!req.category || !req.docType || !req.docDate || req.quantity < 1) {
                notify('Input Tidak Lengkap: Periksa kembali baris permintaan.');
                return;
            }
        }

        if (totalQuantity > 100) {
            notify(`Total permintaan (${totalQuantity}) melebihi batas maksimum 100 per request.`);
            return;
        }

        setIsGenerating(true);
        setGeneratedNumbers([]);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            let idToken: string | undefined;
            if (user) idToken = await user.getIdToken();

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
                    notify(`Batas harian (${data.dailyLimit}) tercapai. Coba lagi besok.`);
                    setUserLimit({ count: data.dailyLimit, isLimited: true });
                } else if (res.status === 503) {
                    notify(data.error || 'Generator sementara belum siap di server.');
                } else {
                    notify(data.error || 'Generate gagal.');
                }
                return;
            }

            const generated: GeneratedResult[] = (data.results as Array<{
                text: string; rawNumber: string; date: string; docType: string; isError?: boolean;
            }>).map(r => ({ ...r, date: new Date(r.date) }));

            if (data.dailyLimit !== null) {
                setUserLimit({ count: data.dailyCount, isLimited: data.dailyCount >= data.dailyLimit });
            }

            if (user) await fetchMyHistory();

            const sortedGenerated = generated.sort((a, b) => a.date.getTime() - b.date.getTime());
            setGeneratedNumbers(sortedGenerated);

            const sc = generated.filter(r => !r.isError).length;
            if (sc > 0) {
                notify(`Berhasil! ${sc} nomor baru telah dibuat.`);
            } else {
                notify('Gagal! Tidak ada nomor yang tersedia untuk dibuat.');
            }
        } catch (error: unknown) {
            console.error("Error generating numbers:", error);
            notify(getErrorMessage(error, "Gagal membuat nomor. Terjadi kesalahan sistem."));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBulkInject = async () => {
        if (!firestore || !user || !isAdminUser) {
            notify("Akses ditolak: Anda tidak memiliki izin admin.");
            return;
        }
        if (!injectText.trim()) {
            notify("Daftar nomor kosong.");
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
                    const category = normalizeCategory(parts[1]);
                    const dateParts = parts[3].split('-');
                    if (dateParts.length === 2) {
                        const month = parseInt(dateParts[0], 10);
                        const year = parseInt(dateParts[1], 10);
                        if (!isNaN(month) && !isNaN(year)) {
                            const docId = `${category}-${year}-${month}-${injectValueCategory}-${sequence}`;
                            validNumbers.push({
                                id: docId,
                                data: {
                                    fullNumber: `{DOCTYPE} ${line}`,
                                    category,
                                    year,
                                    month,
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
                notify("Tidak ada format nomor yang valid.");
                setIsInjecting(false);
                return;
            }

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

            notify(`Berhasil! ${validNumbers.length} nomor berhasil disuntikkan.`);
            setInjectText('');
            setInjectProgress('');
        } catch (error: unknown) {
            console.error("Error bulk injecting:", error);
            notify(getErrorMessage(error, "Gagal melakukan injeksi nomor."));
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
                return `${index + 1}. ${result.docType} ${result.text} Tanggal ${format(result.date, 'd MMMM yyyy', { locale: idLocale })}`
            })
            .join('\n');
        navigator.clipboard.writeText(textToCopy);
        notify("Hasil lengkap berhasil disalin ke clipboard.");
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
            notify("Tidak ada nomor valid untuk disalin.");
            return;
        }
        navigator.clipboard.writeText(textToCopy);
        notify("Daftar nomor berhasil disalin.");
        setIsCopied('numbers');
        setTimeout(() => setIsCopied(null), 2000);
    };

    const copyItem = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        notify("Nomor disalin!");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCalendarMonthChange = (id: string, month: Date) => {
        setCalendarViewMonths(prev => ({ ...prev, [id]: month }));
    };

    return {
        // State
        requests, valueCategory, setValueCategory, isGenerating, generatedNumbers,
        isCopied, copiedIndex, myHistory, isHistoryLoading,
        isStockDialogOpen, setIsStockDialogOpen, stockMatrix, stockRawMatrix,
        stockPeriodsByYear, stockYears, stockCategories, stockCategoryDetails,
        isStockLoading, openDatePickerId, setOpenDatePickerId,
        calendarViewMonths,
        injectText, setInjectText, injectValueCategory, setInjectValueCategory,
        isInjecting, injectProgress,
        userLimit, isLimitLoading, isAdminUser,
        dynamicCategories, newCatCode, setNewCatCode, newCatName, setNewCatName,
        newCatTypes, setNewCatTypes, isSavingCat,

        // Derived
        isLoggedIn, remainingLimit, hasResults, successCount, failedCount, totalQuantity,
        mergedCategories, categoryOptions, stockCategoryDetailMap,

        // Actions
        fetchDynamicCategories, handleSaveDynamicCategory, handleDeleteDynamicCategory,
        fetchStockSummary, fetchMyHistory,
        handleCategoryChange, handleDocTypeChange, handleRequestChange,
        handleCalendarMonthChange,
        addRequest, removeRequest,
        handleGenerate, handleBulkInject, handleReset,
        copyFullResults, copyNumbersOnly, copyItem,
    };
}
