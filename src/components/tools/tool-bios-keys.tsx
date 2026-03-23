"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, AlertTriangle, Chrome, Search, KeyRound, Keyboard, Edit, Plus, Trash2, FileJson, Settings2, MonitorDown } from "lucide-react";
import { useNotification } from "@/hooks/use-notification";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import { cn } from "@/lib/utils";

export interface BiosKeyData {
  id?: string;
  brand: string;
  category: string;
  series: string;
  biosKey: string;
  bootKey: string;
  notes: string;
  notesEn?: string;   // English translation of notes (optional)
  searchTags: string[];
}

const COLLECTION_NAME = "bios_keys";

// Bilingual text content
const t = {
  en: {
    title: "BIOS & Boot Menu Key Finder",
    subtitle: "Instantly find the exact BIOS (UEFI) setup and Boot Menu keys for every laptop and motherboard brand.",
    searchPlaceholder: "Search by brand or model (e.g. ASUS, Legion, B11MOU)...",
    loading: "Reading from the secret memory vault...",
    emptyTitle: "Database Empty",
    emptyDesc: "No devices recorded yet. Use *Bulk Update* with JSON from ChatGPT/Gemini.",
    notFound: "No device found for",
    notFoundHint: "Try searching by generic brand name like \"Lenovo\" or \"Apple\".",
    biosLabel: "BIOS / UEFI",
    bootLabel: "Boot Menu",
    notesLabel: "Important Note",
    noNotes: "Standard instructions, no special steps.",
    allSeries: "All Product Lines",
    adminTitle: "Database Administrator (Live)",
    adminDesc: "You are a Super Admin. Add single entries or run a Bulk Inject/Update via JSON.",
    loginButton: "Login for Admin Access",
    analyzing: "Checking access...",
    bulkUpdate: "Bulk Update",
    addNew: "Add New Brand",
    editTitle: "Edit Specification Data",
    addTitle: "Add New Brand Entry",
    editDesc: "Manage the BIOS keys and SEO search tags for this entry. Changes are live.",
    fieldBrand: "Device Brand",
    fieldCategory: "Category",
    fieldSeries: "Product Series / Specific Model (Optional)",
    fieldBiosKey: "BIOS / UEFI Entry Key",
    fieldBootKey: "Boot Device Menu Key",
    fieldNotes: "Notes — Indonesian (ID)",
    fieldNotesEn: "Notes — English (EN)",
    fieldNotesEnHint: "If left blank, the Indonesian note above will be shown to English visitors as a fallback.",
    fieldTags: "SEO Search Keywords (comma-separated)",
    fieldTagsHint: "Critical: List all brand name variations so our search and Google can match them instantly.",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    bulkTitle: "Bulk Update / Mass Inject (via JSON)",
    bulkDesc: "Powerful feature to overwrite or inject dozens of new entries at once from Gemini/ChatGPT prompts. Please follow the JSON schema structure.",
    bulkJsonLabel: "JSON Array Script",
    bulkHint: "Supported keys: brand, category, series, biosKey, bootKey, notes, notesEn, searchTags [Array]. *System will auto-replace if Brand+Series match, or add new if they don't.*",
    cancelExec: "Cancel Execution",
    runBulk: "Run Bulk Inject",
    allCategories: "All",
    sortAZ: "A–Z",
    sortZA: "Z–A",
    sortNewest: "Latest",
  },
  id: {
    title: "Pencari Tombol BIOS & Boot Menu",
    subtitle: "Temukan kombinasi tombol krusial akses BIOS (UEFI) dan Boot Menu pada pabrikan laptop & motherboard dengan sekilas pandang.",
    searchPlaceholder: "Ketik merek/model spesifik (Cth: ASUS, Legion, B11MOU)...",
    loading: "Membaca pita gudang memori rahasia...",
    emptyTitle: "Gudang Kosong",
    emptyDesc: "Belum ada perangkat yang terekam. Gunakan *Bulk Update* menggunakan format JSON dari ChatGPT/Gemini.",
    notFound: "Tidak ada perangkat dengan merek atau seri",
    notFoundHint: "Mungkin Anda bisa cari nama generiknya seperti \"Lenovo\" atau \"Apple\".",
    biosLabel: "BIOS / UEFI",
    bootLabel: "Boot Menu",
    notesLabel: "Wajib Tahu",
    noNotes: "Instruksi murni standar.",
    allSeries: "Semua Produk Lini Tersedia",
    adminTitle: "Database Administrator (Live)",
    adminDesc: "Anda login sebagai Super Admin. Tambah data satuan atau lakukan eksekusi massal (Bulk Inject/Update) dengan JSON.",
    loginButton: "Login Akses Admin",
    analyzing: "Menganalisis akses...",
    bulkUpdate: "Bulk Update",
    addNew: "Tambah Merek Baru",
    editTitle: "Edit Data Spesifikasi",
    addTitle: "Suntik Merek Spesifik Baru",
    editDesc: "Atur tombol akses BIOS dan kata kunci mesin pencari (SEO) di sini. Perubahan tersimpan live.",
    fieldBrand: "Merek Perangkat",
    fieldCategory: "Kategori Spesifik",
    fieldSeries: "Seri Lini Produk / Tipe Identik (Opsional)",
    fieldBiosKey: "Kunci Masuk BIOS / UEFI",
    fieldBootKey: "Kunci Boot Device Menu",
    fieldNotes: "Catatan — Bahasa Indonesia (ID)",
    fieldNotesEn: "Catatan — Bahasa Inggris (EN)",
    fieldNotesEnHint: "Jika dikosongkan, catatan bahasa Indonesia di atas akan tampil sebagai fallback untuk pengunjung versi Inggris.",
    fieldTags: "Katakunci Sorotan SEO (Pisahkan dengan koma)",
    fieldTagsHint: "Ini krusial: Daftarkan semua variasi pemanggilan agar alat Search dan Google mampu mencocokkannya seketika.",
    cancel: "Batal",
    save: "Simpan",
    delete: "Hapus",
    bulkTitle: "Bulk Update / Mass Inject (via JSON)",
    bulkDesc: "Fitur mutakhir untuk menimpa massal atau menyuntikkan puluhan data baru sekaligus hasil dari prompt Gemini/ChatGPT. Harap patuhi struktur skema JSON murni.",
    bulkJsonLabel: "Teks Script Array JSON",
    bulkHint: "Kunci yang didukung: brand, category, series, biosKey, bootKey, notes, notesEn, searchTags [Array]. *Sistem akan otomatis me-replace jika Merek+Seri sama, atau menambah baru jika tidak.*",
    cancelExec: "Batalkan Eksekusi",
    runBulk: "Jalankan Bulk Inject",
    allCategories: "Semua",
    sortAZ: "A–Z",
    sortZA: "Z–A",
    sortNewest: "Terbaru",
  },
};

