import { NextRequest, NextResponse } from 'next/server'

interface LaptopInfo {
  found: boolean
  name: string
  processor?: string
  ram?: string
  storage?: string
  display?: string
  year?: string
}

interface ServiceItem {
  service: string
  note: string
  min: number
  max: number
}

interface EstimateResponse {
  laptop: LaptopInfo
  items: ServiceItem[]
  total_min: number
  total_max: number
  notes: string
}

interface ServiceDefinition {
  id: string
  label: string
  min: number
  max: number
  note: string
  keywords: string[]
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    id: 'thermal',
    label: 'Ganti Thermal Paste',
    min: 50000,
    max: 100000,
    note: 'Biasanya disarankan saat laptop cepat panas atau performa turun karena suhu.',
    keywords: ['panas', 'overheat', 'thermal', 'throttle', 'heatsink', 'kipas', 'fan'],
  },
  {
    id: 'cleaning',
    label: 'Cleaning Internal',
    min: 75000,
    max: 150000,
    note: 'Membersihkan debu internal sering membantu laptop panas, berisik, atau airflow tersumbat.',
    keywords: ['clean', 'cleaning', 'debu', 'kotor', 'fan', 'kipas', 'berisik', 'noisy'],
  },
  {
    id: 'ram',
    label: 'Jasa Upgrade RAM',
    min: 50000,
    max: 75000,
    note: 'Upgrade RAM relevan bila kebutuhan utamanya multitasking atau performa harian terasa berat.',
    keywords: ['ram', 'memory', 'multitask', 'multitasking'],
  },
  {
    id: 'ssd',
    label: 'Jasa Upgrade SSD/HDD',
    min: 75000,
    max: 100000,
    note: 'Cocok bila ada kebutuhan upgrade storage atau penggantian media simpan.',
    keywords: ['ssd', 'hdd', 'harddisk', 'hard drive', 'storage', 'nvme', 'sata'],
  },
  {
    id: 'os',
    label: 'Instal Ulang OS',
    min: 50000,
    max: 150000,
    note: 'Instal ulang biasanya dipertimbangkan untuk masalah sistem, boot, atau software yang korup.',
    keywords: ['windows', 'linux', 'os', 'bootloop', 'reinstall', 'instal ulang', 'install ulang', 'driver', 'blue screen'],
  },
  {
    id: 'screen',
    label: 'Jasa Ganti Layar',
    min: 200000,
    max: 350000,
    note: 'Biasanya diperlukan jika ada garis, flicker, pecah, atau panel tidak tampil normal.',
    keywords: ['layar', 'screen', 'lcd', 'display', 'panel', 'flicker', 'garis', 'blank'],
  },
  {
    id: 'keyboard',
    label: 'Jasa Ganti Keyboard',
    min: 35000,
    max: 75000,
    note: 'Dipertimbangkan bila tombol error, tidak respon, atau ada indikasi keyboard bermasalah.',
    keywords: ['keyboard', 'key', 'tombol', 'ketik'],
  },
  {
    id: 'repair',
    label: 'Repair Hardware Minor',
    min: 150000,
    max: 350000,
    note: 'Estimasi ini dipakai untuk gangguan hardware ringan yang masih perlu pengecekan teknisi.',
    keywords: ['mati', 'restart', 'port', 'usb', 'cas', 'charger', 'charging', 'engsel', 'hinge', 'motherboard', 'short'],
  },
  {
    id: 'diagnosa',
    label: 'Diagnosa Hardware',
    min: 50000,
    max: 100000,
    note: 'Dipakai sebagai estimasi awal bila gejala belum cukup spesifik dan perlu pengecekan teknisi.',
    keywords: [],
  },
]

const SERVICE_ALIASES: Record<string, string> = {
  thermal: 'thermal',
  'ganti thermal paste': 'thermal',
  cleaning: 'cleaning',
  'cleaning internal': 'cleaning',
  ram: 'ram',
  'jasa upgrade ram': 'ram',
  ssd: 'ssd',
  hdd: 'ssd',
  'jasa upgrade ssd/hdd': 'ssd',
  os: 'os',
  'instal ulang os': 'os',
  screen: 'screen',
  layar: 'screen',
  'jasa ganti layar': 'screen',
  keyboard: 'keyboard',
  'jasa ganti keyboard': 'keyboard',
  repair: 'repair',
  'repair hardware minor': 'repair',
  diagnosa: 'diagnosa',
  'diagnosa hardware': 'diagnosa',
  'diagnosa & estimasi ai': 'diagnosa',
}

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

function normalizeServiceKey(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  return SERVICE_ALIASES[normalized] ?? null
}

function inferServices(complaint: string, history: string, services: string[]): ServiceDefinition[] {
  const matched = new Map<string, ServiceDefinition>()
  const context = `${complaint} ${history}`.toLowerCase()

  for (const service of services) {
    const key = normalizeServiceKey(service)
    if (!key) {
      continue
    }

    const definition = SERVICE_DEFINITIONS.find((item) => item.id === key)
    if (definition) {
      matched.set(definition.id, definition)
    }
  }

  for (const definition of SERVICE_DEFINITIONS) {
    if (definition.id === 'diagnosa') {
      continue
    }

    if (definition.keywords.some((keyword) => context.includes(keyword))) {
      matched.set(definition.id, definition)
    }
  }

  if (matched.size === 0) {
    const diagnostic = SERVICE_DEFINITIONS.find((item) => item.id === 'diagnosa')
    if (diagnostic) {
      matched.set(diagnostic.id, diagnostic)
    }
  }

  return Array.from(matched.values()).slice(0, 5)
}

