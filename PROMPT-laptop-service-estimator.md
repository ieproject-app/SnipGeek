# PROMPT — Laptop Service Price Estimator Tool
# Target AI: Antigravity | Project: SnipGeek (snipgeek.com)
# Route: /tools/laptop-service-estimator

---

## Konteks Proyek

SnipGeek adalah tech blog bilingual (Indonesia/English) yang dibangun dengan Next.js App Router, Firebase backend, dan di-deploy via Firebase App Hosting. Ikuti semua konvensi yang ada di `SnipGeek/.agent/skills/snipgeek-rules/SKILL.md` untuk design system, komponen, dan naming convention.

---

## Tugas

Buat halaman tools baru: **Laptop Service Price Estimator**. Tools ini membantu pengunjung mendapatkan estimasi harga servis laptop secara instan menggunakan AI (Google Gemini free tier), lalu mengarahkan mereka ke WhatsApp Business untuk konsultasi langsung.

---

## Files yang Harus Dibuat

### 1. `src/app/api/tools/estimate/route.ts`

Next.js Route Handler (method: POST). Semua logika pemanggilan Gemini API harus ada di sini — **jangan pernah expose API key ke client**.

**Request body yang diterima:**
```ts
{
  brand: string        // wajib — merek laptop (contoh: "Asus", "Lenovo")
  model: string        // opsional — seri/model (contoh: "VivoBook 14 A416")
  services: string[]   // array nama servis yang dipilih
}
```

**Endpoint Gemini:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}
```

**Request body ke Gemini:**
```json
{
  "contents": [
    {
      "parts": [
        { "text": "<isi prompt di bawah>" }
      ]
    }
  ]
}
```

**Prompt yang dikirim ke Gemini (build secara dinamis di route handler):**

```
Kamu adalah asisten estimasi harga servis laptop di toko teknisi Indonesia.

INFORMASI LAPTOP DARI PELANGGAN:
- Merek: ${brand}
${model ? `- Seri/Model: ${model}` : "- Seri/Model: tidak disebutkan oleh pelanggan"}

TUGASMU TERKAIT INFO LAPTOP:
${model
  ? `Cari spesifikasi umum untuk "${brand} ${model}". Sertakan: processor, RAM default, storage default, ukuran layar, dan tahun rilis perkiraan. Jika tidak ditemukan data pasti, berikan estimasi umum berdasarkan merek dan seri.`
  : `Seri tidak diketahui. Hanya gunakan merek "${brand}" sebagai konteks. Set found: false, isi name dengan "${brand} (seri tidak diketahui)", kosongkan field spesifikasi lainnya.`
}

SERVIS YANG DIMINTA PELANGGAN:
${services.map(s => `- ${s}`).join('\n')}

MASTER HARGA JASA (WAJIB ikuti range ini, jangan keluar dari angka ini):
- Ganti Thermal Paste: Rp 50.000 – Rp 100.000
- Cleaning Internal: Rp 75.000 – Rp 150.000
- Jasa Upgrade RAM: Rp 50.000 – Rp 75.000
- Jasa Upgrade SSD/HDD: Rp 75.000 – Rp 100.000
- Instal Ulang OS: Rp 100.000 – Rp 150.000
- Jasa Ganti Layar: Rp 200.000 – Rp 350.000
- Jasa Ganti Keyboard: Rp 100.000 – Rp 200.000
- Diagnosa Hardware: Rp 50.000 – Rp 100.000
- Repair Hardware Minor: Rp 150.000 – Rp 350.000

Kamu boleh menyesuaikan sedikit angka dalam range berdasarkan kompleksitas laptop jika ada info spesifikasi (misal: laptop gaming lebih kompleks dibongkar).

