# Admin & Auth Audit — SnipGeek

## Tujuan

Dokumen ini memetakan arsitektur admin/auth yang saat ini aktif di proyek SnipGeek, untuk menghindari kebingungan soal konfigurasi ganda, API ganda, atau service account yang sebenarnya tidak perlu dibuat ulang.

Fokus audit:

- Firebase Client SDK
- Firebase Admin SDK
- Admin route guard
- Admin API routes
- Reuse pola admin role pada tools lama
- Firestore collections dan rules yang relevan

Dokumen ini bersifat deskriptif: menjelaskan **yang sedang dipakai sekarang**, bukan desain ideal baru.

---

## Ringkasan Eksekutif

Kesimpulan utama audit:

- Tidak ditemukan **dua sistem admin dashboard yang terpisah**.
- Tidak ditemukan **dua Firebase project config yang benar-benar berbeda**.
- Ada **beberapa lapisan yang mirip** dan bisa terasa seperti duplikasi, tetapi sebagian besar adalah:
  - wrapper berbeda untuk kebutuhan berbeda, atau
  - copy-paste pola pengecekan admin role di beberapa tool lama.
- Risiko terbesar saat ini bukan bentrok arsitektur, tetapi **kebingungan karena source of truth belum terdokumentasi**.

Source of truth yang benar saat ini:

- **Firebase client init**: `src/firebase/config.ts`
- **Firebase client context/provider**: `src/firebase/provider.tsx` + `src/firebase/client-provider.tsx`
- **Firebase Admin SDK**: `src/lib/firebase-admin.ts`
- **Admin API auth guard**: `src/lib/api-helpers.ts`
- **Admin role source of truth**: Firestore `roles_admin/{uid}` dengan field `role: "admin"`
- **Admin dashboard UI namespace**: `src/app/admin/*`
- **Admin dashboard API namespace**: `src/app/api/admin/*`

---

## 1. Firebase Client SDK

### Source of truth

File utama:

- `src/firebase/config.ts`

Tanggung jawab file ini:

- membaca env `NEXT_PUBLIC_FIREBASE_*`
- melakukan `initializeApp(...)`
- membuat singleton untuk:
  - `firebaseApp`
  - `auth`
  - `firestore`

### Provider chain yang aktif

Urutan runtime yang dipakai UI:

1. `src/app/admin/layout.tsx`
2. `src/components/layout/firebase-provider-wrapper.tsx`
3. `src/firebase/client-provider.tsx`
4. `src/firebase/provider.tsx`

Artinya, admin page memakai **provider Firebase yang sama** dengan area lain yang memakai wrapper tersebut.

### Temuan penting

Ada file lain:

- `src/lib/firebase-config.ts`

File ini **bukan sistem Firebase kedua** untuk auth/firestore.
File ini dipakai khusus untuk:

- `storage`
- `functions`

Saat ini ditemukan pemakaian di:

- `src/components/tools/compress-pdf/tool-compress-pdf.tsx`

Isi file ini masih reuse project env yang sama (`NEXT_PUBLIC_FIREBASE_*`) dan juga reuse app dari `getApp()` / `getApps()`.

### Kesimpulan

- **Bukan bentrok project**
- **Bukan inisialisasi app yang beda proyek**
- Tapi memang **membingungkan**, karena ada dua file bernama mirip:
  - `src/firebase/config.ts`
  - `src/lib/firebase-config.ts`

### Rekomendasi

Jangka pendek:

- pertahankan dulu, karena tidak rusak secara runtime

Jangka menengah:

- konsolidasikan `src/lib/firebase-config.ts` agar jelas bahwa itu hanya wrapper untuk `storage/functions`
- idealnya nanti semua client Firebase service diambil dari satu modul yang terdokumentasi

---

## 2. Firebase Admin SDK

### Source of truth

File utama:

- `src/lib/firebase-admin.ts`

Tanggung jawab:

- inisialisasi `firebase-admin`
- pilih mode auth:
  - Cloud Run / App Hosting: ADC
  - local dev: `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
- expose:
  - `adminDb`
  - `adminAuth`

### Status arsitektur

Ini adalah **satu-satunya** modul Firebase Admin SDK yang ditemukan sebagai source of truth di kode server modern admin.

Dipakai oleh:

- `src/lib/api-helpers.ts`
- `src/app/api/admin/index-status/route.ts`
- `src/app/api/admin/gsc/inspect/route.ts`
- `src/app/api/numbers/categories/route.ts`
- `src/app/api/numbers/generate/route.ts`

### Temuan penting

Tidak ditemukan modul Firebase Admin lain yang bersaing untuk admin dashboard.

### Risiko yang perlu diingat

Masalah local dev sering terasa seperti “konfigurasi ganda”, padahal biasanya salah satu dari ini:

- `FIREBASE_CLIENT_EMAIL` dan `FIREBASE_PRIVATE_KEY` mismatch
- private key lama sudah tidak valid
- service account env benar, tetapi project/rules belum sinkron

### Kesimpulan

- **Tidak ada double Admin SDK architecture**
- Semua API server-side yang serius sudah mengarah ke `src/lib/firebase-admin.ts`

---

## 3. Admin Role Source of Truth

### Source of truth

Firestore collection:

- `roles_admin/{uid}`

Payload yang dipakai:

```json
{
  "role": "admin"
}
```

### Dipakai di mana saja

Client-side checks:

- `src/components/admin/admin-guard.tsx`
- `src/components/tools/numbers/use-tool-numbers.ts`
- `src/components/tools/employee-history/use-employee-history.ts`
- `src/components/tools/tool-bios-keys.tsx`

Server-side checks:

- `src/lib/api-helpers.ts`
- `src/app/api/numbers/generate/route.ts`

### Temuan penting

Di sini memang ada **duplikasi pola**, bukan duplikasi data model.

Semua tempat memakai **source of truth yang sama**, yaitu `roles_admin/{uid}`.

Yang berulang adalah implementasinya:

- client tools lama melakukan `getDoc(doc(firestore, 'roles_admin', user.uid))`
- admin API modern melakukan `verifyIdToken(...)` lalu cek `roles_admin`

### Kesimpulan

- **Data source tunggal**: aman
- **Implementasi pengecekan berulang**: perlu dikonsolidasikan nanti agar tidak bikin bingung

### Rekomendasi

Jangka pendek:

- jangan ubah behavior dulu

Jangka menengah:

- buat helper client-side terpusat, misalnya hook seperti `useAdminRole()`
- route admin dashboard dan tools lama bisa share hook itu

---

## 4. Admin UI / Route Namespace

### Namespace yang benar untuk admin dashboard baru

Pages:

- `src/app/admin/layout.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/content/page.tsx`

Components:

- `src/components/admin/admin-shell.tsx`
- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/admin-guard.tsx`
- `src/components/admin/dashboard-overview.tsx`
- `src/components/admin/content-table.tsx`
- `src/components/admin/admin-api-client.ts`

### Temuan penting

Tidak ditemukan admin dashboard lama kedua di namespace lain.

Yang ada adalah:

- tools individual lama yang punya mode admin masing-masing
- mereka bukan dashboard admin global, melainkan tool-specific admin affordance

Contoh:

- Number Generator punya admin inject / category management
- Employee History punya admin inject
- BIOS Keys punya admin CRUD

### Kesimpulan

- **Admin dashboard baru tidak duplikat secara route/page**
- Yang terasa “mirip” adalah admin affordance di masing-masing tools lama

---

## 5. Admin API Routes

### Namespace admin dashboard baru

- `GET /api/admin/content-inventory`
- `GET /api/admin/index-status`
- `POST /api/admin/index-status`
- `POST /api/admin/gsc/inspect`

Semua route di atas memakai pola modern:

- `requireAdmin(req)` dari `src/lib/api-helpers.ts`
- akses Firestore via `getAdminDb()`

### Route lama yang tetap memakai admin role

- `/api/numbers/categories`
- `/api/numbers/generate`

### Temuan penting

Tidak ditemukan duplicate endpoint untuk fungsi yang sama dengan dashboard baru.

Yang ada:

- **admin dashboard API** di `/api/admin/*`
- **tool-specific API** di `/api/numbers/*`

### Catatan penting

`/api/numbers/generate` belum sepenuhnya reuse helper `requireAdmin` karena dia butuh mode campuran:

- anonymous user
- signed-in non-admin
- signed-in admin

Jadi endpoint itu memang punya logika auth sendiri dan wajar tidak identik 100% dengan dashboard admin.

### Kesimpulan

- **Tidak ada API ganda untuk dashboard admin**
- Ada **dua gaya auth-check server-side**:
  - pola modern terpusat di `api-helpers`
  - pola spesifik per-endpoint di `numbers/generate`

---

## 6. Firestore Rules yang Relevan

File rules:

- `firestore.rules`

Blok penting:

### Admin role lookup

```txt
match /roles_admin/{userId} {
  allow read: if isSignedIn() && request.auth.uid == userId;
  allow write: if isAdmin();
}
```

### Admin-only dashboard collection

```txt
match /indexStatus/{urlHash} {
  allow read, write: if isAdmin();
}
```

### Tool collections yang reuse admin role

- `availableNumbers`
- `documentTypeConfig`
- `employee_history`
- `media_library`
- `bios_keys`
- `audit_logs`

### Temuan penting

Rules sudah mendesain `roles_admin` sebagai source of truth bersama.

Artinya dashboard admin baru **sudah aligned** dengan model lama proyek.

### Risiko aktual

Kalau UI admin masih menampilkan “Access Denied” padahal doc `roles_admin/{uid}` ada, kemungkinan terbesar bukan desain ganda, tetapi salah satu dari:

- Firestore rules belum ter-deploy sesuai file lokal
- pembacaan doc client-side kena permission error
- `useDoc` mengembalikan `data: null` saat error, lalu UI menafsirkan sebagai “bukan admin”

Ini adalah masalah observability / debug UX, bukan masalah arsitektur ganda.

---

## 7. Area Duplikasi yang Nyata

Berikut area yang memang nyata duplicated / semi-duplicated:

### A. Client Firebase config naming

- `src/firebase/config.ts`
- `src/lib/firebase-config.ts`

Status:

- aman secara runtime
- membingungkan secara naming

### B. Client-side admin role check

Dipakai ulang di beberapa tempat dengan pola mirip:

- admin dashboard guard
- number generator
- employee history
- bios keys

Status:

- tidak bentrok
- rawan drift bila suatu hari rule admin berubah

### C. Server-side admin verification style

- modern: `src/lib/api-helpers.ts`
- khusus endpoint: `src/app/api/numbers/generate/route.ts`

Status:

- masih masuk akal
- perlu dicatat agar AI lain tidak salah paham bahwa ini dua sistem auth berbeda

---

## 8. Area yang BUKAN Duplikasi Berbahaya

### Bukan duplikasi berbahaya 1

`src/lib/firebase-config.ts`

Ini bukan project Firebase kedua. Dia masih memakai env project yang sama.

### Bukan duplikasi berbahaya 2

Admin affordance di tools lama

Ini bukan admin dashboard kedua. Itu hanya fitur admin di masing-masing tool.

### Bukan duplikasi berbahaya 3

Client-side guard dan server-side guard

Keduanya memang perlu hidup berdampingan:

- client guard untuk UX / page protection
- server guard untuk API protection

---

## 9. Rekomendasi Konsolidasi Bertahap

### Tahap 1 — Dokumentasi dan observability

Lakukan dulu:

- simpan dokumen audit ini
- pertahankan logging debug sementara sampai masalah Access Denied selesai dipastikan