function buildFallbackEstimate(
  brand: string,
  model: string,
  complaint: string,
  history: string,
  services: string[]
): EstimateResponse {
  const inferredServices = inferServices(complaint, history, services)
  const items = inferredServices.map((service) => ({
    service: service.label,
    note: service.note,
    min: service.min,
    max: service.max,
  }))

  const total_min = items.reduce((sum, item) => sum + item.min, 0)
  const total_max = items.reduce((sum, item) => sum + item.max, 0)

  const notes = [
    services.length === 0
      ? 'Estimasi ini dibuat otomatis dari keluhan yang Anda tulis, jadi teknisi masih akan mengonfirmasi tindakan paling tepat saat inspeksi.'
      : 'Estimasi ini menggabungkan servis yang Anda pilih dengan analisa gejala yang Anda tulis.',
    history
      ? 'Riwayat servis/part sebelumnya ikut dipakai sebagai konteks awal untuk meminimalkan estimasi yang terlalu umum.'
      : 'Jika ada riwayat ganti part atau servis sebelumnya, sampaikan saat konsultasi agar estimasi bisa dipersempit.',
  ].join(' ')

  return {
    laptop: model
      ? {
          found: true,
          name: `${brand} ${model}`.trim(),
        }
      : {
          found: false,
          name: `${brand} (model tidak disebutkan)`,
        },
    items,
    total_min,
    total_max,
    notes,
  }
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
    ? `Cari spesifikasi umum untuk "${brand} ${model}". WAJIB tampilkan semua varian utama (misal: prosesor i3/i5/i7, RAM 4/8/16GB, storage SSD/HDD, dan UKURAN LAYAR). Untuk ukuran layar, jika ada beberapa varian (misal: 13.3", 14", 15.6"), tampilkan semua range ukuran layar yang tersedia, bukan hanya yang terbesar. Jika memungkinkan, tulis seperti: "13.3 / 14 / 15.6 inch". Jangan hanya menampilkan satu ukuran saja jika ada lebih dari satu varian.
Wajib isi: processor, RAM default pabrik, storage default pabrik, UKURAN LAYAR (semua varian), tahun rilis.
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

SERVIS YANG DIPILIH PELANGGAN (opsional):
${services.length > 0 ? services.map((s) => `- ${s}`).join('\n') : '- Tidak memilih servis tertentu, kamu harus menyimpulkan kebutuhan servis dari keluhan pelanggan'}

MASTER HARGA JASA (ikuti range ini):
- Ganti Thermal Paste: Rp 50.000 – Rp 100.000
- Cleaning Internal: Rp 75.000 – Rp 150.000
- Jasa Upgrade RAM: Rp 50.000 – Rp 75.000
- Jasa Upgrade SSD/HDD: Rp 75.000 – Rp 100.000 (Catatan: ini sudah termasuk jasa instal ulang OS dasar)
- Instal Ulang OS: Rp 50.000 – Rp 150.000
- Jasa Ganti Layar: Rp 200.000 – Rp 350.000
- Jasa Ganti Keyboard: Rp 35.000 – Rp 75.000
- Diagnosa & Estimasi: GRATIS
- Repair Hardware Minor: Rp 150.000 – Rp 350.000

Catatan: Diagnosa & Estimasi WAJIB diberi harga GRATIS, agar pelanggan tidak ragu konsultasi.
Sesuaikan harga dalam range berdasarkan kompleksitas laptop (gaming = lebih kompleks).
PENTING: Selalu analisa field 'complaint' (keluhan) dan 'history' (riwayat) secara mendalam, baik pelanggan memilih servis tertentu maupun tidak.
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
    "display": "13.3 / 14 / 15.6 inch FHD IPS",
    "year": "2021"
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
  if (typeof complaint !== 'string' || complaint.trim() === '') {
    return NextResponse.json(
      { error: 'Keluhan laptop wajib diisi agar AI bisa menganalisa masalahnya.' },
      { status: 400 }
    )
  }
  if (services !== undefined && !Array.isArray(services)) {
    return NextResponse.json(
      { error: 'Format pilihan servis tidak valid.' },
      { status: 400 }
    )
  }

  if (Array.isArray(services) && services.length > 5) {
    return NextResponse.json(
      { error: 'Maksimal 5 servis per estimasi.' },
      { status: 400 }
    )
  }

  const cleanBrand = brand.trim().slice(0, 50)
  const cleanModel = typeof model === 'string' ? model.trim().slice(0, 80) : ''
  const cleanComplaint = typeof complaint === 'string' ? complaint.trim().slice(0, 500) : ''
  const cleanHistory = typeof history === 'string' ? history.trim().slice(0, 500) : ''
  const cleanServices = Array.isArray(services)
    ? services.map((s) => String(s).slice(0, 80))
    : []

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      buildFallbackEstimate(cleanBrand, cleanModel, cleanComplaint, cleanHistory, cleanServices)
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
        buildFallbackEstimate(cleanBrand, cleanModel, cleanComplaint, cleanHistory, cleanServices)
      )
    }

    const data = await geminiRes.json()
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = rawText.replace(/```json|```/g, '').trim()
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('Failed to parse JSON:', clean)
      return NextResponse.json(
        buildFallbackEstimate(cleanBrand, cleanModel, cleanComplaint, cleanHistory, cleanServices)
      )
    }

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        buildFallbackEstimate(cleanBrand, cleanModel, cleanComplaint, cleanHistory, cleanServices)
      )
    }
    console.error('[estimate] Unexpected error:', err)
    return NextResponse.json(
      buildFallbackEstimate(cleanBrand, cleanModel, cleanComplaint, cleanHistory, cleanServices)
    )
  }
}

