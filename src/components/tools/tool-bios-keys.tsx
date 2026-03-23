"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, AlertTriangle, Chrome, Search, Hash, KeySquare, ChevronDown } from "lucide-react";
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

// --- SEEDER DATA ---
const INITIAL_BIOS_DATA: BiosKeyData[] = [
  { id: "lenovo-think", brand: "Lenovo", category: "Laptop", series: "ThinkPad, ThinkBook", biosKey: "F1 (Atau Enter lalu F1)", bootKey: "F12", notes: "Tekan Enter berulang kali saat logo muncul untuk memutus startup, lalu pilih opsi yang relevan. Pada model tertentu butuh Fn + F1/F12.", searchTags: ["thinkpad", "thinkbook", "lenovo"] },
  { id: "lenovo-idea", brand: "Lenovo", category: "Laptop", series: "IdeaPad, Yoga, Legion", biosKey: "F2 (atau Fn + F2)", bootKey: "F12 (atau Novo Button)", notes: "Sangat direkomendasikan: Gunakan Tombol Novo (lubang kecil) dengan jarum di samping bodi saat laptop mati total. Menu rahasia akan langsung muncul tanpa adu cepat.", searchTags: ["ideapad", "yoga", "legion", "lenovo"] },
  { id: "lenovo-desk", brand: "Lenovo", category: "Desktop PC", series: "ThinkCentre, IdeaCentre", biosKey: "F1", bootKey: "F12", notes: "Pastikan keyboard dicolok ke port USB belakang (menempel di motherboard), bukan di port USB depan (casing) agar masukan cepat terbaca.", searchTags: ["thinkcentre", "ideacentre", "lenovo pc", "aio"] },
  { id: "hp-laptop", brand: "HP", category: "Laptop", series: "Semua Lini (Pavilion, Omen, Envy, dll)", biosKey: "F10 (atau ESC lalu F10)", bootKey: "F9 (atau ESC lalu F9)", notes: "Tekan tombol ESC berkali-kali segera setelah tombol daya ditekan, hingga 'Startup Menu' muncul. Ini adalah jalan paling aman di HP.", searchTags: ["hp", "pavilion", "omen", "elitebook", "probook", "envy"] },
  { id: "hp-desk", brand: "HP", category: "Desktop PC", series: "Seri PC, Pavilion, EliteDesk", biosKey: "F10 (atau ESC lalu F10)", bootKey: "F9 (atau ESC lalu F9)", notes: "Sama dengan laptop. Untuk dual-boot Linux khusus, Anda mungkin harus mematikan Secure Boot dari dalam menu BIOS-nya.", searchTags: ["hp pc", "elitedesk", "pavilion pc"] },
  { id: "dell-laptop", brand: "Dell", category: "Laptop", series: "Latitude, XPS, Alienware, Inspiron", biosKey: "F2", bootKey: "F12", notes: "Tombol F12 sangat sakti di Dell. Selain menu Boot, F12 juga menyediakan diagnostik hardware rahasia dan fitur flash BIOS langsung.", searchTags: ["dell", "latitude", "xps", "alienware", "inspiron", "vostro"] },
  { id: "dell-desk", brand: "Dell", category: "Desktop PC", series: "OptiPlex, XPS Desktop, Aurora", biosKey: "F2", bootKey: "F12", notes: "Standar tombol tidak pernah berubah dari generasi ke generasi.", searchTags: ["dell pc", "optiplex", "xps desktop", "aurora"] },
  { id: "asus-laptop", brand: "ASUS", category: "Laptop", series: "ZenBook, ROG, TUF, VivoBook", biosKey: "Tahan F2 lalu nyalakan", bootKey: "ESC", notes: "Saat laptop masih mati, tahan jari di atas tombol F2, lalu pancet tombol Power. Jika gagal mendeteksi Flashdisk di Boot Menu, matikan Fast Boot / Secure Boot dulu.", searchTags: ["asus", "zenbook", "vivobook", "rog", "tuf", "expertbook"] },
  { id: "asus-mobo", brand: "ASUS", category: "Motherboard", series: "ROG, TUF, Prime, ProArt", biosKey: "DEL atau F2", bootKey: "F8", notes: "DEL adalah pembuka BIOS yang paling lazim di rakitan ASUS.", searchTags: ["asus pc", "motherboard asus", "rog mobo", "tuf mobo", "prime"] },
  { id: "acer-all", brand: "Acer", category: "Semua Lini", series: "Aspire, Nitro, Predator, Swift", biosKey: "F2 (atau DEL untuk PC)", bootKey: "F12", notes: "SANGAT PENTING: Fitur F12 biasanya dimatikan (Disabled) dari pabrik. Anda WAJIB masuk BIOS (F2) dulu, buka tab Main, dan ubah 'F12 Boot Menu' jadi Enabled.", searchTags: ["acer", "aspire", "predator", "nitro", "swift", "spin"] },
  { id: "msi-laptop", brand: "MSI", category: "Laptop", series: "Katana, Stealth, Modern, dsb", biosKey: "DEL", bootKey: "F11", notes: "Berlaku konsisten di semua laptop MSI. Untuk teknisi, ada mode pembedah BIOS rahasia tersembunyi dengan kombinasi (L-Alt + R-CTRL + R-Shift + F2).", searchTags: ["msi", "katana", "stealth", "modern", "raider", "bravo"] },
  { id: "msi-mobo", brand: "MSI", category: "Motherboard", series: "Semua Seri Z, X, B", biosKey: "DEL", bootKey: "F11", notes: "Dieksekusi cepat tanpa rintangan seperti mode fast-boot pada sasis laptop.", searchTags: ["msi mobo", "msi pc"] },
  { id: "surface", brand: "Microsoft", category: "Tablet & OS", series: "Surface Pro, Go, Laptop", biosKey: "Tahan Vol UP + Power", bootKey: "Tahan Vol DOWN + Power", notes: "Tahan tombol pengatur suara saat ditekan nyala, TAPI pantang dilepaskan sampai logo layar perputaran masuk sepenuhnya ke dalam menu.", searchTags: ["surface", "surface pro", "microsoft"] },
  { id: "mac-intel", brand: "Apple", category: "Mac (Intel)", series: "Berbasis x86", biosKey: "Cmd (⌘) + R", bootKey: "Tahan Option/Alt (⌥)", notes: "Ketik saat terdengar gemerincing bunyi startup (Chime) atau saat layar nyala kali pertama.", searchTags: ["macbook", "apple", "intel mac"] },
  { id: "mac-soc", brand: "Apple", category: "Mac (Silicon)", series: "Mac M1/M2/M3", biosKey: "Tahan Tombol Daya", bootKey: "Tahan Tombol Daya", notes: "Tekan tanpa putus tombol putar listrik/Power bahkan dari awal ia mati sampai dia menuliskan kata 'Loading startup options' membelah layar.", searchTags: ["macbook", "m1", "m2", "apple silicon"] },
  { id: "rog-ally", brand: "ASUS", category: "Handheld", series: "ROG Ally PC", biosKey: "Tahan Vol DOWN + Power", bootKey: "Akses di Navigasi BIOS", notes: "Mirip pendekatan Tablet karena melucuti tata letak keybord konvensional.", searchTags: ["rog ally", "handheld", "asus console"] },
  { id: "legion-go", brand: "Lenovo", category: "Handheld", series: "Legion Go", biosKey: "Tahan Vol UP + Power", bootKey: "Layar Sentuh (Touch)", notes: "Menapaki utilitas ini dimanjakan oleh panel BIOS dukungan jarum sentuh dari Lenovo langsung pada layar kaca.", searchTags: ["legion go", "handheld"] },
  { id: "gigabyte", brand: "Gigabyte/AORUS", category: "Semua Lini", series: "Aero, Rakitan", biosKey: "DEL atau F2", bootKey: "F12", notes: "Tercatat rapi pada lini standar stabilitas mereka.", searchTags: ["gigabyte", "aorus", "aero"] },
  { id: "asrock", brand: "ASRock", category: "Motherboard", series: "Semua Desktop", biosKey: "F2 atau DEL", bootKey: "F11", notes: "Klasik rakitan bodi komputer rumah.", searchTags: ["asrock"] },
  { id: "samsung", brand: "Samsung", category: "Laptop", series: "Galaxy Book, Ativ", biosKey: "F2", bootKey: "F10 (Baru) / ESC", notes: "Harus mengimbangi percepatan Fast Boot, disarankan menceritakannya berulang selagi layar berseminggu menyala.", searchTags: ["samsung", "galaxy book", "ativ"] },
  { id: "vaio", brand: "Sony", category: "Laptop Klasik", series: "PCG, VGN", biosKey: "F2", bootKey: "Menu ASSIST atau F11", notes: "Cukup tekan 'tombol pink pudar' bertuliskan Assist persis saat komputer tidur total untuk pengalaman tanpa meraba kecepatan BIOS peradaban purba.", searchTags: ["sony", "vaio"] },
  { id: "toshiba", brand: "Toshiba", category: "Laptop", series: "Tecra, Satellite", biosKey: "F2", bootKey: "F12", notes: "Bisa juga F12 jika beruntung sistem Fn tidak tertaut terkunci saat dipencet.", searchTags: ["toshiba", "dynabook", "satellite"] },
  { id: "intel", brand: "Intel", category: "Mini PC", series: "NUC Systems", biosKey: "F2", bootKey: "F10", notes: "Kalau putus asa darurat, tahan keras tombol power 3 detik untuk merajut sinyal paksa BIOS.", searchTags: ["intel", "nuc"] },
  { id: "framework", brand: "Framework", category: "Laptop Modular", series: "Semua Varian", biosKey: "F2", bootKey: "F12", notes: "Sering dipatri nol detik limit ambang tekan F2 sehingga merusak kelingking jika tak tangkas. Siksa papan tombol selagi layar hitam.", searchTags: ["framework", "modular"] },
  { id: "axioo", brand: "Axioo", category: "Laptop", series: "Pongo, MyBook, dll", biosKey: "DEL atau F2", bootKey: "F11, F12, atau ESC", notes: "Oem sasis lokal membalut jeroan papan rakit generik. Sangat standar pada pakem yang diisyaratkan ini.", searchTags: ["axioo", "pongo", "mybook", "lokal"] },
  { id: "advan", brand: "Advan", category: "Laptop", series: "WorkPlus, dsb", biosKey: "DEL atau F2", bootKey: "ESC, F11, atau F12", notes: "Standarisasi InsydeH2O BIOS sasis perakit raksasa daratan seberang.", searchTags: ["advan", "workplus", "lokal"] },
  { id: "zyrex", brand: "Zyrex", category: "Laptop", series: "Cruiser, dsb", biosKey: "DEL atau F2", bootKey: "ESC atau F11", notes: "Meminjam platform jeroan konvensional yang identik tabiatnya dengan kerukunan laptop rilis kawan sepantarannya.", searchTags: ["zyrex", "lokal"] },
  { id: "infinix", brand: "Infinix", category: "Laptop", series: "InBook, Zero Book", biosKey: "F2", bootKey: "F12", notes: "Namun kerap juga menyimpan kombinasi sistem pencet android terbalik semacam Tahan Volume atas saat nyala.", searchTags: ["infinix", "inbook", "zero book"] },
];

