"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, AlertTriangle, Search, KeyRound, Keyboard, Edit, Plus, Trash2, FileJson, Settings2, Copy, Check, ChevronRight, ArrowLeft, X, Cpu, Sparkles, CornerDownLeft, Download } from "lucide-react";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { useNotification } from "@/hooks/use-notification";
import { getMulticolorSeed, getMulticolorTheme } from "@/lib/multicolor";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/get-dictionary";

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
  updatedAt?: string;
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
    exportLabel: "Export",
    exportHint: "Download all entries as JSON (Bulk-Update compatible)",
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
    popularTitle: "Popular brands",
    popularHint: "Jump straight to the most referenced brands",
    browseAllTitle: "All devices",
    backToSearch: "Back",
    relatedTitle: (brand: string) => `Other ${brand} models`,
    modelCount: (n: number) => `${n} ${n === 1 ? "model" : "models"}`,
    searchStats: (d: number, b: number) => `${d} devices · ${b} brands`,
    kbdHint: "to navigate",
    kbdSelect: "to select",
    kbdClose: "to close",
    resultsFor: (q: string) => `Results for "${q}"`,
    popular: "Popular",
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
    exportLabel: "Ekspor",
    exportHint: "Unduh semua data sebagai JSON (kompatibel Bulk Update)",
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
    popularTitle: "Merek populer",
    popularHint: "Langsung buka merek yang paling banyak dicari",
    browseAllTitle: "Semua perangkat",
    backToSearch: "Kembali",
    relatedTitle: (brand: string) => `Model ${brand} lainnya`,
    modelCount: (n: number) => `${n} model`,
    searchStats: (d: number, b: number) => `${d} perangkat · ${b} merek`,
    kbdHint: "untuk navigasi",
    kbdSelect: "untuk pilih",
    kbdClose: "untuk tutup",
    resultsFor: (q: string) => `Hasil untuk "${q}"`,
    popular: "Populer",
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

// ══════════════════════════════════════════════════════════════
// DetailView — focused panel shown when a device is selected
// ══════════════════════════════════════════════════════════════
interface DetailViewProps {
  item: BiosKeyData;
  related: BiosKeyData[];
  onBack: () => void;
  onSelectRelated: (item: BiosKeyData) => void;
  onEdit?: () => void;
  lang: typeof t.en;
  locale: "en" | "id";
  copiedId: string | null;
  onCopy: (text: string, copyId: string) => void;
}

function KeyCap({
  label,
  value,
  accent,
  copied,
  onCopy,
  icon,
}: {
  label: string;
  value: string;
  accent: "primary" | "cyan";
  copied: boolean;
  onCopy: () => void;
  icon: React.ReactNode;
}) {
  const accentCls = accent === "primary"
    ? "text-foreground border-border/70"
    : "text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
  const hoverCls = accent === "primary"
    ? "hover:text-primary hover:bg-primary/10"
    : "hover:text-cyan-500 hover:bg-cyan-500/10";
  return (
    <div className="flex-1 flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl border border-border/40 bg-gradient-to-b from-card/80 to-card/30">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
        {icon} {label}
      </div>
      <kbd className={cn(
        "block font-black font-mono text-3xl sm:text-4xl bg-background border border-b-[6px] rounded-2xl px-6 py-4 sm:px-8 sm:py-5 shadow-lg shadow-black/5 whitespace-nowrap max-w-full overflow-hidden text-ellipsis",
        accentCls
      )}>
        {value || "—"}
      </kbd>
      <button
        onClick={onCopy}
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md text-muted-foreground/70 transition-all active:scale-95",
          hoverCls
        )}
      >
        {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
      </button>
    </div>
  );
}

