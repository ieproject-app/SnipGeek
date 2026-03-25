# Panduan Pengembangan Proyek: PDF Tools Architecture

Dokumen ini berfungsi sebagai cetak biru (blueprint) untuk arsitektur dan standar pengembangan aplikasi PDF Tools. Gunakan panduan ini sebagai referensi saat ingin menduplikasi atau mengembangkan proyek serupa.

## 1. Arsitektur Utama
Aplikasi ini dibangun menggunakan **Next.js 15 (App Router)** dengan fokus pada pemrosesan sisi klien (Client-side Processing) untuk menjaga privasi data pengguna.

### Struktur Direktori Utama:
- `src/app/`: Rute aplikasi, layout, dan halaman utama.
- `src/app/tools/`: Direktori khusus untuk setiap fitur alat PDF (masing-masing memiliki rute sendiri).
- `src/components/`: Komponen UI yang dapat digunakan kembali.
- `src/context/`: Manajemen state global (seperti Bahasa/Language).
- `src/lib/`: Utilitas logika bisnis, algoritma pencarian, dan konfigurasi pihak ketiga.
- `src/types/`: Definisi tipe TypeScript untuk konsistensi data.

## 2. Tech Stack & Library Utama
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS + ShadCN UI (Komponen berbasis Radix UI).
- **Ikon:** Lucide React.
- **Pemrosesan PDF:**
  - `pdf-lib`: Untuk manipulasi struktur PDF (gabung, pisah, tambah teks/nomor halaman).
  - `pdfjs-dist`: Untuk membaca isi teks, render thumbnail, dan ekstraksi metadata.
- **OCR (Optical Character Recognition):** `tesseract.js` (untuk memproses PDF hasil scan).
- **Eksport Data:** `xlsx` (Excel) dan `file-saver` (Download).
- **Validasi:** Zod + React Hook Form.

## 3. Standar UI/UX (Design System)
Ikuti pola warna dan gaya yang didefinisikan dalam `src/app/globals.css`:
- **Primary:** Biru Tenang (#6699CC) - Melambangkan profesionalisme.
- **Accent:** Hijau Lembut (#8FBC8F) - Digunakan untuk hasil positif atau CTA utama.
- **Background:** Abu-abu sangat terang (#F0F0F0) - Mengurangi kelelahan mata.
- **Rounded Corners:** Gunakan `rounded-lg` (0.5rem) untuk konsistensi kartu dan tombol.

## 4. Internasionalisasi (Multi-bahasa)
Aplikasi mendukung Bahasa Indonesia (`id`) dan Inggris (`en`).
- Gunakan `LanguageContext` di `src/context/language-context.tsx`.
- Simpan objek `translations` di dalam file halaman (`page.tsx`) atau file terpisah jika terlalu besar.
- **Pola:** `const t = translations[lang];`

## 5. Cara Menambahkan Alat (Tool) Baru
1. Buat folder baru di `src/app/tools/[nama-alat]`.
2. Buat file `layout.tsx` untuk definisi Metadata SEO.
3. Buat file `page.tsx` dengan struktur:
   - Header (Judul & Deskripsi).
   - Content (Upload Dropzone / Input Form).
   - Footer (Progress Bar & Tombol Aksi).
4. Daftarkan alat baru tersebut di array `tools` pada `src/app/page.tsx` agar muncul di halaman utama.

## 6. Prinsip Pemrosesan File
- **Privacy First:** Lakukan semua pemrosesan di browser pengguna (Client-side) jika memungkinkan.
- **Optimis UI:** Tampilkan Progress Bar saat melakukan proses berat agar pengguna tahu aplikasi sedang bekerja.
- **Cleanup:** Selalu gunakan `URL.revokeObjectURL` setelah file diunduh untuk mencegah kebocoran memori (Memory Leak).

## 7. Deployment (Firebase App Hosting)
Proyek ini dikonfigurasi untuk Firebase App Hosting:
- File `apphosting.yaml` mengatur region (`asia-southeast2`) dan resource server.
- Pastikan `next.config.ts` mengabaikan build errors untuk TypeScript/ESLint jika Anda ingin proses deploy lebih cepat di tahap prototype.

---
*Dokumen ini diperbarui secara berkala seiring perkembangan fitur baru.*