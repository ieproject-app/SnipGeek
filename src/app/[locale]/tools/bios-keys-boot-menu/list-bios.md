Dari Chat GPT :
ASUS
Laptop: Tombol BIOS F2; Tombol Boot Menu Esc
.
Desktop/Motherboard: Tombol BIOS Del; Tombol Boot Menu F8
.
Catatan Khusus: Pada beberapa model laptop ASUS tahan F2 saat dinyalakan untuk masuk BIOS
. Layar boot ASUS sering menampilkan petunjuk “Press DEL to enter BIOS”
.
Acer
Laptop: Tombol BIOS F2; Tombol Boot Menu F12
.
Desktop/PC Rakitan: Umumnya sama (BIOS F2 atau Del; Boot F12).
Catatan Khusus: Opsi F12 Boot Menu mungkin harus diaktifkan lebih dulu di BIOS agar berfungsi
.
Dell
Laptop & Desktop: Tombol BIOS F2
; Tombol Boot Menu F12
.
Catatan Khusus: Tekan F2 segera setelah logo Dell muncul untuk setup BIOS
. Untuk memilih media boot sekali jalan, tekan F12 saat start-up
.
HP
Laptop & Desktop: Tombol BIOS F10; Tombol Boot Menu Esc, lalu F9
.
Catatan Khusus: Tekan Esc saat boot untuk memunculkan Startup Menu, lalu pilih F9 Boot Options
. Pada menu yang sama, F10 digunakan untuk masuk ke BIOS/UEFI
.
Lenovo
ThinkPad (Laptop): Tombol BIOS F1 (sering kali tekan Enter saat logo, lalu F1); Tombol Boot Menu F12
.
IdeaPad/Yoga (Laptop): Tombol BIOS F2; Tombol Boot Menu F12 atau tombol Novo
.
Desktop (ThinkCentre, dll.): BIOS F1; Boot Menu F12.
Catatan Khusus: Beberapa ThinkPad baru meminta tekan Enter kemudian F1 untuk setup BIOS
. Tombol Novo (lubang kecil dekat port daya) pada IdeaPad membuka menu boot khusus
.
MSI
Laptop & Motherboard: Tombol BIOS Del; Tombol Boot Menu F11
.
Catatan Khusus: Umum untuk laptop gaming/workstation MSI, seperti seri Stealth atau MSI MB, gunakan Del untuk BIOS
.
Gigabyte / AORUS
Motherboard: Tombol BIOS Del; Tombol Boot Menu F12
.
Catatan Khusus: Saat booting, perhatikan petunjuk “Press DEL to enter BIOS” pada layar
.
ASRock
Motherboard: Tombol BIOS F2 atau Del; Tombol Boot Menu F11
.
Catatan Khusus: Kunci-kunci tersebut umum pada sebagian besar motherboard desktop ASRock
.
Toshiba
Laptop: Tombol BIOS F2 (pada model lama tekan Esc lalu F1); Tombol Boot Menu F12
.
Catatan Khusus: Model-model lama (pre-2010) sering menggunakan Esc lalu F1 untuk BIOS
.
Samsung
Laptop: Tombol BIOS F2; Tombol Boot Menu Esc atau F12
.
Catatan Khusus: Beberapa laptop Samsung (misalnya seri Galaxy Book) kadang membutuhkan F10 untuk menu boot pilihan sekali pakai
.
Sony (VAIO)
Laptop: Tombol BIOS F2 (atau tombol Assist); Tombol Boot Menu F11 atau Assist
.
Catatan Khusus: Tekan tombol Assist pada casing saat perangkat mati untuk masuk ke menu pemulihan/boot VAIO
.
Fujitsu
Laptop: Tombol BIOS F2; Tombol Boot Menu F12
.
Catatan Khusus: Biasa digunakan pada laptop bisnis Fujitsu dan Siemens.

Dari Gemini :

Merek	Kategori Perangkat	Seri / Lini Produk	Tombol BIOS / UEFI	Tombol Boot Menu	Wawasan Teknis & Catatan Khusus
Lenovo	Laptop (Bisnis)	ThinkPad, ThinkBook	
F1 (atau Enter lalu F1) 

F12	Jendela waktu POST sangat sempit. Pengguna disarankan untuk menekan Enter berulang kali saat logo muncul untuk memutus startup, lalu memilih opsi yang relevan. Kombinasi interupsi Fn + F1/F12 mungkin dibutuhkan bergantung pada profil penguncian Fn.
Lenovo	Laptop (Konsumer)	IdeaPad, Yoga, Legion	
F2 (atau Fn + F2) 