export function ToolBiosKeys({ dictionary }: { dictionary?: any }) {
  const { notify } = useNotification();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  
  const [dataKeys, setDataKeys] = useState<BiosKeyData[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleInjectData = async () => {
    if (!firestore || !user || !isAdminUser) return;
    setIsInjecting(true);
    try {
      const collectionRef = collection(firestore, COLLECTION_NAME);
      const batch = writeBatch(firestore);

      INITIAL_BIOS_DATA.forEach((item) => {
        const docRef = doc(collectionRef, item.id);
        const { id, ...dataToSave } = item;
        batch.set(docRef, {
          ...dataToSave,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
      
      notify(
        <span className="font-medium text-sm text-emerald-500">Berhasil menyuntikkan gudang data!</span>
      );
      await fetchKeys();
    } catch (err) {
      console.error("Injection error", err);
      notify("Gagal menyuntikkan data", <AlertTriangle className="h-4 w-4" />);
    } finally {
      setIsInjecting(false);
    }
  };

  const lgSearch = searchQuery.toLowerCase().trim();
  const filteredData = useMemo(() => {
    if (!lgSearch) return dataKeys;
    return dataKeys.filter(item => {
      const brandStr = item.brand.toLowerCase();
      const seriesStr = item.series.toLowerCase();
      const matchTag = item.searchTags.some(tag => tag.toLowerCase().includes(lgSearch));
      return brandStr.includes(lgSearch) || seriesStr.includes(lgSearch) || matchTag;
    });
  }, [dataKeys, lgSearch]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      
      {/* --- Admin Injection Panel --- */}
      {(isAdminLoading || isAdminUser || !user) && (
        <Card className="border-t-4 border-t-emerald-500 shadow-sm transition-all">
          <CardHeader className="bg-emerald-500/5 pb-4">
            <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" /> Area Admin: Suntik Gudang Data (Firestore)
            </CardTitle>
            <CardDescription>
              Tombol ini hanya terlihat oleh Anda. Mengirim template awal data BIOS dari Gemini ke Firestore.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 bg-card/50">
            {!user ? (
              <Button 
                onClick={() => {
                  if (!auth) {
                    notify("Akses Ditolak: Kunci API Firebase belum dipasang (file .env.local kosong). Silakan pasang dulu atau inject dari Production.", <AlertTriangle className="h-4 w-4" />);
                    return;
                  }
                  initiateGoogleSignIn(auth);
                }} 
                className="rounded-xl"
              >
                <Chrome className="mr-2 h-4 w-4" /> Login
              </Button>
            ) : isAdminLoading ? (
              <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Memuat...</div>
            ) : (
               <Button onClick={handleInjectData} disabled={isInjecting} className="rounded-xl font-bold tracking-wide">
                 {isInjecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4"/>}
                 Inject {INITIAL_BIOS_DATA.length} Merek ke Firestore Sekarang!
               </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- UI Utama --- */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground mt-4">
          Pencari Tombol BIOS & Boot Menu
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Tidak perlu menebak-nebak lagi. Temukan kombinasi tombol sakti untuk masuk ke mode BIOS (UEFI) atau *Boot Menu* pada semua pabrikan elektronik saat ini.
        </p>
      </div>

      <div className="max-w-xl mx-auto sticky top-4 z-30">
        <div className="relative group">
          <input
            type="text"
            className="w-full rounded-2xl border-2 border-primary/20 bg-background/90 backdrop-blur-md px-5 py-4 pl-12 shadow-xl shadow-primary/5 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 text-md font-medium placeholder:font-normal placeholder:opacity-70"
            placeholder="Ketik rakitan/merek Anda (Contoh: ASUS, Thinkpad)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
            <Search className="h-5 w-5 text-primary/70" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
            <p>Membaca pita gudang memori rahasia...</p>
          </div>
        ) : dataKeys.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed bg-card/30 p-16 text-center text-muted-foreground min-h-[300px] flex flex-col justify-center items-center">
            <AlertTriangle className="h-12 w-12 opacity-20 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Gudang Kosong</h3>
            <p className="mt-2 text-sm">Masih belum ada merek yang terekam di sistem. Silakan login admin untuk inject data pertama.</p>
          </div>
        ) : filteredData.length === 0 ? (
           <div className="text-center py-20 text-muted-foreground">
             <Search className="h-12 w-12 opacity-10 mx-auto mb-4" />
             <p className="text-lg">Duh, tidak ada perangkat dengan merek atau keyword <span className="text-foreground font-bold">"{searchQuery}"</span></p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            {filteredData.map((item, id) => (
              <Card key={item.id || id} className="group overflow-hidden border border-border/40 hover:border-primary/40 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
                  <div className="flex justify-between items-start">
                    <div>
                       <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-widest font-black bg-background text-primary opacity-80 border-primary/20">{item.category}</Badge>
                       <CardTitle className="text-2xl font-black">{item.brand}</CardTitle>
                       <CardDescription className="font-semibold text-foreground/70 line-clamp-1 mt-1">{item.series}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/30">
                    <div className="p-5 flex flex-col items-center text-center justify-center bg-background/50 group-hover:bg-primary/[0.03] transition-colors">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><KeySquare className="h-3 w-3" /> BIOS Setup</p>
                      <h4 className="font-bold text-lg text-primary">{item.biosKey}</h4>
                    </div>
                    <div className="p-5 flex flex-col items-center text-center justify-center bg-background/50 group-hover:bg-cyan-500/[0.03] transition-colors">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><Database className="h-3 w-3" /> Boot Menu</p>
                      <h4 className="font-bold text-lg text-cyan-600 dark:text-cyan-400">{item.bootKey}</h4>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="p-5 text-sm leading-relaxed text-muted-foreground bg-muted/5 group-hover:text-foreground/90 transition-colors">
                      <span className="font-bold mb-1 opacity-50 block">Catatan:</span>
                      {item.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
