
# SnipGeek - Modern Tech Blog & Internal Toolkit

SnipGeek adalah website berperforma tinggi yang berfungsi ganda sebagai blog teknologi publik dan kumpulan alat internal untuk manajemen administrasi. Dibangun dengan Next.js 15, React 19, dan Firebase.

## ✨ Fitur Utama

### 1. Blog Teknologi (Public)
Blog minimalis dengan dukungan MDX untuk artikel teknis yang kaya akan komponen interaktif.

### 2. Alat Internal & Publik
- **🧑‍💼 Riwayat Karyawan (Public Access):** Pencarian data pejabat dan generator penandatangan dokumen (BAUT, BAST, dll).
- **🤖 AI Article Prompt Generator (Public Access):** Pembuat prompt AI terstruktur untuk konten artikel baru atau modifikasi.
- **🔐 Nomor Generator (Restricted):** Generator nomor urut dokumen resmi (Memerlukan Login Google).
- **🏠 Dynamic Header (Back to Site):** Header cerdas yang mengenali posisi halaman dan memberikan navigasi cepat kembali ke beranda.
- **🌓 Smart Theme Management:** Mengikuti preferensi sistem secara otomatis, dengan dukungan penyimpanan pilihan manual selama 1 minggu.

## 🚀 Panduan Konfigurasi Firebase (PENTING)

Untuk menjalankan aplikasi ini dengan fitur Cloud aktif, Anda harus memastikan variabel lingkungan tersedia saat proses **Build**.

### 1. File `apphosting.yaml`
Aplikasi ini menggunakan metode "Value Injection" di `apphosting.yaml` untuk menjamin kunci API tersedia tepat waktu saat Next.js merakit halaman. Pastikan nilai di file tersebut sesuai dengan yang ada di Firebase Console.

### 2. Langkah Deployment
1. Lakukan `git push` ke branch `main`.
2. Buka Firebase Console -> **App Hosting**.
3. Pergi ke tab **Rollouts** dan klik **"Start Rollout"** setiap kali ada perubahan pada file `apphosting.yaml`.

## 🛠️ Stack Teknologi
- **Framework**: Next.js 15 (App Router)
- **Auth & Database**: Firebase (Auth & Firestore)
- **UI**: ShadCN UI + Tailwind CSS
- **Icons**: Lucide React