F12 (atau Fn + F12) 

Rekomendasi utama untuk pengguna awam: Gunakan Tombol Novo (lubang pinhole) saat laptop mati total untuk menghindari adu cepat penekanan tombol, yang akan langsung menyajikan Menu Pra-OS terpadu.

Lenovo	Desktop & AIO	ThinkCentre, IdeaCentre	
F1 

F12	
Pada arsitektur PC desktop, pastikan periferal papan ketik dihubungkan ke proyektor port USB utama di panel belakang (back panel I/O) langsung ke papan induk, alih-alih port sasis depan untuk menjamin registrasi sinyal pra-pemuatan USB.

HP	Semua Laptop	Lini Umum (Pavilion, Omen, EliteBook, ProBook, Envy)	
F10 (atau ESC lalu F10) 

F9 (atau ESC lalu F9) 

Arsitektur HP sangat memusatkan kontrol pada Tombol ESC untuk memutus jalur siklus boot sistem secara instan. Menyarankan penekanan tombol ESC sebagai instruksi prioritas pertama adalah metodologi mitigasi kegagalan yang paling direkomendasikan.
HP	Semua Desktop	Seri Media Center, Pavilion PC, EliteDesk	
F10 (atau ESC lalu F10) 

F9 (atau ESC lalu F9) 

Sama dengan ekosistem laptop, antarmuka interupsi dipertahankan secara identik. Pada mesin berbasis Windows 8 ke atas, modifikasi parameter Secure Boot mungkin diwajibkan untuk mengeksekusi media instalasi lama.

Dell	Laptop	Latitude, Inspiron, XPS, Alienware, Vostro, Precision	
F2 

F12 

Tombol F12 bukan sekadar pemilihan boot. Menu ini mengkapsulasi eksekusi diagnostik perangkat keras internal dan penyediaan fitur peningkatan (flashing) versi BIOS secara independen tanpa bergantung pada lapisan OS (memerlukan berkas.exe pada USB).

Dell	Desktop & AIO	OptiPlex, Inspiron Desktop, XPS Desktop, Alienware Aurora	
F2 

F12 

Secara historis paling konsisten. Persentase tingkat keberhasilan menggunakan parameter F2 dan F12 mendekati metrik keandalan absolut melintasi berbagai generasi produksi.
ASUS	Laptop & AIO	ZenBook, VivoBook, ROG Laptop, TUF Laptop, ExpertBook	
Tahan F2 lalu tekan Tombol Daya 

ESC 

Sinyal interupsi pada laptop ASUS sering tereduksi akibat kecepatan penyimpanan. Jika menu ESC tidak merender partisi USB yang terhubung, Secure Boot dan Fast Boot harus dilumpuhkan dari menu F2 sebelumnya.

ASUS	Komponen PC (Papan Induk)	ROG, TUF, Prime, ProArt (Semua Desktop DIY)	
DEL atau F2 

F8 

Sangat bergantung pada DEL. Setelah memasuki layar manajemen EZ Mode UEFI, tombol fungsional F7 diperuntukkan untuk membuka gerbang konfigurasi Advanced Mode yang lebih ekstensif.

Acer	Semua Laptop & Desktop	Aspire, Predator, Nitro, Spin, Swift	
F2 (atau DEL untuk varian Desktop tertentu) 

F12 

Restriksi Kritis: Fungsionalitas utilitas F12 Boot Menu secara prosedural di-isolasi (Nonaktif/Disabled) pada kondisi perangkat dari pabrik. Pengguna wajib dimandatkan untuk memicu instansiasi F2, mengakses panel Main, memodifikasi variabel F12 Boot Menu menuju parameter Enabled, melakukan komitmen perubahan (simpan), kemudian mengeksekusi Restart.

MSI	Laptop	Semua Lini (Katana, Stealth, Raider, Modern, dsb.)	
DEL 

F11 

Skema komando papan ketik yang koheren lintas generasi. Tersedia pembebasan fitur lanjutan (Advanced BIOS unlocking mode) bagi segmentasi teknisi khusus dengan metode kombo mekanikal rahasia (serangkaian kombo L-Alt + R-CTRL + R-Shift + F2) yang jarang sekali dipublikasikan.

