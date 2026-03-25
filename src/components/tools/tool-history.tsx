
'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { type Dictionary } from '@/lib/get-dictionary'
import { parse, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import { Search, FileText, UserCheck, Plus, Trash2, Loader2, Copy, CheckCircle2, Database, AlertTriangle, Chrome } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolWrapper } from '@/components/tools/tool-wrapper'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { useNotification } from '@/hooks/use-notification'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth, useFirestore, useUser } from '@/firebase'
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login'

// --- TYPE DEFINITIONS ---
interface Pejabat {
  grupJabatan: string;
  tglMulai: Date;
  tglSelesai: Date;
  nama: string;
  jabatan: string;
  nik: string;
}

interface DocRule {
  [key: string]: string[];
}

interface DocQuery {
  id: number;
  docType: string;
  docDate: string;
  projectValue: number;
}

interface GeneratedResult {
  [key: string]: Pejabat[];
}

const EMPLOYEE_HISTORY_COLLECTION = 'employee_history';

// --- CONSTANTS ---
const docRules: DocRule = {
  'ND UT': ['MGR KONSTRUKSI'],
  'BAUT LAUT': ['SM KONSTRUKSI', 'MGR KONSTRUKSI', 'GM'],
  'BA ABD': ['SM KONSTRUKSI', 'MGR KONSTRUKSI'],
  'BA REKON': ['MGR KONSTRUKSI', 'GM'],
  'BA MATERIAL': ['TL WH', 'MGR SS', 'SM KONSTRUKSI', 'MGR KONSTRUKSI'],
  'AMD PENUTUP': ['GM'],
  'BAST': ['GM'],
};

// --- HELPER FUNCTIONS ---
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split('/').map(Number);
  if (isNaN(year)) return new Date();
  if (year === 9999) return new Date(9999, 11, 31);
  return new Date(year, month - 1, day);
};

const tryParseDate = (text: string): Date | null => {
  if (!text) return null;
  const formats = ['d MMMM yyyy', 'd MMM yyyy', 'd MMMM', 'd MMM', 'd/M/yyyy', 'd/M/yy'];
  for (const format of formats) {
    try {
      const parsedDate = parse(text, format, new Date());
      if (isValid(parsedDate)) return parsedDate;
    } catch { }
  }
  return null;
};

