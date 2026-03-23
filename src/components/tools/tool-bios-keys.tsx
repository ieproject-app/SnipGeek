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
import { Loader2, Database, AlertTriangle, Chrome, Search, KeySquare, Edit, Plus, Trash2, FileJson, Settings2 } from "lucide-react";
import { useNotification } from "@/hooks/use-notification";

export interface BiosKeyData {
  id?: string;
  brand: string;
  category: string;
  series: string;
  biosKey: string;
  bootKey: string;
  notes: string;
  searchTags: string[];
}

const COLLECTION_NAME = "bios_keys";

export function ToolBiosKeys({ dictionary }: { dictionary?: any }) {
  const { notify } = useNotification();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  
  const [dataKeys, setDataKeys] = useState<BiosKeyData[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal form states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulking, setIsBulking] = useState(false);
  
  const defaultForm: BiosKeyData = {
    brand: "", category: "Laptop", series: "", biosKey: "F2", bootKey: "F12", notes: "", searchTags: []
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
    } catch (error) {
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
        // Sort alphabetically by brand
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
    setBulkJsonText("[\n  {\n    \"brand\": \"Nama Merek\",\n    \"category\": \"Laptop\",\n    \"series\": \"Seri 123\",\n    \"biosKey\": \"F2\",\n    \"bootKey\": \"F12\",\n    \"notes\": \"Catatan khusus...\",\n    \"searchTags\": [\"merek\", \"seri\"]\n  }\n]");
    setIsBulkModalOpen(true);
  };

  const sanitizeId = (brand: string, series: string) => {
    return `${brand}-${series}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now().toString();
  };

  const handleSaveData = async () => {
    if (!firestore || !isAdminUser) return;
    if (!formData.brand.trim() || !formData.biosKey.trim()) {
      notify("Merek dan tombol BIOS wajib diisi", <AlertTriangle className="h-4 w-4" />);
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
        searchTags: Array.isArray(formData.searchTags) ? formData.searchTags : [],
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      notify(<span className="font-medium text-sm text-emerald-500">Data {payload.brand} berhasil disimpan!</span>);
      setIsAddEditModalOpen(false);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      notify("Gagal menyimpan data", <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteData = async () => {
    if (!firestore || !isAdminUser || !formData.id) return;
    if (!confirm(`Yakin ingin menghapus ${formData.brand} - ${formData.series}?`)) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, COLLECTION_NAME, formData.id));
      notify(<span className="font-medium text-sm text-rose-500">Data berhasil dihapus!</span>);
      setIsAddEditModalOpen(false);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      notify("Gagal menghapus data", <AlertTriangle className="h-4 w-4" />);
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
         throw new Error("Data JSON harus berupa Array [...]");
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
          searchTags: Array.isArray(item.searchTags) ? item.searchTags : [],
          updatedAt: new Date().toISOString()
        };
        batch.set(docRef, payload, { merge: true });
      });

      await batch.commit();
      notify(<span className="font-medium text-sm text-emerald-500">Bulk Update {parsedData.length} data berhasil!</span>);
      setIsBulkModalOpen(false);
      await fetchKeys();

    } catch (error: any) {
      console.error(error);
      notify(`Gagal Bulk Update: ${error.message}`, <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsBulking(false);
    }
  };

  const lgSearch = searchQuery.toLowerCase().trim();
  const filteredData = useMemo(() => {
    if (!lgSearch) return dataKeys;
    return dataKeys.filter(item => {
      const brandStr = (item.brand || "").toLowerCase();
      const seriesStr = (item.series || "").toLowerCase();
      const tagsStr = Array.isArray(item.searchTags) ? item.searchTags.join(" ").toLowerCase() : "";
      return brandStr.includes(lgSearch) || seriesStr.includes(lgSearch) || tagsStr.includes(lgSearch);
    });
  }, [dataKeys, lgSearch]);

  return (
    <div className="space-y-8 min-h-screen pb-10">
      
      {/* --- Admin Control Panel --- */}
      {(isAdminLoading || isAdminUser || !user) && (
        <Card className="border-t-4 border-t-emerald-500 shadow-sm transition-all overflow-hidden bg-card/60 backdrop-blur-sm">
          <CardHeader className="bg-emerald-500/5 pb-4">
            <div className="flex justify-between items-center w-full flex-wrap gap-4">
               <div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5" /> Database Administrator (Live)
                  </CardTitle>
                  <CardDescription className="max-w-xl pr-4">
                    Anda login sebagai Super Admin. Anda bisa menambah data satuan atau melakukan eksekusi massal (Bulk Inject/Update) dengan JSON.
                  </CardDescription>
               </div>
               <div className="flex gap-3">
                 {!user ? (
                  <Button onClick={() => auth && initiateGoogleSignIn(auth)} className="rounded-xl shadow-lg hover:shadow-xl transition-all h-10">
                    <Chrome className="mr-2 h-4 w-4" /> Login Akses Admin
                  </Button>
                 ) : isAdminLoading ? (
                   <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Menganalisis akses...</div>
                 ) : (
                  <>
                    <Button variant="outline" onClick={handleOpenBulk} className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm transition-all h-11 px-5 font-bold tracking-wide">
                      <FileJson className="mr-2 h-4 w-4" /> Bulk Update
                    </Button>
                    <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all h-11 px-6 font-bold tracking-wide">
                      <Plus className="mr-2 h-5 w-5" /> Tambah Merek Baru
                    </Button>
                  </>
                 )}
               </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* --- Header & Search Bar --- */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mt-4 lg:mt-8">
          Pencetak Tombol BIOS & Boot
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Temukan kombinasi tombol krusial akses BIOS (UEFI) dan *Boot Menu* pada pabrikan lapop & motherboard dengan sekilas pandang.
        </p>
      </div>

      {/* STICKY SEARCH BAR - Diubah ke top-24 atau top-28 agar tidak tertutup Header Navigasi SnipGeek  */}
      <div className="max-w-3xl mx-auto sticky top-24 z-30 pt-2 pb-4">
        <div className="relative group">
          <input
            type="text"
            className="w-full rounded-2xl border-2 border-primary/20 bg-background/80 backdrop-blur-xl px-6 py-5 pl-14 shadow-2xl shadow-primary/5 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 text-lg font-medium placeholder:font-normal placeholder:opacity-60"
            placeholder="Ketik rakitan/merek/tipe spesifik (Cth: ASUS, Legion, B11MOU)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none text-muted-foreground">
            <Search className="h-6 w-6 text-primary/70" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50 mb-4" />
            <p className="text-lg">Membaca pita gudang memori rahasia...</p>
          </div>
        ) : dataKeys.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed bg-card/30 p-16 text-center text-muted-foreground min-h-[400px] flex flex-col justify-center items-center">
            <AlertTriangle className="h-16 w-16 opacity-20 mb-4" />
            <h3 className="text-2xl font-bold text-foreground">Gudang Kosong</h3>
            <p className="mt-2">Belum ada perangkat yang terekam di sistem. Gunakan *Bulk Update* menggunakan format JSON dari ChatGPT/Gemini.</p>
          </div>
        ) : filteredData.length === 0 ? (
           <div className="text-center py-24 text-muted-foreground">
             <Search className="h-16 w-16 opacity-10 mx-auto mb-4" />
             <p className="text-xl">Tidak ada perangkat dengan merek atau seri <span className="text-foreground font-bold">"{searchQuery}"</span></p>
             <p className="mt-2 text-sm opacity-60">Mungkin Anda bisa cari nama generiknya seperti "Lenovo" atau "Apple".</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max px-2">
            {filteredData.map((item) => (
              
              /* DESAIN CARD SNIPGEEK BARU - Lebih Bersih, Geeky, Modern */
              <Card key={item.id} className="group relative overflow-hidden bg-card/40 backdrop-blur-md border border-border/50 hover:border-primary/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col rounded-2xl">
                
                {/* Aksen Glowing Kecil di Atas */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Tombol Edit Cepat (Khusus Admin) */}
                {isAdminUser && (
                   <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button size="icon" variant="secondary" onClick={() => handleOpenEdit(item)} className="h-8 w-8 rounded-full shadow-md bg-background hover:bg-primary/20 border border-primary/10">
                       <Settings2 className="h-4 w-4 text-foreground/70" />
                     </Button>
                   </div>
                )}
                
                <CardHeader className="p-6 pb-2">
                   <div className="flex items-center gap-3 mb-3">
                     <Badge variant="secondary" className="uppercase text-[10px] tracking-widest font-black bg-muted text-muted-foreground w-max border-none rounded-md px-2 py-0.5">
                       {item.category}
                     </Badge>
                   </div>
                   <CardTitle className="text-2xl font-black text-foreground tracking-tight">{item.brand}</CardTitle>
                   <CardDescription className="font-semibold text-muted-foreground tracking-wide mt-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap">
                     {item.series || 'Semua Produk Lini Tersedia'}
                   </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 pt-4 flex flex-col flex-1 gap-5">
                  
                  {/* Blok Tombol Kunci */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-background/60 border border-border/40 group-hover:border-primary/20 transition-colors">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <KeySquare className="h-4 w-4 opacity-70" /> BIOS
                      </span>
                      {/* Desain <kbd> Tag Ala Geek */}
                      <kbd className="inline-flex items-center px-2.5 py-1 text-sm font-bold text-foreground bg-muted border border-b-2 border-border/80 rounded-lg font-mono shadow-sm">
                        {item.biosKey || "-"}
                      </kbd>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-background/60 border border-border/40 group-hover:border-cyan-500/20 transition-colors">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <Database className="h-4 w-4 opacity-70" /> Boot
                      </span>
                      <kbd className="inline-flex items-center px-2.5 py-1 text-sm font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-b-2 border-cyan-500/20 rounded-lg font-mono shadow-sm">
                        {item.bootKey || "-"}
                      </kbd>
                    </div>
                  </div>

                  {/* Blok Catatan Footer Card */}
                  <div className="mt-auto pt-2">
                     {item.notes ? (
                        <p className="text-[13px] leading-relaxed text-muted-foreground/90 group-hover:text-foreground transition-colors line-clamp-3">
                          <span className="font-bold border-l-2 border-primary/50 pl-2 mr-1 opacity-70">Wajib Tahu:</span>
                          {item.notes}
                        </p>
                     ) : (
                        <p className="text-[13px] italic text-muted-foreground/50 border-l-2 border-border/50 pl-2">
                          Instruksi murni standar.
                        </p>
                     )}
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* --- Dialog 1: Form Tambah/Edit Single Data --- */}
      <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
        <DialogContent className="max-w-2xl sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
               {formData.id ? <Edit className="h-5 w-5 text-primary"/> : <Plus className="h-5 w-5 text-emerald-500" />}
               {formData.id ? "Edit Data Spesifikasi" : "Suntik Merek Spesifik Baru"}
            </DialogTitle>
            <DialogDescription>
               Atur tombol akses BIOS dan kata kunci mesin pencari (SEO) di sini secara tunggal. Perubahan tersimpan live.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 mt-2">
             <div className="space-y-2">
               <Label className="font-bold">Merek Perangkat</Label>
               <Input placeholder="Contoh: MSI" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label className="font-bold">Kategori Spesifik</Label>
               <Input placeholder="Laptop / Motherboard PC" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} />
             </div>
             <div className="space-y-2 md:col-span-2">
               <Label className="font-bold">Seri Lini Produk / Tipe Identik <span className="opacity-50 font-normal">(Opsional)</span></Label>
               <Input placeholder="Contoh: Lini Katana, Raider, Modern, B11MOU" value={formData.series} onChange={e=>setFormData({...formData, series: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label className="font-bold text-primary">Kunci Masuk BIOS / UEFI</Label>
               <Input placeholder="Contoh: DEL atau Tahan F2" className="border-primary/30" value={formData.biosKey} onChange={e=>setFormData({...formData, biosKey: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label className="font-bold text-cyan-600 dark:text-cyan-400">Kunci Boot Device Menu</Label>
               <Input placeholder="Contoh: F11" className="border-cyan-500/30" value={formData.bootKey} onChange={e=>setFormData({...formData, bootKey: e.target.value})} />
             </div>
             <div className="space-y-2 md:col-span-2">
               <Label className="font-bold">Catatan Pendukung (Trik / Peringatan Penting)</Label>
               <Textarea placeholder="Contoh: Matikan Secure Boot terlebih dahulu sebelum..." rows={3} value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} />
             </div>
             <div className="space-y-2 md:col-span-2">
               <Label className="font-bold">Katakunci Sorotan SEO (Pisahkan dengan koma)</Label>
               <Input placeholder="msi, katana, b11mou, tombol rahasia" value={Array.isArray(formData.searchTags) ? formData.searchTags.join(', ') : formData.searchTags} onChange={e=>setFormData({...formData, searchTags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) as any})} />
               <p className="text-[11px] text-muted-foreground">Ini krusial: Daftarkan semua variasi pemanggilan dari user agar alat *Search Input* kita dan Google mampu mencocokkannya seketika.</p>
             </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col md:flex-row justify-between gap-3 border-t pt-6">
            {formData.id ? (
               <Button type="button" variant="destructive" onClick={handleDeleteData} disabled={isDeleting} className="w-full md:w-auto h-11">
                 {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trash2 className="h-4 w-4 mr-2" />} Hapus
               </Button>
            ) : <div />}
            <div className="flex gap-3 w-full md:w-auto">
               <Button type="button" variant="outline" onClick={() => setIsAddEditModalOpen(false)} className="w-full md:w-auto h-11">Batal</Button>
               <Button type="button" onClick={handleSaveData} disabled={isSaving} className="w-full md:w-auto h-11 font-bold">
                 {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Simpan
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- Dialog 2: Form Bulk JSON Update --- */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-3xl sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
               <FileJson className="h-5 w-5 text-emerald-500" /> Bulk Update / Mass Inject (via JSON)
            </DialogTitle>
            <DialogDescription>
               Fitur mutakhir untuk menimpa massal atau menyuntikkan puluhan data baru sekaligus hasil dari *prompt* Gemini/ChatGPT. Harap patuhi struktur skema JSON murni.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-6 pb-2 mt-2">
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <Label className="font-bold">Teks Script Array JSON <code>[{"{"}...{"}"}]</code></Label>
               </div>
               <Textarea 
                 className="min-h-[300px] font-mono text-xs p-4 bg-muted/20 border-border/80" 
                 value={bulkJsonText} 
                 onChange={e=>setBulkJsonText(e.target.value)} 
               />
               <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                 Kunci obyek (Keys) yang didukung: <strong>brand</strong>, <strong>category</strong>, <strong>series</strong>, <strong>biosKey</strong>, <strong>bootKey</strong>, <strong>notes</strong>, <strong>searchTags</strong> [Array]. 
                 <br />*Sistem akan otomatis me-replace dokumen jika Merek+Seri nya persis, dan menambah baru jika tidak sama.*
               </p>
             </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col md:flex-row justify-end gap-3 border-t pt-6">
             <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)} className="w-full md:w-auto h-11">Batalkan Eksekusi</Button>
             <Button type="button" onClick={handleBulkInject} disabled={isBulking || !bulkJsonText.includes("[")} className="w-full md:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/10">
               {isBulking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />} Jalankan Bulk Inject
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