Balas HANYA dengan JSON berikut — tanpa markdown, tanpa backtick, tanpa teks lain:
{
  "laptop": {
    "found": true,
    "name": "nama lengkap laptop atau fallback jika tidak ada model",
    "processor": "...",
    "ram": "...",
    "storage": "...",
    "display": "...",
    "year": "..."
  },
  "items": [
    {
      "service": "nama servis",
      "note": "catatan singkat jika ada, atau string kosong",
      "min": 50000,
      "max": 100000
    }
  ],
  "total_min": 200000,
  "total_max": 400000,
  "notes": "1–2 kalimat catatan umum untuk pelanggan"
}
```

**Cara ambil response dari Gemini:**
```ts
const text = data.candidates[0].content.parts[0].text
const clean = text.replace(/```json|```/g, "").trim()
const parsed = JSON.parse(clean)
```

**Return ke client:** JSON parsed langsung. Jika error, return `{ error: "Gagal memproses estimasi. Silakan coba lagi." }` dengan status 500.

---

### 2. `src/app/tools/laptop-service-estimator/page.tsx`

**Metadata:**
```ts
export const metadata = {
  title: 'Laptop Service Price Estimator | SnipGeek Tools',
  description: 'Estimasi biaya servis laptop kamu secara instan dengan AI. Dapatkan rincian harga jasa dan langsung konsultasi via WhatsApp.',
}
```

Page ini adalah Server Component. Buat komponen interaktif terpisah di file `_components/EstimatorClient.tsx` (gunakan `'use client'`).

---

#### UI: EstimatorClient.tsx

**State yang dikelola:**
```ts
brand: string           // input merek — wajib
model: string           // input model — opsional
selectedServices: string[]
step: 'form' | 'loading' | 'result'
result: EstimateResult | null
error: string | null
```

**Type:**
```ts
type EstimateResult = {
  laptop: {
    found: boolean
    name: string
    processor?: string
    ram?: string
    storage?: string
    display?: string
    year?: string
  }
  items: {
    service: string
    note: string
    min: number
    max: number
  }[]
  total_min: number
  total_max: number
  notes: string
}
```

---

#### TAHAP 1 — Form

**Section A: Informasi Laptop**

```
Label: "Laptop Brand" — input teks, REQUIRED
  placeholder: "e.g. Asus, Lenovo, HP, Acer, Dell..."
  Validasi: tidak boleh kosong sebelum submit
  
Label: "Series / Model" — input teks, OPTIONAL
  placeholder: "e.g. VivoBook 14 A416, ThinkPad E14 (optional)"
  Tambahkan helper text kecil di bawah:
  "Isi jika kamu tahu seri laptopnya — AI akan cari spesifikasinya otomatis."
```

**Section B: Pilih Servis**

Grid 2 kolom (mobile: 1 kolom). Setiap card berisi:
- Nama servis
- Deskripsi singkat
- Range harga

Data servis (hardcode di client):
```ts
const SERVICES = [
  { id: "thermal",   label: "Ganti Thermal Paste",   desc: "Aplikasi thermal paste baru untuk CPU/GPU",                        min: 50000,  max: 100000 },
  { id: "cleaning",  label: "Cleaning Internal",      desc: "Bersih fan, heatsink, dan debu internal",                         min: 75000,  max: 150000 },
  { id: "ram",       label: "Jasa Upgrade RAM",       desc: "Pasang/ganti modul RAM (belum termasuk harga RAM)",               min: 50000,  max: 75000  },
  { id: "ssd",       label: "Jasa Upgrade SSD/HDD",   desc: "Pasang storage baru (belum termasuk harga part)",                 min: 75000,  max: 100000 },
  { id: "os",        label: "Instal Ulang OS",        desc: "Windows 10/11 atau Linux, include driver",                        min: 100000, max: 150000 },
  { id: "screen",    label: "Jasa Ganti Layar",       desc: "Bongkar pasang panel layar (belum termasuk harga layar)",        min: 200000, max: 350000 },
  { id: "keyboard",  label: "Jasa Ganti Keyboard",    desc: "Bongkar pasang keyboard (belum termasuk harga keyboard)",        min: 100000, max: 200000 },
  { id: "diagnosa",  label: "Diagnosa Hardware",      desc: "Cek & identifikasi kerusakan hardware",                          min: 50000,  max: 100000 },
  { id: "repair",    label: "Repair Hardware Minor",  desc: "Perbaikan hardware minor (IC, solder, port USB, dll)",           min: 150000, max: 350000 },
]
```

Format rupiah helper:
```ts
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
```

**Tombol Submit:**
- Label: `"Get Estimate"`
- Disabled jika: `brand.trim() === ""` ATAU `selectedServices.length === 0`
- Saat disabled, tampilkan hint teks kecil: `"Fill in laptop brand and select at least one service"`

**Saat submit:**
```ts
const res = await fetch('/api/tools/estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brand: brand.trim(),
    model: model.trim(),
    services: selectedServices
  })
})
const data = await res.json()
```

---

#### TAHAP 2 — Loading State

Tampilkan skeleton atau spinner sederhana dengan teks:
```
"AI is analyzing your laptop and calculating service costs..."
```

---

#### TAHAP 3 — Hasil Estimasi

**A. Card Info Laptop**

Selalu tampilkan (karena merek wajib diisi). Bedakan tampilannya:

*Jika `laptop.found === true` (model diisi & spek ditemukan):*
- Tampilkan nama laptop sebagai heading
- Grid spek: Processor | RAM | Storage | Display | Year

*Jika `laptop.found === false` (hanya merek, model tidak diisi):*
- Tampilkan: `"${brand} — model not specified"`
- Tambahkan note kecil muted: `"Technician will confirm device details during WhatsApp consultation"`

---

**B. Tabel Rincian Harga**

```
| Service          | Min Price    | Max Price    |
|------------------|-------------|-------------|
| Cleaning Internal| Rp 75.000   | Rp 150.000  |
| ...              | ...         | ...         |
|------------------|-------------|-------------|
| TOTAL ESTIMATE   | Rp 175.000  | Rp 350.000  |
```

Setiap baris: tampilkan `item.note` sebagai teks kecil muted di bawah nama servis jika tidak kosong.

---

**C. Disclaimer**

Teks kecil, warna muted, di bawah tabel:
```
"Prices above are service/labor costs only. Component/spare part costs are not included. 
Final price will be confirmed after direct device inspection."
```

---

**D. Tombol WhatsApp — PROMINENT**

Full width, ukuran besar. Gunakan warna hijau WhatsApp (`#25D366`) atau sesuaikan dengan design system SnipGeek jika ada token warna success/accent.