const formatDate = (date: Date, locale: string = 'id-ID') => {
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

const formatDateForStorage = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

const formatDateKey = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${year}${month}${day}`;
};

const sanitizeIdPart = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'x';

const buildEmployeeDocId = (pejabat: Pejabat): string => {
  return [
    sanitizeIdPart(pejabat.nik),
    formatDateKey(pejabat.tglMulai),
    formatDateKey(pejabat.tglSelesai),
    sanitizeIdPart(pejabat.grupJabatan),
  ].join('_');
};

const parseEmployeeRows = (rawText: string): Pejabat[] => {
  if (!rawText) return [];

  return rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, idx) => {
      const parts = line.split('\t').map(part => part.trim());
      if (parts.length < 6) return null;

      const [grupJabatan, tglMulaiRaw, tglSelesaiRaw, nama, jabatan, ...nikParts] = parts;
      const nik = nikParts.join(' ').trim();

      const isHeader =
        idx === 0 &&
        /grup/i.test(grupJabatan) &&
        /mulai|start/i.test(tglMulaiRaw) &&
        /selesai|end/i.test(tglSelesaiRaw);
      if (isHeader) return null;

      const tglMulai = parseDate(tglMulaiRaw);
      const tglSelesai = parseDate(tglSelesaiRaw);
      if (!nama || isNaN(tglMulai.getTime()) || isNaN(tglSelesai.getTime())) return null;

      return {
        grupJabatan,
        tglMulai,
        tglSelesai,
        nama,
        jabatan,
        nik,
      };
    })
    .filter((item): item is Pejabat => Boolean(item));
};

export function ToolHistory({
  dictionary,
  employeeData,
  locale
}: {
  dictionary: Dictionary,
  employeeData: string,
  locale: string
}) {
  const { employeeHistory: t } = dictionary;
  const toolMeta = dictionary.tools.tool_list.employee_history;

  // Hooks
  const { notify } = useNotification();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const fallbackPejabat = useMemo<Pejabat[]>(() => parseEmployeeRows(employeeData), [employeeData]);
  const [allPejabat, setAllPejabat] = useState<Pejabat[]>(fallbackPejabat);
  const [isDatasetLoading, setIsDatasetLoading] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [injectText, setInjectText] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);

  // State for Employee History
  const [searchText, setSearchText] = useState<string>('');
  const [searchGrup, setSearchGrup] = useState<string>('all');
  const [filteredPejabat, setFilteredPejabat] = useState<Pejabat[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [copiedState, setCopiedState] = useState<{ id: string, type: string } | null>(null);

  const uniqueGrupJabatans = useMemo(() =>
    ['all', ...Array.from(new Set(allPejabat.map(p => p.grupJabatan)))]
    , [allPejabat]);

  const fetchAdminStatus = useCallback(async () => {
    if (!firestore || !user) {
      setIsAdminUser(false);
      setIsAdminLoading(false);
      return;
    }

    setIsAdminLoading(true);
    try {
      const adminDocRef = doc(firestore, 'roles_admin', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      setIsAdminUser(adminDocSnap.exists() && adminDocSnap.data()?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdminUser(false);
    } finally {
      setIsAdminLoading(false);
    }
  }, [firestore, user]);

  const fetchFirestoreEmployees = useCallback(async () => {
    if (!firestore || !user) {
      setAllPejabat(fallbackPejabat);
      setIsDatasetLoading(false);
      return;
    }

    setIsDatasetLoading(true);
    try {
      const snapshot = await getDocs(collection(firestore, EMPLOYEE_HISTORY_COLLECTION));
      if (snapshot.empty) {
        setAllPejabat(fallbackPejabat);
        return;
      }

      const rows = snapshot.docs
        .map(docSnap => docSnap.data())
        .map(data => ({
          grupJabatan: data.grupJabatan || '',
          tglMulai: parseDate(data.tglMulai || ''),
          tglSelesai: parseDate(data.tglSelesai || ''),
          nama: data.nama || '',
          jabatan: data.jabatan || '',
          nik: data.nik || '',
        }))
        .filter(row => row.nama);

      setAllPejabat(rows);
    } catch (error) {
      console.error('Error fetching Firestore employee history:', error);
      setAllPejabat(fallbackPejabat);
    } finally {
      setIsDatasetLoading(false);
    }
  }, [firestore, user, fallbackPejabat]);

  useEffect(() => {
    fetchAdminStatus();
  }, [fetchAdminStatus]);

  useEffect(() => {
    fetchFirestoreEmployees();
  }, [fetchFirestoreEmployees]);

  useEffect(() => {
    if (!firestore || !user) {
      setAllPejabat(fallbackPejabat);
    }
  }, [firestore, user, fallbackPejabat]);

  useEffect(() => {
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const parsedDate = tryParseDate(searchText);
      const lowerSearchText = (searchText || '').toLowerCase().trim();

      const results = allPejabat
        .filter(p => {
          const isGrupMatch = searchGrup === 'all' || p.grupJabatan === searchGrup;
          if (!isGrupMatch) return false;

          if (parsedDate) {
            return p.tglMulai <= parsedDate && p.tglSelesai >= parsedDate;
          } else if (lowerSearchText) {
            const searchTerms = lowerSearchText.split(' ').filter(term => term.length > 0);
            return searchTerms.every(term =>
              (p.nama || '').toLowerCase().includes(term) ||
              (p.nik || '').toLowerCase().includes(term) ||
              (p.jabatan || '').toLowerCase().includes(term) ||
              (p.grupJabatan || '').toLowerCase().includes(term)
            );
          } else {
            return true;
          }
        })
        .sort((a, b) => {
          const dateSort = b.tglSelesai.getTime() - a.tglSelesai.getTime();
          if (dateSort !== 0) return dateSort;
          const startSort = b.tglMulai.getTime() - a.tglMulai.getTime();
          if (startSort !== 0) return startSort;
          return (a.nama || '').localeCompare(b.nama || '');
        });

      setFilteredPejabat(results);
      setIsSearching(false);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [searchText, searchGrup, allPejabat]);

  // State for Document Signer Generator
  const [docQueries, setDocQueries] = useState<DocQuery[]>([{ id: Date.now(), docType: '', docDate: '', projectValue: 0 }]);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult>({});

  const handleQueryChange = (id: number, field: keyof DocQuery, value: string | number) => {
    setDocQueries(queries =>
      queries.map(q => q.id === id ? { ...q, [field]: value } : q)
    );
  };

  const addQueryRow = () => {
    setDocQueries(queries => [...queries, { id: Date.now(), docType: '', docDate: '', projectValue: 0 }]);
  };

  const removeQueryRow = (id: number) => {
    setDocQueries(queries => queries.filter(q => q.id !== id));
  };

  const handleGenerateSigners = () => {
    const results: GeneratedResult = {};
    docQueries.forEach(query => {
      if (!query.docType || !query.docDate) return;

      const targetDate = new Date(query.docDate);
      if (isNaN(targetDate.getTime())) return;

      let requiredGrups = docRules[query.docType] || [];

      if (['AMD PENUTUP', 'BAST'].includes(query.docType) && query.projectValue > 500000000) {
        requiredGrups = ['OSM'];
      }

      const signers = requiredGrups.flatMap(grup =>
        allPejabat.filter(p =>
          p.grupJabatan === grup && p.tglMulai <= targetDate && p.tglSelesai >= targetDate
        )
      );
      const key = `${query.docType} (${formatDate(targetDate, locale)})`;
      results[key] = signers;
    });
    setGeneratedResults(results);
  };

  const handleCopy = async (text: string, id: string, type: string, label: string) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiedState({ id, type });
      notify(
        <span className="font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {label} disalin
        </span>
      );
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyAllGenerated = (key: string, signers: Pejabat[]) => {
    if (!signers.length) return;
    const textToCopy = signers.map(s => `${s.nama}\n${s.jabatan}`).join('\n\n');
    handleCopy(textToCopy, key, 'all', 'Daftar penandatangan');
  };

  const handleGoogleLogin = () => {
    if (!auth) {
      notify('Auth belum siap. Silakan tunggu beberapa saat.', <AlertTriangle className="h-4 w-4" />);
      return;
    }
    initiateGoogleSignIn(auth);
  };

  const handleInjectEmployeeHistory = async () => {
    if (!firestore || !user || !isAdminUser) {
      notify('Akses ditolak: hanya admin yang bisa inject data.', <AlertTriangle className="h-4 w-4" />);
      return;
    }

    const parsedRows = parseEmployeeRows(injectText);
    if (parsedRows.length === 0) {
      notify('Format tidak valid. Gunakan tab-separated 6 kolom per baris.', <AlertTriangle className="h-4 w-4" />);
      return;
    }

    setIsInjecting(true);
    try {
      const collectionRef = collection(firestore, EMPLOYEE_HISTORY_COLLECTION);
      const incomingRows = parsedRows.map(pejabat => ({
        id: buildEmployeeDocId(pejabat),
        data: {
          grupJabatan: pejabat.grupJabatan,
          tglMulai: formatDateForStorage(pejabat.tglMulai),
          tglSelesai: formatDateForStorage(pejabat.tglSelesai),
          nama: pejabat.nama,
          jabatan: pejabat.jabatan,
          nik: pejabat.nik,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email || user.uid,
        },
      }));

      const incomingIds = new Set(incomingRows.map(row => row.id));
      const existingSnapshot = await getDocs(collectionRef);
      const existingIds = existingSnapshot.docs.map(docSnap => docSnap.id);
      const deleteIds = existingIds.filter(id => !incomingIds.has(id));

      const ops: Array<
        | { type: 'set'; id: string; data: Record<string, string> }
        | { type: 'delete'; id: string }
      > = [
        ...incomingRows.map(row => ({ type: 'set' as const, id: row.id, data: row.data })),
        ...deleteIds.map(id => ({ type: 'delete' as const, id })),
      ];

      const BATCH_SIZE = 450;
      for (let i = 0; i < ops.length; i += BATCH_SIZE) {
        const chunk = ops.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(firestore);
        for (const op of chunk) {
          const targetRef = doc(collectionRef, op.id);
          if (op.type === 'set') {
            batch.set(targetRef, op.data, { merge: true });
          } else {
            batch.delete(targetRef);
          }
        }
        await batch.commit();
      }

      notify(
        <span className="font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {`Berhasil inject ${parsedRows.length} baris ke Firestore`}
        </span>
      );

      setInjectText('');
      await fetchFirestoreEmployees();
    } catch (error) {
      console.error('Inject employee history failed:', error);
      notify('Gagal inject data ke Firestore.', <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <ToolWrapper
        title={toolMeta.title}
        description={toolMeta.description}
        dictionary={dictionary}
        isPublic={false}
      >
        <div className="space-y-12">
          {(isAdminLoading || isAdminUser) && (
            <ScrollReveal direction="up" delay={0.05}>
              <Card className="border bg-card/50 rounded-lg overflow-hidden shadow-sm border-primary/10 transition-all duration-300 hover:border-primary/20">
                <CardHeader className="border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl">Admin Data Injection</CardTitle>
                      <CardDescription>Paste data tab-separated: Grup, Tgl Mulai, Tgl Selesai, Nama, Jabatan, NIK</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {isAdminLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memeriksa hak akses admin...
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Data Karyawan (TSV)
                        </Label>
                        <Textarea
                          value={injectText}
                          onChange={(e) => setInjectText(e.target.value)}
                          placeholder={'Mgr Finance\t01/02/2026\t31/12/9999\tAZHARY AGUNG KURNIA\tMgr Business Support Area Sumatera\t925598'}
                          className="min-h-40 font-mono text-xs"
                        />
                      </div>
                      <Button
                        onClick={handleInjectEmployeeHistory}
                        disabled={isInjecting || !injectText.trim()}
                        className="rounded-lg"
                      >
                        {isInjecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Injecting...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Inject ke Firestore
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

          {/* Search Section */}
          <ScrollReveal direction="up" delay={0.1}>
            <Card className="border bg-card/50 rounded-lg overflow-hidden shadow-sm border-primary/10 transition-all duration-300 hover:border-primary/20">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">{t.searchTitle}</CardTitle>
                    <CardDescription>{t.searchDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.searchPlaceholder}
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      className="pl-10 h-11 rounded-lg bg-background/50 border-muted focus-visible:ring-primary/20"
                    />
                    {(isSearching || isDatasetLoading) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <Select value={searchGrup} onValueChange={setSearchGrup}>
                    <SelectTrigger className="w-full md:w-60 h-11 rounded-lg bg-background/50 border-muted">
                      <SelectValue placeholder={t.groupPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {uniqueGrupJabatans.map(grup => (
                        <SelectItem key={grup} value={grup}>{grup === 'all' ? t.allGroups : grup}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative rounded-lg border bg-background/50 overflow-hidden min-h-100 flex flex-col">
                  <div className="overflow-x-auto flex-1">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="sticky left-0 z-20 bg-card font-bold py-4 pl-6 min-w-50 border-r">
                            {t.nameHeader}
                          </TableHead>
                          <TableHead className="font-bold px-4">{t.positionHeader}</TableHead>
                          <TableHead className="font-bold px-4">{t.groupHeader}</TableHead>
                          <TableHead className="font-bold px-4">{t.nikHeader}</TableHead>
                          <TableHead className="font-bold px-4">{t.startDateHeader}</TableHead>
                          <TableHead className="font-bold px-4 whitespace-nowrap">{t.endDateHeader}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPejabat.map((p, i) => {
                          const isActive = p.tglSelesai.getFullYear() === 9999;
                          return (
                            <tr
                              key={`${p.nik}-${i}`}
                              className={cn(
                                "border-b transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300",
                                isActive ? 'bg-primary/[0.04] hover:bg-primary/[0.10]' : 'hover:bg-accent/10 border-transparent hover:border-primary/15'
                              )}
                            >
                              <TableCell className="sticky left-0 z-10 bg-card py-4 pl-6 font-semibold border-r min-w-50">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopy(p.nama, p.nik, 'nama', 'Nama')}
                                      className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                    >
                                      <span className="truncate">{p.nama}</span>
                                      {copiedState?.id === p.nik && copiedState?.type === 'nama' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200">Klik untuk menyalin</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="text-muted-foreground px-4 text-xs md:text-sm">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopy(p.jabatan, p.nik, 'jabatan', 'Jabatan')}
                                      className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                    >
                                      <span className="line-clamp-2 leading-relaxed">{p.jabatan}</span>
                                      {copiedState?.id === p.nik && copiedState?.type === 'jabatan' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200 shadow-sm border-primary/10">Klik untuk menyalin</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="px-4">
                                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold tracking-wider uppercase text-muted-foreground border">
                                  {p.grupJabatan}
                                </span>
                              </TableCell>
                              <TableCell className="font-code text-xs tracking-wider px-4 opacity-70">{p.nik}</TableCell>
                              <TableCell className="font-code text-xs whitespace-nowrap px-4 opacity-70">{formatDate(p.tglMulai, locale)}</TableCell>
                              <TableCell className={cn("font-code text-xs whitespace-nowrap px-4", isActive ? "text-primary font-bold" : "opacity-70")}>
                                {isActive ? t.present : formatDate(p.tglSelesai, locale)}
                              </TableCell>
                            </tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {(isSearching || isDatasetLoading) && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] gap-3 animate-in fade-in duration-200">
                      <div className="p-4 bg-background rounded-full shadow-xl border border-primary/10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-primary animate-pulse bg-background/80 px-3 py-1 rounded-full shadow-sm border">
                        Searching...
                      </span>
                    </div>
                  )}

                  {!isSearching && filteredPejabat.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-muted-foreground bg-muted/5 gap-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="p-4 bg-muted/20 rounded-full">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <p className="italic text-sm">No matching records found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Generator Section */}
          <ScrollReveal direction="up" delay={0.2}>
            <Card className="border bg-card/50 rounded-lg overflow-hidden shadow-sm border-primary/10 transition-all duration-300 hover:border-primary/20">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">{t.generatorTitle}</CardTitle>
                    <CardDescription>{t.generatorDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {docQueries.map((query) => (
                    <div key={query.id} className="flex flex-col md:flex-row items-end gap-4 p-5 border rounded-lg bg-background/30 relative group transition-all hover:border-primary/30 hover:bg-accent/5">
                      <div className="w-full md:flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.docTypePlaceholder}</label>
                        <Select value={query.docType} onValueChange={value => handleQueryChange(query.id, 'docType', value)}>
                          <SelectTrigger className="h-11 rounded-lg bg-background/50 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {Object.keys(docRules).map(doc => <SelectItem key={doc} value={doc}>{doc}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full md:flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.startDateHeader}</label>
                        <Input type="date" value={query.docDate} onChange={e => handleQueryChange(query.id, 'docDate', e.target.value)} className="h-11 rounded-lg bg-background/50 focus-visible:ring-primary/20" />
                      </div>
                      {(query.docType === 'AMD PENUTUP' || query.docType === 'BAST') && (
                        <div className="w-full md:flex-1 space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.projectValuePlaceholder}</label>
                          <Input type="number" value={query.projectValue} onChange={e => handleQueryChange(query.id, 'projectValue', parseInt(e.target.value))} className="h-11 rounded-lg bg-background/50 focus-visible:ring-primary/20" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQueryRow(query.id)}
                        disabled={docQueries.length <= 1}
                        className="rounded-full hover:bg-destructive/12 hover:text-destructive transition-colors shrink-0 mb-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button onClick={addQueryRow} variant="outline" className="flex-1 rounded-lg h-12 border-dashed border-primary/30 hover:border-primary/40 hover:bg-accent/10 transition-colors">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Document
                  </Button>
                  <Button onClick={handleGenerateSigners} className="flex-1 rounded-lg h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <UserCheck className="mr-2 h-4 w-4" /> Generate Signers
                  </Button>
                </div>

                {Object.keys(generatedResults).length > 0 && (
                  <div className="mt-16 space-y-8">
                    <ScrollReveal direction="up">
                      <div className="flex items-center gap-3 border-b border-primary/20 pb-4">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-display text-2xl font-bold tracking-tight">Generated Results</h3>
                      </div>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 gap-8">
                      {Object.entries(generatedResults).map(([key, signers], index) => (
                        <ScrollReveal key={key} delay={index * 0.1} direction="up">
                          <div className="space-y-4 relative group/result">
                            <div className="flex items-center justify-between gap-4">
                              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold tracking-tight shadow-md">
                                {key}
                              </div>
                              {signers.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyAllGenerated(key, signers)}
                                  className={cn(
                                    "h-8 text-xs font-semibold gap-2 opacity-0 group-hover/result:opacity-100 transition-all border-primary/20 hover:border-primary/35 hover:bg-accent/10",
                                    copiedState?.id === key && copiedState?.type === 'all' && "opacity-100 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                  )}
                                >
                                  {copiedState?.id === key && copiedState?.type === 'all' ? (
                                    <><CheckCircle2 className="h-3.5 w-3.5" /> Tersalin</>
                                  ) : (
                                    <><Copy className="h-3.5 w-3.5" /> Copy All</>
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="overflow-hidden border border-primary/10 rounded-lg bg-background/40 backdrop-blur-sm shadow-sm transition-all hover:border-primary/30 hover:bg-accent/[0.03]">
                              <Table>
                                <TableHeader className="bg-muted/30">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold py-4 pl-6 w-30">{t.groupHeader}</TableHead>
                                    <TableHead className="font-bold">{t.nameHeader}</TableHead>
                                    <TableHead className="font-bold">{t.positionHeader}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {signers.length > 0 ? signers.map((p, i) => (
                                    <TableRow key={`${p.nik}-${i}`} className="hover:bg-accent/10 transition-colors">
                                      <TableCell className="pl-6">
                                        <Badge variant="outline" className="rounded-md uppercase text-[10px] tracking-wider font-bold bg-background/50">{p.grupJabatan}</Badge>
                                      </TableCell>
                                      <TableCell className="font-semibold text-primary">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => handleCopy(p.nama, `${key}-${i}`, 'gen-nama', 'Nama')}
                                              className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                            >
                                              <span className="truncate">{p.nama}</span>
                                              {copiedState?.id === `${key}-${i}` && copiedState?.type === 'gen-nama' ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                              ) : (
                                                <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                              )}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200 shadow-sm border-primary/10">Klik untuk menyalin</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-sm">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => handleCopy(p.jabatan, `${key}-${i}`, 'gen-jabatan', 'Jabatan')}
                                              className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                            >
                                              <span className="line-clamp-2 leading-relaxed">{p.jabatan}</span>
                                              {copiedState?.id === `${key}-${i}` && copiedState?.type === 'gen-jabatan' ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                              ) : (
                                                <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                              )}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200 shadow-sm border-primary/10">Klik untuk menyalin</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  )) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic bg-muted/5">No signers found for this date.</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </ToolWrapper>
    </TooltipProvider>
  )
}
