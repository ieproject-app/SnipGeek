"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, AlertTriangle, Chrome, Search, KeySquare, Edit, Plus, Trash2 } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const defaultForm: BiosKeyData = {
    brand: "", category: "Laptop", series: "", biosKey: "F2", bootKey: "F12", notes: "", searchTags: []
  };
  const [formData, setFormData] = useState<BiosKeyData>(defaultForm);

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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BiosKeyData) => {
    setFormData({ ...item });
    setIsModalOpen(true);
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
      setIsModalOpen(false);
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
      setIsModalOpen(false);
      await fetchKeys();
    } catch (error) {
      console.error(error);
      notify("Gagal menghapus data", <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      
      {/* --- Admin Control Panel (Replacing Injector) --- */}
      {(isAdminLoading || isAdminUser || !user) && (
        <Card className="border-t-4 border-t-emerald-500 shadow-sm transition-all overflow-hidden bg-card/60 backdrop-blur-sm">
          <CardHeader className="bg-emerald-500/5 pb-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
               <div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5" /> Database Administrator (Live)
                  </CardTitle>
                  <CardDescription>
                    Anda login sebagai Super Admin. Anda bisa menambah model laptop rahasia/spesifik agar bisa dirayapi Google.
                  </CardDescription>
               </div>
               {!user ? (
                <Button onClick={() => auth && initiateGoogleSignIn(auth)} className="rounded-xl shadow-lg hover:shadow-xl transition-all h-10">
                  <Chrome className="mr-2 h-4 w-4" /> Login Akses Admin
                </Button>
               ) : isAdminLoading ? (
                 <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Menganalisis akses...</div>
               ) : (
                <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all h-11 px-6 font-bold tracking-wide">
                  <Plus className="mr-2 h-5 w-5" /> Tambah Merek Baru
                </Button>
               )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* --- UI Utama --- */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mt-4 lg:mt-8">
          Pencari Tombol BIOS & Boot Menu
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Tidak perlu menebak-nebak lagi. Temukan kombinasi tombol sakti untuk masuk ke mode BIOS (UEFI) atau *Boot Menu* pada semua pabrikan elektronik saat ini.
        </p>
      </div>

      <div className="max-w-3xl mx-auto sticky top-4 z-30">
        <div className="relative group">
          <input
            type="text"
            className="w-full rounded-2xl border-2 border-primary/20 bg-background/90 backdrop-blur-xl px-6 py-5 pl-14 shadow-2xl shadow-primary/5 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 text-lg font-medium placeholder:font-normal placeholder:opacity-60"
            placeholder="Ketik rakitan/merek/tipe spesifik (Cth: ASUS, Legion, B11MOU)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-muted-foreground">
            <Search className="h-6 w-6 text-primary/70" />
          </div>
        </div>
      </div>

      <div className="pt-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50 mb-4" />
            <p className="text-lg">Membaca pita gudang memori rahasia...</p>
          </div>
        ) : dataKeys.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed bg-card/30 p-16 text-center text-muted-foreground min-h-[400px] flex flex-col justify-center items-center">
            <AlertTriangle className="h-16 w-16 opacity-20 mb-4" />
            <h3 className="text-2xl font-bold text-foreground">Gudang Kosong</h3>
            <p className="mt-2">Belum ada perangkat yang terekam di sistem. Silakan pakai akun Admin untuk menyuntik data baru.</p>
          </div>
        ) : filteredData.length === 0 ? (
           <div className="text-center py-24 text-muted-foreground">
             <Search className="h-16 w-16 opacity-10 mx-auto mb-4" />
             <p className="text-xl">Duh, tidak ada perangkat dengan merek atau seri <span className="text-foreground font-bold">"{searchQuery}"</span></p>
             <p className="mt-2 text-sm opacity-60">Mungkin Anda bisa cari nama generiknya seperti "Lenovo" atau "Acer".</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
            {filteredData.map((item) => (
              <Card key={item.id} className="group overflow-hidden border border-border/40 hover:border-primary/40 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative flex flex-col">
                
                {/* Admin Quick Edit Action */}
                {isAdminUser && (
                   <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(item)} className="h-8 shadow-md rounded-lg font-bold">
                       <Edit className="h-3 w-3 mr-1.5" /> Edit Data
                     </Button>
                   </div>
                )}
                
                <CardHeader className="bg-muted/10 pb-5 border-b border-border/30 px-6">
                   <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-widest font-black bg-background text-primary opacity-80 border-primary/20 w-max">{item.category}</Badge>
                   <CardTitle className="text-2xl font-black">{item.brand}</CardTitle>
                   <CardDescription className="font-semibold text-foreground/70 line-clamp-1 mt-1">{item.series || 'Model Umum'}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/30">
                    <div className="p-6 flex flex-col items-center text-center justify-center bg-background/50 group-hover:bg-primary/[0.03] transition-colors">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5"><KeySquare className="h-3.5 w-3.5" /> BIOS Setup</p>
                      <h4 className="font-bold text-xl md:text-[22px] text-primary">{item.biosKey}</h4>
                    </div>
                    <div className="p-6 flex flex-col items-center text-center justify-center bg-background/50 group-hover:bg-cyan-500/[0.03] transition-colors">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> Boot Menu</p>
                      <h4 className="font-bold text-xl md:text-[22px] text-cyan-600 dark:text-cyan-400">{item.bootKey}</h4>
                    </div>
                  </div>
                  <div className="p-6 flex-1 text-sm md:text-base leading-relaxed text-muted-foreground bg-muted/5 group-hover:text-foreground/90 transition-colors">
                     {item.notes ? (
                        <p><span className="font-bold opacity-60 mr-2">Catatan khusus:</span>{item.notes}</p>
                     ) : (
                        <p className="italic opacity-50 text-xs">Tidak ada pemicu atau instruksi khusus untuk perangkat lini ini.</p>
                     )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* --- Dialog: Form Tambah/Edit Data --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
               {formData.id ? <Edit className="h-5 w-5 text-primary"/> : <Plus className="h-5 w-5 text-emerald-500" />}
               {formData.id ? "Edit Data Kendaraan" : "Suntik Merek Spesifik Baru"}
            </DialogTitle>
            <DialogDescription>
               Atur tombol akses BIOS dan kata kunci mesin pencari (SEO) di sini. Perubahan langsung tayang (*Live Firebase*).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
             <div className="space-y-2">
               <Label className="font-bold">Merek Perangkat</Label>
               <Input placeholder="Contoh: MSI" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label className="font-bold">Kategori</Label>
               <Input placeholder="Laptop / Mini PC / dsb" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} />
             </div>
             <div className="space-y-2 md:col-span-2">
               <Label className="font-bold">Seri Lini Produk <span className="opacity-50 font-normal">(Opsional)</span></Label>
               <Input placeholder="Contoh: Modern 14, B11MOU, Raider" value={formData.series} onChange={e=>setFormData({...formData, series: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label className="font-bold text-primary">Kunci Masuk BIOS</Label>
               <Input placeholder="Contoh: DEL" className="border-primary/30" value={formData.biosKey} onChange={e=>setFormData({...formData, biosKey: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label className="font-bold text-cyan-600 dark:text-cyan-400">Kunci Boot Menu</Label>
               <Input placeholder="Contoh: F11" className="border-cyan-500/30" value={formData.bootKey} onChange={e=>setFormData({...formData, bootKey: e.target.value})} />
             </div>
             <div className="space-y-2 md:col-span-2">
               <Label className="font-bold">Catatan Praktis</Label>
               <Textarea placeholder="Contoh: Wajib mematikan fitur Secure Boot terlebih dahulu..." rows={3} value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} />
             </div>
             <div className="space-y-2 md:col-span-2">
               <Label className="font-bold">Katakunci Tembus Cari (Comma Separated)</Label>
               <Input placeholder="msi, modern, b11mou, rakitan" value={Array.isArray(formData.searchTags) ? formData.searchTags.join(', ') : formData.searchTags} onChange={e=>setFormData({...formData, searchTags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) as any})} />
               <p className="text-[11px] text-muted-foreground">Ketik semua varian tipe yang dipikirkan pengguna agar nyangkut di *search bar*. Google SEO Crawler juga menyukainya.</p>
             </div>
          </div>

          <DialogFooter className="mt-4 flex flex-col md:flex-row justify-between gap-3 border-t pt-6">
            {formData.id ? (
               <Button type="button" variant="destructive" onClick={handleDeleteData} disabled={isDeleting} className="w-full md:w-auto h-11">
                 {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trash2 className="h-4 w-4 mr-2" />} Hapus Permanen
               </Button>
            ) : <div />}
            <div className="flex gap-3 w-full md:w-auto">
               <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="w-full md:w-auto h-11">Batal</Button>
               <Button type="button" onClick={handleSaveData} disabled={isSaving} className="w-full md:w-auto h-11 font-bold shadow-lg">
                 {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Simpan ke Database
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