// Highlight matching query inside a string — uses split with capturing group (index-based, no stateful regex)
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-yellow-300/70 dark:bg-yellow-500/30 text-foreground not-italic rounded-sm px-0.5 font-bold">
        {part}
      </mark>
    ) : part
  );
}

export function ToolBiosKeys({ dictionary }: { dictionary?: any }) {
  const { notify } = useNotification();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  // Detect locale from dictionary context (fallback to "en")
  const locale: "en" | "id" = (dictionary?.locale || dictionary?._locale || "en") as "en" | "id";
  const lang = t[locale] || t.en;

  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const [dataKeys, setDataKeys] = useState<BiosKeyData[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulking, setIsBulking] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"az" | "za" | "newest">("az");

  const defaultForm: BiosKeyData = {
    brand: "", category: "Laptop", series: "", biosKey: "F2", bootKey: "F12", notes: "", notesEn: "", searchTags: []
  };
  const [formData, setFormData] = useState<BiosKeyData>(defaultForm);
  const [bulkJsonText, setBulkJsonText] = useState("");

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
    } catch {
      setIsAdminUser(false);
    } finally {
      setIsAdminLoading(false);
    }
  }, [firestore, user]);

  const fetchKeys = useCallback(async () => {
    if (!firestore) return;
    setIsFetching(true);
    try {
      const snapshot = await getDocs(collection(firestore, COLLECTION_NAME));
      if (!snapshot.empty) {
        const rows = snapshot.docs.map(docSnap => ({
          ...docSnap.data() as BiosKeyData,
          id: docSnap.id
        }));
        rows.sort((a, b) => a.brand.localeCompare(b.brand));
        setDataKeys(rows);
      } else {
        setDataKeys([]);
      }
    } catch (error) {
      console.error('Error fetching BIOS keys:', error);
    } finally {
      setIsFetching(false);
    }
  }, [firestore]);

  useEffect(() => {
    fetchAdminStatus();
    fetchKeys();
  }, [fetchAdminStatus, fetchKeys]);

  const handleOpenAdd = () => {
    setFormData(defaultForm);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: BiosKeyData) => {
    setFormData({ ...item });
    setIsAddEditModalOpen(true);
  };

  const handleOpenBulk = () => {
    setBulkJsonText("[\n  {\n    \"brand\": \"Brand Name\",\n    \"category\": \"Laptop\",\n    \"series\": \"Series 123\",\n    \"biosKey\": \"F2\",\n    \"bootKey\": \"F12\",\n    \"notes\": \"Special note...\",\n    \"searchTags\": [\"brand\", \"series\"]\n  }\n]");
    setIsBulkModalOpen(true);
  };

  const sanitizeId = (brand: string, series: string) => {
    return `${brand}-${series}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now().toString();
  };

  const handleSaveData = async () => {
    if (!firestore || !isAdminUser) return;
    if (!formData.brand.trim() || !formData.biosKey.trim()) {
      notify("Brand name and BIOS key are required", <AlertTriangle className="h-4 w-4" />);
      return;
    }

    setIsSaving(true);
    try {
      const docId = formData.id || sanitizeId(formData.brand, formData.series);
      const docRef = doc(firestore, COLLECTION_NAME, docId);

      const payload = {
        brand: formData.brand.trim(),
        category: formData.category.trim(),
        series: formData.series.trim(),
        biosKey: formData.biosKey.trim(),
        bootKey: formData.bootKey.trim(),
        notes: formData.notes.trim(),
        notesEn: formData.notesEn?.trim() || "",
        searchTags: Array.isArray(formData.searchTags) ? formData.searchTags : [],
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      notify(<span className="font-medium text-sm text-emerald-500">Data {payload.brand} saved successfully!</span>);
      setIsAddEditModalOpen(false);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      notify("Failed to save data", <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteData = async () => {
    if (!firestore || !isAdminUser || !formData.id) return;
    if (!confirm(`Delete ${formData.brand} - ${formData.series}?`)) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, COLLECTION_NAME, formData.id));
      notify(<span className="font-medium text-sm text-rose-500">Data deleted successfully!</span>);
      setIsAddEditModalOpen(false);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      notify("Failed to delete data", <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkInject = async () => {
    if (!firestore || !isAdminUser) return;
    setIsBulking(true);
    try {
      const parsedData = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsedData)) {
        throw new Error("JSON data must be an Array [...]");
      }

      const collectionRef = collection(firestore, COLLECTION_NAME);
      const batch = writeBatch(firestore);

      parsedData.forEach((item: any, index: number) => {
        if (!item.brand || !item.biosKey) return;
        const docId = item.id || sanitizeId(item.brand, item.series || String(index));
        const docRef = doc(collectionRef, docId);

        const payload = {
          brand: String(item.brand).trim(),
          category: String(item.category || "Laptop").trim(),
          series: String(item.series || "").trim(),
          biosKey: String(item.biosKey).trim(),
          bootKey: String(item.bootKey || "").trim(),
          notes: String(item.notes || "").trim(),
          notesEn: String(item.notesEn || "").trim(),
          searchTags: Array.isArray(item.searchTags) ? item.searchTags : [],
          updatedAt: new Date().toISOString()
        };
        batch.set(docRef, payload, { merge: true });
      });

      await batch.commit();
      notify(<span className="font-medium text-sm text-emerald-500">Bulk Update {parsedData.length} data successful!</span>);
      setIsBulkModalOpen(false);
      await fetchKeys();

    } catch (error: any) {
      console.error(error);
      notify(`Bulk Update Failed: ${error.message}`, <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsBulking(false);
    }
  };

  const lgSearch = searchQuery.toLowerCase().trim();

  const categories = useMemo(() => {
    const cats = new Set(dataKeys.map(item => item.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [dataKeys]);

  const filteredData = useMemo(() => {
    let result = dataKeys;

    // 1. Category filter
    if (selectedCategory !== "all") {
      result = result.filter(item => item.category === selectedCategory);
    }

    // 2. Search filter
    if (lgSearch) {
      result = result.filter(item => {
        const brandStr = (item.brand || "").toLowerCase();
        const seriesStr = (item.series || "").toLowerCase();
        const tagsStr = Array.isArray(item.searchTags) ? item.searchTags.join(" ").toLowerCase() : "";
        return brandStr.includes(lgSearch) || seriesStr.includes(lgSearch) || tagsStr.includes(lgSearch);
      });
    }

    // 3. Sort
    const sorted = [...result];
    if (sortMode === "az") sorted.sort((a, b) => a.brand.localeCompare(b.brand));
    else if (sortMode === "za") sorted.sort((a, b) => b.brand.localeCompare(a.brand));
    else if (sortMode === "newest") {
      sorted.sort((a, b) => {
        const da = (a as any).updatedAt || "";
        const db = (b as any).updatedAt || "";
        return db.localeCompare(da);
      });
    }
    return sorted;
  }, [dataKeys, lgSearch, selectedCategory, sortMode]);

  return (
    <div className="space-y-8 min-h-screen pb-10">

      {/* --- Admin Bar — matches ToolWrapper slim bar pattern --- */}
      {(isAdminLoading || isAdminUser || !user) && (
        <div className="flex items-center justify-between min-h-12 px-4 py-2 bg-muted/20 rounded-xl border border-border/40 overflow-hidden animate-in fade-in duration-300">
          {isAdminLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground w-full justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">{lang.analyzing}</span>
            </div>
          ) : !user ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <Database className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <p className="text-xs font-black uppercase tracking-tight text-muted-foreground/60 truncate">
                  Database Admin
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => auth && initiateGoogleSignIn(auth)}
                className="h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shrink-0"
              >
                <Chrome className="h-3 w-3" /> {lang.loginButton}
              </Button>
            </>
          ) : isAdminUser ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1 bg-primary/10 rounded-md shrink-0">
                  <Database className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs font-black uppercase tracking-tight text-primary truncate max-w-[160px]">
                  {lang.adminTitle}
                </p>
                <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black uppercase bg-primary/10 text-primary border-none shrink-0">
                  Super Admin
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenBulk}
                  className="h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1.5 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <FileJson className="h-3 w-3" /> {lang.bulkUpdate}
                </Button>
                <Button
                  size="sm"
                  onClick={handleOpenAdd}
                  className="h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1.5 shadow-sm shadow-primary/10"
                >
                  <Plus className="h-3 w-3" /> {lang.addNew}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* --- Hero Header --- */}
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-1">
          <MonitorDown className="h-3.5 w-3.5" />
          BIOS Key Reference Database
        </div>
        <h1 className="text-display-sm font-extrabold tracking-tight text-foreground font-display">
          {lang.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {lang.subtitle}
        </p>
      </div>

      {/* STICKY SEARCH BAR */}
      <div className="max-w-3xl mx-auto sticky top-24 z-30 pt-2 pb-4">
        <div className="relative group">
          <input
            type="text"
            className="w-full rounded-2xl border-2 border-primary/20 bg-background/80 backdrop-blur-xl px-6 py-5 pl-14 shadow-2xl shadow-primary/5 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 text-lg font-medium placeholder:font-normal placeholder:opacity-60"
            placeholder={lang.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none text-muted-foreground">
            <Search className="h-6 w-6 text-primary/70" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-5 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Clear</span>
            </button>
          )}
        </div>
        {dataKeys.length > 0 && (
          <p className="text-center text-xs text-muted-foreground/60 mt-2">
            {filteredData.length} of {dataKeys.length} {locale === "id" ? "perangkat" : "devices"} shown
          </p>
        )}
      </div>

      {/* --- Category Filter Chips + Sort Controls --- */}
      {dataKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between px-1 -mt-1">
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-muted/60 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
              )}
            >
              {lang.allCategories}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                    : "bg-muted/60 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(["az", "za", "newest"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  sortMode === mode
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {mode === "az" ? lang.sortAZ : mode === "za" ? lang.sortZA : lang.sortNewest}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50 mb-4" />
            <p className="text-lg">{lang.loading}</p>
          </div>
        ) : dataKeys.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed bg-card/30 p-16 text-center text-muted-foreground min-h-[400px] flex flex-col justify-center items-center">
            <AlertTriangle className="h-16 w-16 opacity-20 mb-4" />
            <h3 className="text-2xl font-bold text-foreground">{lang.emptyTitle}</h3>
            <p className="mt-2">{lang.emptyDesc}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Search className="h-16 w-16 opacity-10 mx-auto mb-4" />
            <p className="text-xl">{lang.notFound} <span className="text-foreground font-bold">"{searchQuery}"</span></p>
            <p className="mt-2 text-sm opacity-60">{lang.notFoundHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max px-2">
            {filteredData.map((item) => {
              const seed = getMulticolorSeed(item.brand, item.series);
              const theme = getMulticolorTheme(seed);

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "group relative overflow-hidden bg-card/40 backdrop-blur-md border border-border/50 shadow-sm transition-all duration-300 flex flex-col rounded-2xl ring-2 ring-transparent",
                    theme.hoverRing,
                    theme.hoverShadow
                  )}
                >
                  {/* Multicolor top accent bar */}
                  <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity", theme.gradient)} />

                  {/* Colorful overlay */}
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", theme.overlayGradient)} />

                  {/* Admin Quick Edit Button */}
                  {isAdminUser && (
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" onClick={() => handleOpenEdit(item)} className="h-8 w-8 rounded-full shadow-md bg-background hover:bg-primary/20 border border-primary/10">
                        <Settings2 className="h-4 w-4 text-foreground/70" />
                      </Button>
                    </div>
                  )}

                  <CardHeader className="p-6 pb-3 relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="uppercase text-[10px] tracking-widest font-black bg-muted text-muted-foreground w-max border-none rounded-md px-2 py-0.5">
                        {item.category}
                      </Badge>
                    </div>
                    <CardTitle className={cn("text-2xl font-black text-foreground tracking-tight transition-colors", theme.hoverTitle)}>
                      {highlightText(item.brand, searchQuery)}
                    </CardTitle>
                    <CardDescription className="font-semibold text-muted-foreground tracking-wide mt-1 text-sm">
                      {highlightText(item.series || lang.allSeries, searchQuery)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 flex flex-col flex-1 gap-4 relative">

                    {/* Key Display Blocks */}
                    <div className="flex flex-col gap-2.5">
                      {/* BIOS Key Row */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-background/60 border border-border/40 group-hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                          <KeyRound className="h-3.5 w-3.5 opacity-70 shrink-0" />
                          <span>{lang.biosLabel}</span>
                        </div>
                        <kbd className="inline-flex items-center px-2.5 py-1 text-sm font-bold text-foreground bg-muted border border-b-2 border-border/80 rounded-lg font-mono shadow-sm text-center break-words overflow-hidden min-w-0">
                          {item.biosKey || "-"}
                        </kbd>
                      </div>

                      {/* Boot Key Row */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-background/60 border border-border/40 transition-colors" style={{ borderColor: "rgb(6 182 212 / 0.2)" }}>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                          <Keyboard className="h-3.5 w-3.5 opacity-70 shrink-0" />
                          <span>{lang.bootLabel}</span>
                        </div>
                        <kbd className="inline-flex items-center px-2.5 py-1 text-sm font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-b-2 border-cyan-500/20 rounded-lg font-mono shadow-sm text-center break-words overflow-hidden min-w-0">
                          {item.bootKey || "-"}
                        </kbd>
                      </div>
                    </div>

                    {/* Notes Section — locale-aware, full text, no clamp */}
                    <div className="mt-auto pt-3 border-t border-border/30">
                      {(() => {
                        // For English locale: prefer notesEn, fallback to notes
                        // For Indonesian locale: always use notes
                        const displayNote =
                          locale === "en"
                            ? (item.notesEn?.trim() || item.notes)
                            : item.notes;
                        return displayNote ? (
                          <div className="flex gap-2.5">
                            <div className={cn("w-0.5 rounded-full shrink-0 mt-0.5 bg-gradient-to-b", theme.gradient)} />
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-widest text-primary/60 mb-1">
                                {lang.notesLabel}
                              </p>
                              <p className="text-[13px] leading-relaxed text-muted-foreground/90 group-hover:text-foreground/80 transition-colors">
                                {displayNote}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[13px] italic text-muted-foreground/40 pl-3">
                            {lang.noNotes}
                          </p>
                        );
                      })()}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Dialog 1: Add/Edit Single Data Form --- */}
      <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
        <DialogContent className="max-w-2xl sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              {formData.id ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-emerald-500" />}
              {formData.id ? lang.editTitle : lang.addTitle}
            </DialogTitle>
            <DialogDescription>
              {lang.editDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 mt-2">
            <div className="space-y-2">
              <Label className="font-bold">{lang.fieldBrand}</Label>
              <Input placeholder="Contoh: MSI / Example: MSI" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">{lang.fieldCategory}</Label>
              <Input placeholder="Laptop / Motherboard PC" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">{lang.fieldSeries}</Label>
              <Input placeholder="E.g. Katana, Raider, Modern, B11MOU" value={formData.series} onChange={e => setFormData({ ...formData, series: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-primary">{lang.fieldBiosKey}</Label>
              <Input placeholder="E.g. DEL or Hold F2" className="border-primary/30" value={formData.biosKey} onChange={e => setFormData({ ...formData, biosKey: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-cyan-600 dark:text-cyan-400">{lang.fieldBootKey}</Label>
              <Input placeholder="E.g. F11" className="border-cyan-500/30" value={formData.bootKey} onChange={e => setFormData({ ...formData, bootKey: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">{lang.fieldNotes}</Label>
              <Textarea placeholder="Cth: Matikan Secure Boot terlebih dahulu sebelum..." rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-sky-600 dark:text-sky-400">{lang.fieldNotesEn}</Label>
              <Textarea placeholder="E.g. Disable Secure Boot first before..." rows={3} value={formData.notesEn || ""} onChange={e => setFormData({ ...formData, notesEn: e.target.value })} className="border-sky-500/30" />
              <p className="text-[11px] text-muted-foreground">{lang.fieldNotesEnHint}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">{lang.fieldTags}</Label>
              <Input placeholder="msi, katana, b11mou, bios key" value={Array.isArray(formData.searchTags) ? formData.searchTags.join(', ') : formData.searchTags} onChange={e => setFormData({ ...formData, searchTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any })} />
              <p className="text-[11px] text-muted-foreground">{lang.fieldTagsHint}</p>
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col md:flex-row justify-between gap-3 border-t pt-6">
            {formData.id ? (
              <Button type="button" variant="destructive" onClick={handleDeleteData} disabled={isDeleting} className="w-full md:w-auto h-11">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />} {lang.delete}
              </Button>
            ) : <div />}
            <div className="flex gap-3 w-full md:w-auto">
              <Button type="button" variant="outline" onClick={() => setIsAddEditModalOpen(false)} className="w-full md:w-auto h-11">{lang.cancel}</Button>
              <Button type="button" onClick={handleSaveData} disabled={isSaving} className="w-full md:w-auto h-11 font-bold">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {lang.save}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog 2: Bulk JSON Update Form --- */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-3xl sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileJson className="h-5 w-5 text-emerald-500" /> {lang.bulkTitle}
            </DialogTitle>
            <DialogDescription>
              {lang.bulkDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 pb-2 mt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-bold">{lang.bulkJsonLabel} <code>[{"{"}...{"}"}]</code></Label>
              </div>
              <Textarea
                className="min-h-[300px] font-mono text-xs p-4 bg-muted/20 border-border/80"
                value={bulkJsonText}
                onChange={e => setBulkJsonText(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                {lang.bulkHint}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col md:flex-row justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)} className="w-full md:w-auto h-11">{lang.cancelExec}</Button>
            <Button type="button" onClick={handleBulkInject} disabled={isBulking || !bulkJsonText.includes("[")} className="w-full md:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/10">
              {isBulking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />} {lang.runBulk}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