### Tahap 2 — Konsolidasi helper client admin role

Buat helper/hook tunggal, misalnya:

- `src/firebase/use-admin-role.ts`

Tujuan:

- dipakai oleh `AdminGuard`
- dipakai oleh tool lama yang butuh `isAdminUser`

### Tahap 3 — Rapikan naming Firebase config

Tujuan:

- jelas mana config utama
- jelas mana wrapper service khusus storage/functions

Contoh arah:

- `src/firebase/config.ts` tetap utama
- `src/lib/firebase-config.ts` diganti nama menjadi sesuatu yang lebih spesifik, misalnya wrapper storage/functions

### Tahap 4 — Konsolidasi server auth logic bila perlu

Bukan prioritas pertama, tapi idealnya nanti:

- logic admin verification reusable dipusatkan semaksimal mungkin
- endpoint khusus seperti `numbers/generate` tetap boleh punya flow custom bila memang butuh anonymous + admin + signed-in hybrid

---

## 10. Checklist Validasi Agar Tidak Muter Lagi

Gunakan checklist ini setiap kali admin/auth terasa bermasalah.

### A. Validasi identitas admin

- Firebase Auth user email benar
- UID user benar
- doc `roles_admin/{uid}` ada
- field `role` bernilai `admin`

### B. Validasi Firebase client

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### C. Validasi Firebase Admin SDK local dev

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- private key format valid
- service account masih aktif

### D. Validasi Firestore rules

Pastikan rules yang aktif di Firebase Console sesuai file lokal, terutama:

- read own `roles_admin/{uid}`
- admin-only `indexStatus/{id}`

### E. Validasi API layer

- request ke `/api/admin/*` membawa `Authorization: Bearer <idToken>`
- `verifyIdToken()` sukses
- server-side check ke `roles_admin` sukses

### F. Validasi interpretasi UI

Kalau read role doc error di client, UI jangan langsung dianggap “bukan admin” tanpa pesan error yang jelas.

---

## 11. Status Saat Audit Ini Ditulis

Yang sudah dipastikan dari kode:

- admin dashboard baru ada di `/admin`
- admin API baru ada di `/api/admin/*`
- Firebase Admin source of truth tunggal ada di `src/lib/firebase-admin.ts`
- Firestore admin role source of truth tunggal ada di `roles_admin/{uid}`
- tool lama masih reuse source of truth yang sama

Yang masih perlu divalidasi di runtime:

- apakah Firestore rules yang ter-deploy sama dengan file lokal
- apakah Access Denied saat ini datang dari permission error atau state handling UI

---

## 12. Keputusan Praktis Saat Ini

Untuk menghindari bentrok dan kerja ulang yang tidak perlu:

- **jangan buat Firebase project/config baru**
- **jangan buat service account baru kecuali memang kredensial lama invalid**
- **jangan buat admin collection baru selain `roles_admin`**
- lanjutkan dengan arsitektur yang sudah ada
- prioritaskan konsolidasi helper dan dokumentasi, bukan mengganti fondasi

---

## File Referensi Utama

### Client Firebase

- `src/firebase/config.ts`
- `src/firebase/provider.tsx`
- `src/firebase/client-provider.tsx`
- `src/firebase/non-blocking-login.tsx`

### Admin SDK / server auth

- `src/lib/firebase-admin.ts`
- `src/lib/api-helpers.ts`

### Admin dashboard

- `src/app/admin/layout.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/content/page.tsx`
- `src/components/admin/admin-guard.tsx`
- `src/components/admin/admin-api-client.ts`

### Tool lama yang reuse admin role

- `src/components/tools/numbers/use-tool-numbers.ts`
- `src/components/tools/employee-history/use-employee-history.ts`
- `src/components/tools/tool-bios-keys.tsx`
- `src/app/api/numbers/generate/route.ts`
- `src/app/api/numbers/categories/route.ts`

### Rules

- `firestore.rules`