function DetailView({ item, related, onBack, onSelectRelated, onEdit, lang, locale, copiedId, onCopy }: DetailViewProps) {
  const seed = getMulticolorSeed(item.brand, item.series);
  const theme = getMulticolorTheme(seed);
  const displayNote = locale === "en"
    ? (item.notesEn?.trim() || item.notes)
    : item.notes;
  const hasNote = Boolean(displayNote);

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Back bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {lang.backToSearch}
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" /> {lang.editTitle.split(" ")[0]}
          </button>
        )}
      </div>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 shadow-xl shadow-black/5 p-6 sm:p-10">
        <div className={cn("pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl opacity-20 bg-gradient-to-br", theme.gradient)} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className={cn("w-1.5 self-stretch rounded-full bg-gradient-to-b min-h-[56px]", theme.gradient)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="uppercase text-[9px] tracking-widest font-black bg-muted/70 text-muted-foreground/80 border-none rounded px-2 py-0.5">
                  {item.category}
                </Badge>
                {item.updatedAt && (
                  <span className="text-[10px] text-muted-foreground/50 font-medium">
                    {new Date(item.updatedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              <h2 className={cn("font-black text-3xl sm:text-4xl uppercase tracking-tight leading-tight text-foreground", theme.hoverTitle)}>
                {item.brand}
              </h2>
              {item.series ? (
                <p className="text-base text-muted-foreground font-medium mt-1">{item.series}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground/50 mt-1">{lang.allSeries}</p>
              )}
            </div>
          </div>

          {/* Keycaps */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <KeyCap
              label={lang.biosLabel}
              value={item.biosKey}
              accent="primary"
              copied={copiedId === `${item.id}-bios`}
              onCopy={() => onCopy(item.biosKey, `${item.id}-bios`)}
              icon={<KeyRound className="h-3 w-3" />}
            />
            <KeyCap
              label={lang.bootLabel}
              value={item.bootKey}
              accent="cyan"
              copied={copiedId === `${item.id}-boot`}
              onCopy={() => onCopy(item.bootKey, `${item.id}-boot`)}
              icon={<Keyboard className="h-3 w-3" />}
            />
          </div>

          {/* Notes */}
          {hasNote ? (
            <div className="flex gap-3 p-4 rounded-xl bg-primary/[0.04] border border-primary/15">
              <div className={cn("w-0.5 self-stretch rounded-full shrink-0 bg-gradient-to-b", theme.gradient)} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1.5">
                  {lang.notesLabel}
                </p>
                <p className="text-[13.5px] leading-relaxed text-foreground/85">
                  {displayNote}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[12px] italic text-muted-foreground/40 text-center py-2">{lang.noNotes}</p>
          )}
        </div>
      </div>

      {/* Related items */}
      {related.length > 0 && (
        <section className="mt-8">
          <header className="flex items-center gap-2 mb-3 px-1">
            <Cpu className="h-4 w-4 text-muted-foreground/60" />
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
              {lang.relatedTitle(item.brand)}
            </h3>
            <span className="text-[11px] text-muted-foreground/50 tabular-nums ml-auto">{related.length}</span>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-2xl border border-border/40 bg-card/20 p-2">
            {related.map(r => {
              const rSeed = getMulticolorSeed(r.brand, r.series);
              const rTheme = getMulticolorTheme(rSeed);
              return (
                <li key={r.id}>
                  <button
                    onClick={() => onSelectRelated(r)}
                    className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("w-0.5 self-stretch rounded-full shrink-0 bg-gradient-to-b min-h-[28px]", rTheme.gradient)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[12.5px] text-foreground/90 leading-tight truncate">
                        {r.series || r.brand}
                      </p>
                      <p className="text-[10.5px] text-muted-foreground/55 font-medium mt-0.5 truncate">
                        BIOS: {r.biosKey} · Boot: {r.bootKey || "—"}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ToolBiosKeys({ dictionary }: { dictionary?: Dictionary }) {
  const { notify } = useNotification();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  // Detect locale from dictionary context (fallback to "en")
  const locale: "en" | "id" = ((dictionary as unknown as Record<string, unknown>)?._locale as string || "en") === "id" ? "id" : "en";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BiosKeyData | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopyKey = useCallback((text: string, copyId: string) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(copyId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      notify(locale === "id" ? "Gagal menyalin." : "Copy failed.");
    });
  }, [notify, locale]);

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

  const handleExport = useCallback(() => {
    if (dataKeys.length === 0) {
      notify("No data to export", <AlertTriangle className="h-4 w-4" />);
      return;
    }
    // Produce a clean payload matching Bulk Update schema — strip `id` so merge uses brand+series
    const payload = dataKeys
      .slice()
      .sort((a, b) => a.brand.localeCompare(b.brand) || a.series.localeCompare(b.series))
      .map(({ brand, category, series, biosKey, bootKey, notes, notesEn, searchTags, updatedAt }) => ({
        brand, category, series, biosKey, bootKey, notes,
        notesEn: notesEn || "",
        searchTags: Array.isArray(searchTags) ? searchTags : [],
        ...(updatedAt ? { updatedAt } : {}),
      }));

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const ts = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bios-keys-backup-${ts}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify(<span className="font-medium text-sm text-emerald-500">Exported {payload.length} entries</span>);
  }, [dataKeys, notify]);

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

      parsedData.forEach((item: Record<string, unknown>, index: number) => {
        if (!item.brand || !item.biosKey) return;
        const docId = (item.id as string) || sanitizeId(String(item.brand), String(item.series || index));
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

    } catch (error: unknown) {
      console.error(error);
      notify(`Bulk Update Failed: ${error instanceof Error ? error.message : String(error)}`, <AlertTriangle className="h-4 w-4" />);
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

    // 3. Sort — when searching, rank exact brand/series prefix matches higher
    const sorted = [...result];
    if (lgSearch) {
      sorted.sort((a, b) => {
        const score = (item: BiosKeyData) => {
          const brand = (item.brand || "").toLowerCase();
          const series = (item.series || "").toLowerCase();
          if (brand === lgSearch) return 0;
          if (brand.startsWith(lgSearch)) return 1;
          if (series.startsWith(lgSearch)) return 2;
          if (brand.includes(lgSearch)) return 3;
          if (series.includes(lgSearch)) return 4;
          return 5;
        };
        const diff = score(a) - score(b);
        return diff !== 0 ? diff : a.brand.localeCompare(b.brand);
      });
    } else {
      sorted.sort((a, b) => a.brand.localeCompare(b.brand) || a.series.localeCompare(b.series));
    }
    return sorted;
  }, [dataKeys, lgSearch, selectedCategory]);

  // Popular brands (idle state) — grouped by brand, top by model count
  const popularBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    dataKeys.forEach(d => {
      if (selectedCategory !== "all" && d.category !== selectedCategory) return;
      counts[d.brand] = (counts[d.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([brand, count]) => ({ brand, count }));
  }, [dataKeys, selectedCategory]);

  // Related items for detail view (same brand, different model)
  const relatedItems = useMemo(() => {
    if (!selectedItem) return [];
    return dataKeys
      .filter(d => d.brand === selectedItem.brand && d.id !== selectedItem.id)
      .slice(0, 8);
  }, [selectedItem, dataKeys]);

  // Reset active index when search changes
  useEffect(() => { setActiveIndex(0); }, [lgSearch, selectedCategory]);

  // Keyboard navigation (arrow keys / enter / esc / ⌘K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K — focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (selectedItem) setSelectedItem(null);
        searchInputRef.current?.focus();
        return;
      }
      if (selectedItem) {
        if (e.key === 'Escape') setSelectedItem(null);
        return;
      }
      if (!searchQuery) {
        if (e.key === 'Escape') searchInputRef.current?.blur();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, Math.max(0, filteredData.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const item = filteredData[activeIndex];
        if (item) {
          e.preventDefault();
          setSelectedItem(item);
        }
      } else if (e.key === 'Escape') {
        setSearchQuery("");
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchQuery, filteredData, activeIndex, selectedItem]);

  const toolMeta = dictionary?.tools?.tool_list?.bios_keys;

  return (
    <ToolWrapper
      title={toolMeta?.title || lang.title}
      description={toolMeta?.description || lang.subtitle}
      dictionary={dictionary!}
      isPublic={true}
    >
    <div className="space-y-4 pb-10">

      {/* --- Admin Bar — only visible to active admins --- */}
      {isAdminUser && !isAdminLoading && (
        <div className="flex items-center justify-between min-h-12 px-4 py-2 bg-muted/20 rounded-xl border border-border/40 overflow-hidden animate-in fade-in duration-300">
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
              onClick={handleExport}
              disabled={dataKeys.length === 0}
              className="h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1.5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              title={lang.exportHint}
            >
              <Download className="h-3 w-3" /> {lang.exportLabel}
            </Button>
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
        </div>
      )}

      {/* ═══ COMMAND PALETTE LAYOUT ═══ */}
      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/50">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50 mb-3" />
          <p className="text-sm">{lang.loading}</p>
        </div>
      ) : dataKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground text-center px-8 rounded-2xl border border-dashed border-border/40">
          <AlertTriangle className="h-12 w-12 opacity-15 mb-3" />
          <h3 className="text-xl font-bold text-foreground">{lang.emptyTitle}</h3>
          <p className="mt-1 text-sm opacity-70">{lang.emptyDesc}</p>
        </div>
      ) : selectedItem ? (
        <DetailView
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
          onSelectRelated={(it) => setSelectedItem(it)}
          onEdit={isAdminUser ? () => handleOpenEdit(selectedItem) : undefined}
          related={relatedItems}
          lang={lang}
          locale={locale}
          copiedId={copiedId}
          onCopy={handleCopyKey}
        />
      ) : (
        <>
          {/* ── Hero Spotlight Search ─────────────────────────── */}
          <div className="relative max-w-3xl mx-auto w-full pt-2 sm:pt-6">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -inset-x-8 -inset-y-4 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10 blur-3xl opacity-70 -z-10" />

            <div className={cn(
              "group relative flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 bg-background/90 backdrop-blur-md border-2 rounded-2xl shadow-xl shadow-black/5 transition-all",
              searchQuery ? "border-primary/40 shadow-primary/10" : "border-border/60 hover:border-border"
            )}>
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                className="flex-1 bg-transparent outline-none text-base sm:text-lg font-medium placeholder:text-muted-foreground/40 min-w-0"
                placeholder={lang.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 shrink-0 px-2 py-1 text-[10px] font-mono font-black bg-muted/70 text-muted-foreground border border-border/60 rounded-md">
                {searchQuery ? "ESC" : <><span className="text-sm leading-none">⌘</span>K</>}
              </kbd>
            </div>

            {/* Stats / Kbd hints */}
            <div className="flex items-center justify-between gap-3 px-2 mt-3 text-[11px] text-muted-foreground/60">
              <p className="font-medium tabular-nums">
                {searchQuery
                  ? <span><span className="text-foreground/70 font-black">{filteredData.length}</span> / {dataKeys.length}</span>
                  : lang.searchStats(dataKeys.length, new Set(dataKeys.map(d => d.brand)).size)
                }
              </p>
              {searchQuery && filteredData.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-muted/60 border border-border/50 rounded">↑↓</kbd>
                    {lang.kbdHint}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-muted/60 border border-border/50 rounded inline-flex items-center">
                      <CornerDownLeft className="h-2.5 w-2.5" />
                    </kbd>
                    {lang.kbdSelect}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Results / Idle ───────────────────────────────── */}
          {searchQuery ? (
            <div className="max-w-3xl mx-auto w-full">
              {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center px-8 rounded-2xl border border-dashed border-border/40">
                  <Search className="h-12 w-12 opacity-10 mb-3" />
                  <p className="text-base font-medium">{lang.notFound} <span className="text-foreground font-black">&quot;{searchQuery}&quot;</span></p>
                  <p className="mt-1 text-sm opacity-60">{lang.notFoundHint}</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-3 pb-2">
                    {lang.resultsFor(searchQuery)}
                  </p>
                  <ul className="flex flex-col gap-1 rounded-2xl border border-border/40 bg-card/20 p-2 max-h-[560px] overflow-y-auto">
                    {filteredData.map((item, idx) => {
                      const seed = getMulticolorSeed(item.brand, item.series);
                      const theme = getMulticolorTheme(seed);
                      const isActive = activeIndex === idx;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                              isActive ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/40"
                            )}
                          >
                            <div className={cn("w-1 self-stretch rounded-full shrink-0 bg-gradient-to-b min-h-[36px]", theme.gradient)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={cn("font-black text-[14px] text-foreground leading-tight", theme.hoverTitle)}>
                                  {highlightText(item.brand, searchQuery)}
                                </p>
                                <Badge variant="secondary" className="uppercase text-[8px] tracking-widest font-black bg-muted/70 text-muted-foreground/80 border-none rounded px-1.5 py-0 h-4">
                                  {item.category}
                                </Badge>
                              </div>
                              {item.series ? (
                                <p className="text-[11px] text-muted-foreground/60 font-medium mt-0.5 truncate">
                                  {highlightText(item.series, searchQuery)}
                                </p>
                              ) : (
                                <p className="text-[10px] italic text-muted-foreground/30 mt-0.5">{lang.allSeries}</p>
                              )}
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                              <kbd className="font-black font-mono text-[11px] text-foreground bg-background border border-b-2 border-border/60 rounded px-2 py-0.5 whitespace-nowrap">
                                {item.biosKey || "—"}
                              </kbd>
                              <span className="text-muted-foreground/25 text-[9px]">/</span>
                              <kbd className="font-black font-mono text-[11px] text-cyan-700 dark:text-cyan-300 bg-background border border-b-2 border-cyan-500/25 rounded px-2 py-0.5 whitespace-nowrap">
                                {item.bootKey || "—"}
                              </kbd>
                            </div>
                            <ChevronRight className={cn(
                              "h-4 w-4 shrink-0 transition-all",
                              isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/30"
                            )} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto w-full space-y-8 pt-2">
              {/* Category filter pills */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {[
                    { key: "all", label: lang.allCategories, count: dataKeys.length },
                    ...categories.map(cat => ({ key: cat, label: cat, count: dataKeys.filter(d => d.category === cat).length }))
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={cn(
                        "px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-full transition-all border",
                        selectedCategory === key
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                          : "border-border/50 text-muted-foreground/70 hover:text-foreground hover:border-border bg-background/50"
                      )}
                    >
                      {label} <span className="opacity-60 tabular-nums">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular brands tiles */}
              {popularBrands.length > 0 && (
                <section>
                  <header className="flex items-baseline justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary/60" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{lang.popularTitle}</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 hidden sm:block">{lang.popularHint}</p>
                  </header>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {popularBrands.map(b => {
                      const seed = getMulticolorSeed(b.brand, "");
                      const theme = getMulticolorTheme(seed);
                      return (
                        <button
                          key={b.brand}
                          onClick={() => setSearchQuery(b.brand)}
                          className="group relative overflow-hidden flex flex-col items-start justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/40 hover:border-primary/30 hover:bg-card/80 transition-all text-left min-h-[110px]"
                        >
                          <div className={cn("absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-0 group-hover:opacity-30 blur-2xl transition-opacity bg-gradient-to-br", theme.gradient)} />
                          <div className={cn("w-8 h-1 rounded-full bg-gradient-to-r", theme.gradient)} />
                          <div className="relative">
                            <p className={cn("font-black text-lg uppercase tracking-tight text-foreground transition-colors", theme.hoverTitle)}>
                              {b.brand}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">
                              {lang.modelCount(b.count)}
                            </p>
                          </div>
                          <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Browse all — compact list */}
              <section>
                <header className="flex items-baseline justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground/60" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{lang.browseAllTitle}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 tabular-nums">{filteredData.length}</p>
                </header>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 rounded-2xl border border-border/40 bg-card/20 p-2 max-h-[560px] overflow-y-auto">
                  {filteredData.map(item => {
                    const seed = getMulticolorSeed(item.brand, item.series);
                    const theme = getMulticolorTheme(seed);
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className={cn("w-0.5 self-stretch rounded-full shrink-0 bg-gradient-to-b min-h-[28px]", theme.gradient)} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-black text-[12.5px] text-foreground/90 leading-tight truncate transition-colors", theme.hoverTitle)}>
                              {item.brand}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground/55 font-medium mt-0.5 truncate">
                              {item.series || lang.allSeries}
                            </p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          )}
        </>
      )}

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
              <Input placeholder="msi, katana, b11mou, bios key" value={Array.isArray(formData.searchTags) ? formData.searchTags.join(', ') : formData.searchTags} onChange={e => setFormData({ ...formData, searchTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
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
    </ToolWrapper>
  );
}