MSI	Komponen PC (Motherboard)	Semua Seri (Z-Series, X-Series, B-Series, dsb.)	
DEL 

F11 

Infrastruktur komponen sangat stabil. Proses inisialisasi menu interupsi pemuatan sistem (boot) ini bersifat merdeka dan langsung tereksekusi tanpa hambatan pembatasan dari papan motherboard kelas perakitan ritel mandiri.
Microsoft	Tablet PC / 2-in-1 / Laptop	Surface Pro, Surface Go, Surface Laptop, Surface Book	
Tahan Volume Up + Tombol Daya 

Tahan Volume Down + Tombol Daya 

Kombo mekanis hardware interrupt. Lepaskan tombol daya segera saat mesin merespons energi, tetapi mutlak krusial untuk terus menahan tombol pengatur volume hingga layar memancarkan manifestasi antarmuka UEFI diagnostik atau sekuens perputaran (spinning dots) yang menandakan siklus penimpaan booting USB sukses terhubung ke layar.

Apple	Komputer Mac	Berbasis Arsitektur Prosesor Intel (Generasi x86 Mac)	
Tahan Command (⌘) + R (Mac OS Recovery Mode) 

Tahan Option (⌥) atau Alt di papan ketik non-Apple 

Metode Startup Manager. Tekanan kombo keyboard dilakukan sedini mungkin menanti munculnya denting aktivasi dari sasis (Startup Chime) atau saat layar memancarkan pendaran LED.

Apple	Komputer Mac	Berbasis Arsitektur Prosesor Apple Silicon (Generasi M1/M2/M3 SoC)	
Tahan Berkelanjutan Tombol Daya (Power Button) 

Tahan Berkelanjutan Tombol Daya (Power Button) 

Era evolusi iBoot2 mendepak intervensi pintasan keyboard multipel masa usang sepenuhnya. Proses integrasi sirkuit tunggal dikerahkan: Tahan terus menerus sirkuit daya pada status sasis mati total. Jangan merenggangkan tekanan hingga layar display memproyeksikan perenderan antarmuka bertuliskan pesan Loading startup options.

ASUS	Ekosistem Handheld Gaming	PC Genggam Portabel ROG Ally	
Tahan Volume Down + Tombol Daya 

Navigasi Terpusat dari antarmuka menu UEFI BIOS	
Menirukan skema deteksi dari subsistem sirkuit komputasi sabak (tablet), memandu transmisi sirkulasi parameter navigasi terintegrasi masuk secara sentral karena eliminasi format komponen kuncian fisik abjad [keyboardless form-factor].

Lenovo	Ekosistem Handheld Gaming	PC Genggam Portabel Legion Go	
Tahan Volume Up + Tombol Daya 

Tahan Volume Up + Tombol Daya 

Prosedur eksekusi memicu transisi sasis memasuki utilitas pra-sistem BIOS berfasilitas fungsi manipulasi parameter dukungan kapabilitas sentuh layar responsif tingkat tinggi di antarmuka depan. Operator harus bermanuver membedah tabulasi sub-menu antarmuka tersebut untuk mengais fitur pendelegasian sirkulasi operasional OS luar menuju perangkat media muat eksternal drive port USB (Boot Menu Select).

Platform Generic (OEM)	Ekosistem Sistem Operasi ChromeOS Google	Laptop Ekosistem Komputasi Awan Chromebook	
Tahan Esc + Refresh + Sekali Tekan Tombol Daya 

Akses utilitas flashing memori dikelola dari fungsionalitas menu instalasi paksa terpusat (Recovery Mode / Developer Mode) 

Konsep rancangan infrastruktur keamanan paranoid Google tidak mengedepankan lingkungan utilitas arsitektur Windows-like BIOS (walled-garden OS containment). Intervensi kombinasi parameter shortcut ekstraterestrial ini merupakan sirkulasi pemanggilan transisi proses pengembang atau pemicu proses sirkuit diagnostik paksa dari media pencitraan perbaikan USB pra-instal.

Platform Generic (OEM)	Ekosistem Sistem Operasi ChromeOS Google	Perangkat Sabak Tablet Murni Chromebook	
Tahan Volume Up + Volume Down + Power Button secara bersamaan 

Akses mode utilitas internal terpandu Recovery secara terpadu	
Intervensi paksa tanpa eksistensi papan ketik mekanik direpresentasikan menggunakan kompresi parameter perangkat peraba tekanan fisik volume diaktifkan terfiksasi menahan kombo secara maraton lebih dari hitungan ritme jeda sinkronisasi timeout absolut sensor keras melebihi durasi kalkulasi 10 detik penuh (hard intercept register).

