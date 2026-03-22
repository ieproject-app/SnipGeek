# Panduan Integrasi Pickster (Instruksi untuk AI)

Salin pesan di bawah ini dan berikan ke AI di proyek baru Anda untuk mengintegrasikan Pickster secara otomatis:

---

**PROMPT UNTUK AI:**

"Saya telah menyalin file fitur 'Pickster' (Pengacak Nama) ke proyek ini. Bantu saya melakukan 'wiring' atau penyambungan agar fitur ini berfungsi sesuai standar Next.js 15 dan ShadCN di proyek ini. Berikut adalah langkah-langkah yang perlu dilakukan:

1. **Dependensi:** Pastikan paket `react-confetti`, `lucide-react`, dan `next-themes` sudah terinstal.
2. **Layout Wrapper:** Buka `src/app/layout.tsx`. Bungkus `{children}` dengan `LanguageProvider` (dari `@/context/language-context`) di dalam `ThemeProvider`.
3. **Konfigurasi Tailwind:** Buka `tailwind.config.ts`. Tambahkan keyframes dan animasi berikut ke dalam `theme.extend`:
   - Keyframes: `winner-flash`, `countdown-pop`, `winner-reveal`, `dot-pulse`.
   - Animations: Masukkan animasi yang sesuai dengan keyframes tersebut (durasi 0.2s - 1.2s).
4. **CSS Variables:** Pastikan variabel warna di `src/app/globals.css` mendukung skema warna `primary` hijau/emerald agar sesuai dengan UI Pickster.
5. **Panggil Komponen:** Buat rute baru (misal: `src/app/pickster/page.tsx`) dan panggil komponen `<PicksterClient />` dari `@/components/pickster/pickster-client`.

Gunakan file-file yang sudah ada di folder `src/components/pickster/`, `src/context/`, `src/locales/`, dan `src/hooks/use-sound-effects.ts` sebagai referensi utama. Jangan mengubah logika pengacaknya, cukup pastikan integrasi sistem bahasa dan tema berjalan lancar."

---

## Daftar File yang Wajib Ada:
- `src/components/pickster/` (Seluruh folder)
- `src/context/language-context.tsx` (Mesin Bahasa)
- `src/locales/id.json` & `en.json` (Kamus Teks)
- `src/hooks/use-sound-effects.ts` (Efek Suara)
- `src/types/react-confetti.d.ts` (Type Definition)