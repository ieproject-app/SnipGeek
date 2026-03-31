import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

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
  discounted?: boolean
  originalMin?: number
  originalMax?: number
}

interface EstimateResponse {
  laptop: LaptopInfo
  items: ServiceItem[]
  total_min: number
  total_max: number
  notes: string
  bundleDiscount?: boolean
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

// ─── Grup Bongkaran Internal ──────────────────────────────────────────────────
// Servis yang butuh buka casing laptop — jika dikerjakan bersamaan, 
// teknisi hanya bongkar 1x sehingga layak diberi diskon jasa.
const BONGKARAN_GROUP = new Set(['thermal', 'cleaning', 'ram', 'ssd'])

// Diskon: servis ke-2 = 25% off, servis ke-3+ = 50% off
function applyBundleDiscount(items: { id: string; service: string; note: string; min: number; max: number }[]): ServiceItem[] {
  const bongkaranItems = items.filter(i => BONGKARAN_GROUP.has(i.id))
  const otherItems = items.filter(i => !BONGKARAN_GROUP.has(i.id))

  let bongkaranIdx = 0
  const discountedBongkaran: ServiceItem[] = bongkaranItems.map((item) => {
    bongkaranIdx++
    if (bongkaranItems.length < 2 || bongkaranIdx === 1) {
      // Pertama atau hanya 1 item bongkaran: harga penuh
      return { service: item.service, note: item.note, min: item.min, max: item.max }
    }
    // Servis ke-2: diskon 25%, ke-3+: diskon 50%
    const discountRate = bongkaranIdx === 2 ? 0.25 : 0.50
    const discountedMin = Math.round(item.min * (1 - discountRate))
    const discountedMax = Math.round(item.max * (1 - discountRate))
    return {
      service: item.service,
      note: item.note ? `${item.note} (Diskon bundel bongkaran -${discountRate * 100}%)` : `Diskon bundel bongkaran -${discountRate * 100}%`,
      min: discountedMin,
      max: discountedMax,
      discounted: true,
      originalMin: item.min,
      originalMax: item.max,
    }
  })

  const otherMapped: ServiceItem[] = otherItems.map(item => ({
    service: item.service, note: item.note, min: item.min, max: item.max,
  }))

  return [...discountedBongkaran, ...otherMapped]
}

// ─── Post-process Gemini Response ────────────────────────────────────────────
// Terapkan applyBundleDiscount ke response Gemini karena Gemini tidak selalu
// menghitung diskon dengan benar secara konsisten.
function postProcessGeminiResponse(parsed: EstimateResponse): EstimateResponse {
  if (!parsed?.items || !Array.isArray(parsed.items)) return parsed

  // Map nama servis → service id menggunakan alias
  const itemsWithId = parsed.items.map((item) => {
    const key = normalizeServiceKey(item.service)
    return {
      id: key ?? 'unknown',
      service: item.service,
      note: item.note ?? '',
      min: typeof item.min === 'number' ? item.min : 0,
      max: typeof item.max === 'number' ? item.max : 0,
    }
  })

  const processedItems = applyBundleDiscount(itemsWithId)
  const hasBundleDiscount = processedItems.some(i => i.discounted)
  const total_min = processedItems.reduce((sum, i) => sum + i.min, 0)
  const total_max = processedItems.reduce((sum, i) => sum + i.max, 0)

  const notesWithDiscount = hasBundleDiscount && !parsed.notes?.includes('Diskon bundel')
    ? [parsed.notes, 'Diskon bundel bongkaran sudah diterapkan karena beberapa servis dikerjakan dalam satu kali buka casing.'].filter(Boolean).join(' ')
    : parsed.notes

  return {
    ...parsed,
    items: processedItems,
    total_min,
    total_max,
    notes: notesWithDiscount,
    bundleDiscount: hasBundleDiscount,
  }
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
  const rawItems = inferredServices.map((service) => ({
    id: service.id,
    service: service.label,
    note: service.note,
    min: service.min,
    max: service.max,
  }))

  const items = applyBundleDiscount(rawItems)
  const hasBundleDiscount = items.some(i => i.discounted)

  const total_min = items.reduce((sum, item) => sum + item.min, 0)
  const total_max = items.reduce((sum, item) => sum + item.max, 0)

  const notes = [
    services.length === 0
      ? 'Estimasi ini dibuat otomatis dari keluhan yang Anda tulis, jadi teknisi masih akan mengonfirmasi tindakan paling tepat saat inspeksi.'
      : 'Estimasi ini menggabungkan servis yang Anda pilih dengan analisa gejala yang Anda tulis.',
    history
      ? 'Riwayat servis/part sebelumnya ikut dipakai sebagai konteks awal untuk meminimalkan estimasi yang terlalu umum.'
      : 'Jika ada riwayat ganti part atau servis sebelumnya, sampaikan saat konsultasi agar estimasi bisa dipersempit.',
    hasBundleDiscount
      ? 'Diskon bundel bongkaran sudah diterapkan karena beberapa servis dikerjakan dalam satu kali buka casing.'
      : '',
  ].filter(Boolean).join(' ')

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
    bundleDiscount: hasBundleDiscount,
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

SISTEM DISKON BUNDEL BONGKARAN:
Servis berikut termasuk dalam SATU GRUP "bongkaran internal" (buka casing laptop):
- Ganti Thermal Paste
- Cleaning Internal
- Jasa Upgrade RAM
- Jasa Upgrade SSD/HDD

Jika estimasi hasil analisa menghasilkan 2 atau lebih servis dari grup bongkaran di atas, berlakukan DISKON BUNDEL:
- Servis bongkaran pertama: HARGA PENUH
- Servis bongkaran ke-2: diskon 25% dari harga min DAN max
- Servis bongkaran ke-3 dan seterusnya: diskon 50% dari harga min DAN max

Untuk item yang didiskon:
- Set "discounted": true
- Isi "originalMin" dan "originalMax" dengan harga asli sebelum diskon
- Tambahkan keterangan "(Diskon bundel bongkaran -25%)" atau "(Diskon bundel bongkaran -50%)" di akhir field "note"
Set "bundleDiscount": true pada root JSON jika ada diskon yang diterapkan.

Servis di LUAR grup bongkaran (layar, keyboard, OS, repair, diagnosa) TIDAK dapat diskon bundel.

Catatan: Diagnosa & Estimasi WAJIB diberi harga GRATIS (min: 0, max: 0), agar pelanggan tidak ragu konsultasi.
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
      "note": "catatan singkat",
      "min": 50000,
      "max": 100000,
      "discounted": false,
      "originalMin": 50000,
      "originalMax": 100000
    }
  ],
  "total_min": 200000,
  "total_max": 400000,
  "notes": "1-2 kalimat catatan untuk pelanggan",
  "bundleDiscount": false
}`
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Ambil IP dari header (Firebase App Hosting pakai x-forwarded-for)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate limit check (now persistent via Firestore)
  if (!(await checkRateLimit(ip))) {
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

    return NextResponse.json(postProcessGeminiResponse(parsed))
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

