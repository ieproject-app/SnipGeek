import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Max 5 requests per 10 menit per IP
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 menit

interface RateLimitEntry {
  count: number
  resetAt: number
}

const ipStore = new Map<string, RateLimitEntry>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipStore.get(ip)

  if (!entry || now > entry.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// ─── Gemini Prompt Builder ────────────────────────────────────────────────────
function buildPrompt(brand: string, model: string, complaint: string, history: string, services: string[]): string {
  return `Kamu adalah asisten estimasi harga servis laptop di toko teknisi Indonesia.

INFORMASI LAPTOP DARI PELANGGAN:
- Merek: ${brand}
${model ? `- Seri/Model: ${model}` : '- Seri/Model: tidak disebutkan'}
${complaint ? `- Keluhan/Kendala: ${complaint}` : '- Keluhan/Kendala: tidak disebutkan'}
${history ? `- Riwayat Part/Servis: ${history}` : '- Riwayat Part/Servis: belum ada'}

TUGAS UTAMA — IDENTIFIKASI & ANALISA:
${
  model
    ? `Cari spesifikasi umum untuk "${brand} ${model}". Gunakan pengetahuanmu tentang laptop ini.
Wajib isi: processor, RAM default pabrik, storage default pabrik, ukuran layar, tahun rilis.
IDENTIFIKASI SEMUA VARIAN: Jika seri tersebut memiliki beberapa varian spesifikasi (misal prosesor i3, i5, i7), TAMPILKAN SEMUA varian tersebut (contoh: "Intel Core i3 / i5 / i7") — jangan hanya menampilkan varian tertinggi.
ANALISA TEKNIS MATANG: Berdasarkan "Tahun Rilis", "Keluhan", dan "Riwayat Part", berikan analisa di field 'notes'. 
- Jika laptop sudah > 5 tahun, ingatkan risiko hardware lama (misal: thermal paste kering, baterai drop).
- Jika ada riwayat ganti part tertentu, analisa apakah keluhan sekarang berhubungan dengan part tersebut.
- Berikan saran pencegahan yang spesifik untuk model laptop ini (misal: "Seri ini sering bermasalah di engsel, harap hati-hati").
Jika data persis tidak tersedia, berikan estimasi terbaik berdasarkan seri yang paling mirip.
Set found: true SELALU jika merek dikenal, bahkan jika hanya estimasi umum.
JANGAN set found: false hanya karena data tidak lengkap — gunakan nilai estimasi.`
    : `Model tidak diketahui. Gunakan merek "${brand}" sebagai konteks.
Set found: false. Isi name dengan "${brand} (model tidak disebutkan)".
Kosongkan semua field spesifikasi.`
}

SERVIS YANG DIMINTA PELANGGAN:
${services.map((s) => `- ${s}`).join('\n')}

MASTER HARGA JASA (ikuti range ini):
- Ganti Thermal Paste: Rp 50.000 – Rp 100.000
- Cleaning Internal: Rp 75.000 – Rp 150.000
- Jasa Upgrade RAM: Rp 50.000 – Rp 75.000
- Jasa Upgrade SSD/HDD: Rp 75.000 – Rp 100.000 (Catatan: ini sudah termasuk jasa instal ulang OS dasar)
- Instal Ulang OS: Rp 50.000 – Rp 150.000
- Jasa Ganti Layar: Rp 200.000 – Rp 350.000
- Jasa Ganti Keyboard: Rp 35.000 – Rp 75.000
- Diagnosa & Estimasi AI: Rp 50.000 – Rp 100.000
- Repair Hardware Minor: Rp 150.000 – Rp 350.000

Sesuaikan harga dalam range berdasarkan kompleksitas laptop (gaming = lebih kompleks).
PENTING: Jika pengguna memilih 'Diagnosa & Estimasi AI', tugasmu adalah menganalisa field 'complaint' (keluhan) dan 'history' (riwayat) secara mendalam. 
Berdasarkan analisa tersebut, kamu WAJIB menyarankan servis konkrit yang mungkin dibutuhkan (misal: "Ganti Keyboard" atau "Cleaning") ke dalam field 'items' estimasi, meskipun pengguna tidak memilihnya di awal. Berikan alasan kenapa kamu menyarankan servis tersebut di field 'note' per item.

Jika pelanggan memilih 'Jasa Upgrade SSD/HDD', jangan tambahkan biaya 'Instal Ulang OS' secara terpisah lagi karena sudah satu paket, kecuali pelanggan meminta backup data besar.
Gunakan field 'notes' untuk memberikan saran teknis singkat berdasarkan 'Keluhan/Kendala' yang diisi pelanggan.

Balas HANYA dengan JSON berikut — tanpa markdown, tanpa backtick, tanpa teks lain:
{
  "laptop": {
    "found": true,
    "name": "nama lengkap laptop",
    "processor": "Intel Core i5-11300H",
    "ram": "8 GB DDR4",
    "storage": "512 GB NVMe SSD",
    "display": "14 inch FHD IPS",
    "year": "2021"
  },
  "ui": {
    "badge": "Customer Complaint",
    "title": "What's the Problem?",
    "labelProblem": "Complaint Detail",
    "placeholder": "e.g., Laptop is slow, keyboard not working, frequent restarts...",
    "keyboard": { "label": "Jasa Ganti Keyboard", "desc": "Replace laptop keyboard" },
    "repair": { "label": "Repair Hardware Minor", "desc": "Minor component fix (IC, ports, etc.)" },
    "diagnosa_ai": { "label": "Diagnosa & Estimasi AI", "desc": "Select if unsure about the problem" },
    "labelHistory": "Parts / Service History",
    "placeholderHistory": "e.g., Battery replaced 2023, SSD changed 1 year ago..."
  },
  "items": [
    {
      "service": "nama servis",
      "note": "catatan singkat atau string kosong",
      "min": 50000,
      "max": 100000
    }
  ],
  "total_min": 200000,
  "total_max": 400000,
  "notes": "1-2 kalimat catatan untuk pelanggan"
}`
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Ambil IP dari header (Firebase App Hosting pakai x-forwarded-for)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate limit check
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam 10 menit.' },
      { status: 429 }
    )
  }

  // Parse body
  let body: { brand?: string; model?: string; complaint?: string; history?: string; services?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Format permintaan tidak valid.' },
      { status: 400 }
    )
  }

  const { brand, model = '', complaint = '', history = '', services } = body

  // Validasi input
  if (!brand || typeof brand !== 'string' || brand.trim() === '') {
    return NextResponse.json(
      { error: 'Merek laptop wajib diisi.' },
      { status: 400 }
    )
  }
  if (!Array.isArray(services) || services.length === 0) {
    return NextResponse.json(
      { error: 'Pilih minimal satu servis.' },
      { status: 400 }
    )
  }
  if (services.length > 5) {
    return NextResponse.json(
      { error: 'Maksimal 5 servis per estimasi.' },
      { status: 400 }
    )
  }

  const cleanBrand = brand.trim().slice(0, 50)
  const cleanModel = typeof model === 'string' ? model.trim().slice(0, 80) : ''
  const cleanComplaint = typeof complaint === 'string' ? complaint.trim().slice(0, 500) : ''
  const cleanHistory = typeof history === 'string' ? history.trim().slice(0, 500) : ''
  const cleanServices = (services as string[]).map((s) => String(s).slice(0, 80))

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Konfigurasi server bermasalah. Hubungi admin.' },
      { status: 500 }
    )
  }

  // Fetch ke Gemini dengan timeout 10 detik
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildPrompt(cleanBrand, cleanModel, cleanComplaint, cleanHistory, cleanServices) }],
            },
          ],
        }),
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text().catch(() => 'no text')
      console.error('[estimate] Gemini error:', geminiRes.status, errorText)
      return NextResponse.json(
        { error: `Gagal memproses estimasi. Status: ${geminiRes.status}. Detail: ${errorText}` },
        { status: 500 }
      )
    }

    const data = await geminiRes.json()
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (e) {
      console.error('Failed to parse JSON:', clean)
      return NextResponse.json(
        { error: 'AI mengembalikan format yang tidak valid. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'AI membutuhkan waktu terlalu lama (timeout). Coba lagi.' },
        { status: 503 }
      )
    }
    console.error('[estimate] Unexpected error:', err)
    return NextResponse.json(
      { error: `Gagal terhubung ke AI. Error: ${err?.message || 'Unknown'}` },
      { status: 500 }
    )
  }
}