Icon: `MessageCircle` dari Lucide React (atau `Phone`)

Label: **"Consult via WhatsApp"**

Logic generate URL WA:
```ts
const handleWhatsApp = () => {
  const waNumber = "6287437022811"

  const serviceLines = result.items
    .map(i => `• ${i.service}: ${fmt(i.min)} – ${fmt(i.max)}`)
    .join('\n')

  const laptopLine = result.laptop.found
    ? `Laptop: ${result.laptop.name}`
    : `Laptop: ${brand} (model belum diketahui)`

  const message =
    `Halo, saya mau konsultasi servis laptop 🙏\n\n` +
    `${laptopLine}\n\n` +
    `Servis yang dibutuhkan:\n${serviceLines}\n\n` +
    `Total estimasi: ${fmt(result.total_min)} – ${fmt(result.total_max)}\n\n` +
    `Bisa bantu cek lebih lanjut?`

  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank')
}
```

---

**E. Notes dari AI**

Tampilkan `result.notes` dalam info box / alert ringan di bawah tombol WA.

---

**F. Tombol Reset**

Secondary button, label: `"← Calculate Again"` — reset semua state ke form awal.

---

### 3. Environment Variables

Tambahkan ke `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Tambahkan ke `apphosting.yaml` (Firebase App Hosting) di bagian `env:`:
```yaml
- variable: GEMINI_API_KEY
  secret: GEMINI_API_KEY
```

> Daftarkan API key gratis di: https://aistudio.google.com → "Get API Key"
> Tidak perlu kartu kredit. Free tier: 1.500 request/hari.

---

## Catatan Penting untuk Antigravity

1. **Semua fetch ke Gemini API harus dari route handler** (`/api/tools/estimate`), bukan dari client component — supaya `GEMINI_API_KEY` tidak exposed di browser.

2. **Validasi sisi server:** Jika `brand` kosong atau `services` kosong di route handler, return 400 dengan pesan error yang jelas.

3. **Error handling UI:** Jika fetch gagal atau API error, tampilkan pesan error yang ramah dalam bahasa Inggris (karena SnipGeek bilingual, tapi tools ini target English UI), dengan tombol "Try Again".

4. **Nomor WA sudah dalam format internasional:** `6287437022811` — jangan tambahkan `+` atau `0` di depannya.

5. **Format rupiah:** Gunakan `Intl.NumberFormat("id-ID")` konsisten di semua tempat.

6. **Ikuti SKILL.md SnipGeek** untuk semua keputusan design token, class Tailwind, dan struktur komponen.
