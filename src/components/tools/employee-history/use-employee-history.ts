'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNotification } from '@/hooks/use-notification';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import {
  type Pejabat,
  type DocQuery,
  type GeneratedResult,
  EMPLOYEE_HISTORY_COLLECTION,
  docRules,
  parseDate,
  tryParseDate,
  formatDate,
  formatDateForStorage,
  buildEmployeeDocId,
  parseEmployeeRows,
} from './types';

export function useEmployeeHistory(employeeData: string, locale: string) {
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
    if (!firestore) {
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
  }, [firestore, fallbackPejabat]);

  useEffect(() => {
    fetchAdminStatus();
  }, [fetchAdminStatus]);

  useEffect(() => {
    fetchFirestoreEmployees();
  }, [fetchFirestoreEmployees]);

  useEffect(() => {
    if (!firestore) {
      setAllPejabat(fallbackPejabat);
    }
  }, [firestore, fallbackPejabat]);

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

      // Parse date string as local time to avoid UTC midnight timezone shift
      // new Date('2026-05-02') would be parsed as UTC → wrong date in +07:00
      const [yyyy, mm, dd] = query.docDate.split('-').map(Number);
      const targetDate = new Date(yyyy, mm - 1, dd);
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
      notify(`${label} disalin`);
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
      notify('Auth belum siap. Silakan tunggu beberapa saat.');
      return;
    }
    initiateGoogleSignIn(auth);
  };

  const handleInjectEmployeeHistory = async () => {
    if (!firestore || !user || !isAdminUser) {
      notify('Akses ditolak: hanya admin yang bisa inject data.');
      return;
    }

    const parsedRows = parseEmployeeRows(injectText);
    if (parsedRows.length === 0) {
      notify('Format tidak valid. Gunakan tab-separated 6 kolom per baris.');
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

      notify(`Berhasil inject ${parsedRows.length} baris ke Firestore`);

      setInjectText('');
      await fetchFirestoreEmployees();
    } catch (error) {
      console.error('Inject employee history failed:', error);
      notify('Gagal inject data ke Firestore.');
    } finally {
      setIsInjecting(false);
    }
  };

  return {
    // State
    allPejabat, isDatasetLoading, isAdminUser, isAdminLoading,
    injectText, setInjectText, isInjecting,
    searchText, setSearchText, searchGrup, setSearchGrup,
    filteredPejabat, isSearching, copiedState,
    uniqueGrupJabatans,
    docQueries, generatedResults,

    // Handlers
    handleQueryChange, addQueryRow, removeQueryRow,
    handleGenerateSigners, handleCopy, handleCopyAllGenerated,
    handleGoogleLogin, handleInjectEmployeeHistory,
  };
}
