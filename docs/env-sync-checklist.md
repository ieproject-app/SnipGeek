# Env Sync Checklist — Admin Dashboard

Dokumen ini dipakai untuk memastikan dashboard admin memakai **Firebase project yang sama** di local development dan di cloud.

Tujuan utamanya:

- mencegah local menunjuk ke project berbeda dari cloud
- mencegah Firebase client dan Firebase Admin membaca data dari project berbeda
- memastikan `roles_admin`, Firestore rules, dan admin API semuanya sinkron

---

## 1. Prinsip Dasar

Ada 3 lapisan konfigurasi yang perlu dibedakan:

### A. Public client config

Dipakai oleh Firebase client SDK di browser.

Harus sama antara local dan cloud:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` jika analytics dipakai

### B. Server credential

Dipakai oleh Firebase Admin SDK.

Boleh beda cara penyediaannya:

- local: `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
- cloud: Application Default Credentials / runtime identity

Tetapi tetap harus mengarah ke **project Firebase yang sama**.

### C. Data target

Harus sama antara local dan cloud:

- Firestore project
- Firebase Auth project
- collection `roles_admin`
- Firestore rules yang aktif

---

## 2. Source of Truth di Repo

### Client Firebase

- `src/firebase/config.ts`
- `src/lib/firebase-config.ts`

Keduanya membaca:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK

- `src/lib/firebase-admin.ts`

Di local development, file ini membutuhkan:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Di cloud runtime, file ini mendeteksi `K_SERVICE` dan memakai runtime identity.

### GSC integration

- `src/app/api/admin/gsc/inspect/route.ts`

Env yang dibutuhkan saat fitur GSC diaktifkan:

- `GSC_SERVICE_ACCOUNT_JSON`
- `GSC_SITE_URL`

### Cloud hosting config

- `apphosting.yaml`

Saat ini file tersebut sudah mendeklarasikan sebagian env Firebase public.

---

## 3. Checklist Sinkronisasi Local vs Cloud

### Langkah 1 — Tetapkan project Firebase canonical

Pastikan hanya ada satu project yang dipakai dashboard admin.

Cek nilai berikut dan pastikan semuanya menunjuk ke project yang sama:

- Firebase Console > Project settings
- `apphosting.yaml`
- `.env.local`
- service account local

Nilai yang saat ini terlihat di repo:

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-8697076532-14512`

Kalau ini memang project production yang benar, maka semua env local dan cloud harus mengarah ke project ini.

### Langkah 2 — Samakan env public

Bandingkan nilai di `.env.local` dengan Firebase Console dan App Hosting:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Semua nilai ini harus berasal dari **Firebase Web App yang sama**.

### Langkah 3 — Validasi local Admin SDK

Pastikan local development memakai service account dari project yang sama.

Cek:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Aturan aman:

- email service account harus milik project yang sama
- private key harus pasangan dari email itu
- key masih aktif

### Langkah 4 — Validasi cloud runtime

Untuk cloud, fokus ke runtime identity, bukan key local.

Pastikan:

- App Hosting / Cloud Run memakai project Firebase yang sama
- runtime service account punya akses Firestore dan Auth
- env public di cloud sama dengan local

Catatan:

- `NEXT_PUBLIC_FIREBASE_API_KEY` saat ini dicatat diset di Firebase App Hosting console
- jangan lupa samakan nilainya dengan `.env.local`

### Langkah 5 — Validasi Firestore rules

File source:

- `firestore.rules`

Pastikan rules ini sudah ter-deploy ke project Firebase yang sama.

Hal minimum yang harus benar:

- user bisa read `roles_admin/{uid}` miliknya sendiri
- admin bisa read/write `indexStatus/{id}`

### Langkah 6 — Validasi doc admin

Pastikan document ini ada di Firestore project yang sama:

- `roles_admin/{YOUR_UID}`

Isi minimum:

```json
{
  "role": "admin"
}
```

### Langkah 7 — Validasi alur dashboard

Setelah env sinkron, cek urutan ini:

- login ke `/admin/login`
- user berhasil sign-in
- `AdminGuard` membaca `roles_admin/{uid}`
- `/api/admin/content-inventory` berhasil
- `/api/admin/index-status` berhasil

Kalau salah satu gagal, debug selalu mulai dari project/env yang dipakai request itu.

---

## 4. Matrix Env

## Env yang wajib sama di local dan cloud

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_GISCUS_REPO_ID`
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`
- `NEXT_PUBLIC_INTERNAL_TOOL_ALLOWLIST` jika dipakai

## Env khusus local development

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Env server-side optional per fitur

- `GSC_SERVICE_ACCOUNT_JSON`
- `GSC_SITE_URL`
- `IP_HASH_SALT`
- `GEMINI_API_KEY`

---

## 5. Gejala Umum dan Artinya

### Login sukses tapi admin ditolak

Biasanya salah satu dari ini:

- `roles_admin/{uid}` tidak ada di project yang benar
- Firestore rules belum ter-deploy
- local/cloud menunjuk ke project berbeda

### Admin API 401 atau 403

Biasanya salah satu dari ini:

- token bearer tidak terbawa
- Firebase Admin SDK membaca project berbeda
- runtime cloud/local credential tidak sinkron ke project yang sama

### UI terasa baca data kosong

Biasanya salah satu dari ini:

- env public menunjuk ke project berbeda
- collection benar ada, tapi di project lain
- rules aktif di Firebase tidak sama dengan file lokal

---

## 6. Urutan Kerja yang Disarankan

Kerjakan dengan urutan berikut:

1. samakan `NEXT_PUBLIC_FIREBASE_*`
2. validasi service account local
3. pastikan rules ter-deploy
4. pastikan `roles_admin/{uid}` ada
5. tes login admin
6. tes `/api/admin/content-inventory`
7. tes `/api/admin/index-status`
8. aktifkan GSC belakangan

---

## 7. Keputusan Praktis

Untuk dashboard admin ini:

- jangan buat Firebase project baru
- jangan buat admin collection baru selain `roles_admin`
- jangan buat service account baru kecuali key lama invalid
- sinkronkan local dan cloud ke project yang sudah dipakai saat ini
