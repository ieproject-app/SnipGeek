# Sistem Diskon Bundel Bongkaran - Laptop Service Estimator

## Konsep

Sistem diskon ini diterapkan untuk layanan-layanan yang membutuhkan pembongkaran casing laptop. Jika beberapa layanan dalam grup ini dikerjakan bersamaan, teknisi hanya perlu membongkar laptop sekali, sehingga biaya jasa bongkar-pasang untuk layanan kedua dan seterusnya bisa diberikan diskon.

## Grup Layanan Bongkaran Internal

Layanan-layanan ini termasuk dalam grup "bongkaran internal":
- **Ganti Thermal Paste** (`thermal`)
- **Cleaning Internal** (`cleaning`)
- **Jasa Upgrade RAM** (`ram`)
- **Jasa Upgrade SSD/HDD** (`ssd`)

## Struktur Diskon

1. **Layanan bongkaran pertama**: Harga penuh (100%)
2. **Layanan bongkaran kedua**: Diskon 25%
3. **Layanan bongkaran ketiga dan seterusnya**: Diskon 50%

## Implementasi Teknis

### Di API Route (`/api/tools/estimate/route.ts`)

```typescript
// Grup Bongkaran Internal
const BONGKARAN_GROUP = new Set(['thermal', 'cleaning', 'ram', 'ssd'])

// Fungsi applyBundleDiscount
function applyBundleDiscount(items) {
  const bongkaranItems = items.filter(i => BONGKARAN_GROUP.has(i.id))
  const otherItems = items.filter(i => !BONGKARAN_GROUP.has(i.id))
  
  let bongkaranIdx = 0
  const discountedBongkaran = bongkaranItems.map((item) => {
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
  
  return [...discountedBongkaran, ...otherItems]
}
```

### Di Client Component

Menampilkan informasi diskon kepada user:

1. **Notifikasi Diskon**: Banner hijau muncul jika ada diskon bundel
2. **Tampilan Harga**: 
   - Harga asli dicoret (abu-abu)
   - Harga diskon ditampilkan lebih menonjol (hijau)
   - Label "Diskon bundel bongkaran -XX%" ditambahkan di note

## Contoh Kasus

User memilih 3 layanan:
1. Ganti Thermal Paste - Rp 75.000
2. Cleaning Internal - Rp 100.000  
3. Upgrade RAM - Rp 50.000

**Perhitungan:**
- Thermal Paste: Rp 75.000 (harga penuh)
- Cleaning Internal: Rp 100.000 - 25% = Rp 75.000
- Upgrade RAM: Rp 50.000 - 50% = Rp 25.000
- **Total: Rp 175.000** (hemat Rp 50.000 dari harga normal Rp 225.000)

## Keuntungan

1. **Untuk Customer**: Lebih hemat biaya untuk multiple servis
2. **Untuk Teknisi**: Efisiensi waktu kerja, tidak perlu bongkar-pasang berkali-kali
3. **Untuk Bisnis**: Meningkatkan nilai order per customer

## Catatan Penting

- Layanan di luar grup bongkaran (layar, keyboard, OS, repair, diagnosa) tidak mendapat diskon
- Diskon hanya berlaku untuk jasa, tidak untuk spare parts
- Sistem sudah otomatis diterapkan di API dan frontend