Gigabyte / AORUS	Semua Platform	Papan Induk (Motherboard), Laptop Aero, Laptop Aorus	
DEL atau F2 

F12 

Arsitektural UEFI sangat konsisten melintasi rentang perangkat komputer desktop dan laptop produksi lini tinggi dan kreasi mereka.
Intel NUC	Desktop Mini / PC Kompak	NUC Systems	
F2 

F10 

Bila sinkronisasi display gagal, metode intervensi manual Power Button Menu tertanam via tahan Power ~3 detik sampai LED merespons indikator, menjadi fitur keselamatan gawat darurat yang absolut mengalahkan rutinitas intervensi OS dan kecepatan peramban Fast Boot.

Sony (VAIO)	Semua Kategori Laptop (Arsip Sasis Lawas)	PCG, VGN, Lini Konsumen	
Eksekusi tekan Tombol ASSIST dari sasis yang tertidur lelap / shutdown state (Atau cadangan manual F2) 

Opsi Start from media/USB dalam ASSIST UI (Atau cadangan manual F11) 

Intervensi via sirkulasi khusus VAIO Care Rescue Mode. Matriks komando menafikan kebutuhan mengkalkulasi waktu tekan kecepatan POST; antarmuka secara intuitif memberikan pemilihan kontrol setup boot yang bebas tekanan.

Samsung	Semua Laptop / Sabak	Galaxy Book, Seri Ativ, Seri 5, 7, Notebook	
F2 

F10 (Pada varian rilis modern mutakhir) atau ESC / F12 (Seri rilis lawas warisan sasis sebelumnya) 

Pemblokiran timing startup fast boot sangat diagresifkan pabrikan demi mengejar skor komputasi boot loading. Kombo interupsi diwajibkan ditekan repetitif merespons sepersekon saat interupsi pasokan listrik diinjeksi ke komponen.

Toshiba / Dynabook	Semua Portabel Jajaran	Tecra, Protege, Satellite	
F2 

F12 

Arsitektur pra-os yang secara teguh diandalkan dari generasi cetak sasis OS PC Windows terdahulu dengan parameter fungsional terhindar perombakan drastis fungsi tombol sasis. F12 berisiko mengalami penyandian silang tanpa memencet tambahan kombo tuas Fn sirkuit teratas.

Fujitsu	Lini Laptop Perangkat	Seri Lifebook Sistem Komersial	
F2 

F12 

Skenario skema firmware terstruktur yang mempertahankan stabilitas operasional klasik interaksi perangkat tanpa intervensi fasa kombinasi yang rumit dalam sistem TPM pengamanan.
Framework	Modular Laptop Sasis	Seluruh Rakitan Modular Produksi Lini	
F2 

F12 

Pabrikan membekukan fitur batas jeda ambang nilai tenggat jeda durasi pembacaan startup firmware sasis murni di angka nilai batas penahanan kalibrasi kosong nol detik (0 seconds timeout boot execution), menantang kecepatan batas reaksi tangan manusia sehingga penekanan iterasi F-keys spam tiada henti wajib diaplikasikan seketika daya dilontarkan.

Axioo, Advan, Zyrex	Sasis Produksi Lokal Regional	Semua Varian Formasi Laptop Lokal	
DEL atau F2 

Mengikuti Standar F12, F11 atau ESC 

Perumusan pangkalan sirkuit lokal mereplikasi parameter tata letak papan rakit ODM perangkat pasokan Tiongkok-Taiwan dengan sistem modul basis perangkat sub-program pra-OS tipe varian insinyur ROM AMI BIOS atau InsydeH2O system software structure antarmuka konvensional.
Infinix	Sasis Ekosistem Elektronik Baru	InBook, Lini Sasis Premium Zero Book	
F2 

F12 

Sasis secara mengejutkan kerap kali mengimplementasikan antarmuka sirkuit integrasi ganda menu diagnostik peramban pemeliharaan sasis tipe utilitas sub-layar OS antarmuka Android-style fast boot loop environment recovery, mengalokasikan parameter intervensi yang merespons tekanan kontrol menahan tombol Power Button bersamaan kombo pautan parameter pengungkit fasa suara Volume Up (+) pada sistem siklus padam.