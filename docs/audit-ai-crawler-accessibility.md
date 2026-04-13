# Audit AI Crawler Accessibility — SnipGeek

> Tanggal audit: 2025-07  
> Auditor: AI Code Review  
> Konteks: Blog Next.js + Firebase App Hosting, bilingual EN/ID, konten MDX

---

## Ringkasan Eksekutif

Artikel SnipGeek **sudah ter-render di sisi server** via `MDXRemote/rsc` — artinya konten teks sudah ada di HTML sebelum JavaScript berjalan. Namun ada **tiga masalah utama** yang berpotensi mempersulit AI crawler membaca konten:

1. JSON API yang sudah dibangun khusus untuk AI crawler justru **diblokir sendiri** di `robots.txt`
2. Beberapa elemen UI menyembunyikan konten via CSS (`opacity: 0`, `max-h-0`) di SSR awal
3. Tidak ada panduan eksplisit untuk AI crawler modern (`llms.txt`, entri bot-spesifik)

---

## 1. `robots.txt` (via `src/app/robots.ts`)

### Kode Saat Ini

```ts
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: 'https://snipgeek.com/sitemap.xml',
  };
}
```

### Temuan

| Aspek | Status | Keterangan |
|---|---|---|
| Semua bot diizinkan ke `/blog/*` | ✅ Baik | ClaudeBot, GPTBot, PerplexityBot tidak diblokir |
| `Disallow: /api/` | ❌ **Kritis** | Memblokir `/api/posts/[slug]` dan `/api/notes/[slug]` yang dibuat khusus untuk AI |
| Tidak ada entri bot-spesifik | ⚠️ Netral | Tidak ada aturan untuk GPTBot, ClaudeBot, Applebot, dll. secara eksplisit |
| Sitemap ter-link | ✅ Baik | `https://snipgeek.com/sitemap.xml` tersedia |

### Ironi Kritis

Di dalam kodebase sudah ada dua JSON API endpoint dengan komentar eksplisit:

```ts
// src/app/api/posts/[slug]/route.ts
/**
 * Returns raw article data as JSON for AI crawlers and HTTP fetchers
 * that cannot execute JavaScript.
 */
```

API ini mengembalikan konten artikel lengkap dalam format JSON yang bersih — ideal untuk AI. Namun `robots.ts` memerintahkan semua crawler untuk **tidak masuk ke `/api/`**, sehingga endpoint ini secara praktis tertutup untuk crawler yang patuh pada `robots.txt`.

---

## 2. Server-Rendered HTML — Halaman Artikel (`/blog/[slug]`)

### Status: ✅ LULUS

Halaman artikel menggunakan `MDXRemote` dari `next-mdx-remote/rsc` (versi React Server Component). Ini berarti **seluruh teks artikel sudah ada di HTML** sebelum JavaScript berjalan — cara yang benar untuk crawler.

```ts
// src/app/[locale]/blog/[slug]/page.tsx
// page.tsx adalah Server Component (tidak ada "use client")
<div className="text-lg text-foreground/80 prose-content">
  <MDXRemote
    source={initialPost.content || ""}
    components={mdxComponents}
    options={{ mdxOptions: { remarkPlugins: [remarkGfm], ... } }}
  />
</div>
```

### Detail Per Elemen

| Elemen | Ada di SSR HTML? | Catatan |
|---|---|---|
| Body text artikel (paragraf, list, blockquote) | ✅ Ya | `MDXRemote/rsc` = Server Component |
| `<h1>` judul artikel | ✅ Ya | Dirender dari `page.tsx` (Server Component) |
| `<h2>`, `<h3>` heading dalam konten | ✅ Ya | Bagian dari MDX render |
| `ArticleTOC` (daftar isi) | ⚠️ Di HTML tapi tersembunyi | `useState(false)` → `max-h-0 opacity-0` saat SSR |
| `ArticleRelated` | ⚠️ Di HTML tapi `opacity: 0` | `ScrollReveal` (framer-motion) set opacity 0 di SSR |
| `RevealImage` gambar hero | ✅ `<img>` ada di HTML | Tapi dengan class `opacity-0` sampai JS load |
| JSON-LD `BlogPosting` schema | ✅ Lengkap | Termasuk `headline`, `datePublished`, `author`, `publisher` |
| `<article aria-label="...">` wrapper | ✅ Ya | Semantik HTML sudah benar |

### Detail `ArticleTOC` yang Perlu Diperhatikan

```ts
// src/components/blog/article-toc.tsx
export function ArticleTOC({ headings }: ArticleTOCProps) {
  const [isOpen, setIsOpen] = useState(false); // ← server render: false (tertutup)
  // ...
  <div className={cn(
    "overflow-hidden transition-all duration-300 ease-out",
    isOpen
      ? "max-h-250 translate-y-0 opacity-100"
      : "max-h-0 -translate-y-2 opacity-0", // ← heading links tersembunyi di SSR
  )}>
```

Link heading di dalam TOC memang ada di HTML, tapi dengan `max-h-0` dan `opacity-0`. Sebagian besar text crawler masih bisa membacanya dari source HTML, tapi tidak visually accessible.

---

## 3. Server-Rendered HTML — Homepage (`/`)

### Status: ⚠️ SEBAGIAN — Hanya above-fold yang ter-render

```ts
// src/app/[locale]/home-client.tsx
function LazySection({ children, minHeight }) {
  const [visible, setVisible] = useState(false); // ← server: false
  
  useEffect(() => {
    // IntersectionObserver — hanya berjalan di browser, tidak di server
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { rootMargin: "300px" });
    observer.observe(ref.current);
  }, []);

  return (
    <div ref={ref}>
      {visible ? children : <SectionPlaceholder minHeight={minHeight} />}
      //                     ↑ yang dirender server: div aria-hidden kosong
    </div>
  );
}
```

### Konten per Section

| Section | Ada di SSR HTML? | Alasan |
|---|---|---|
| `HomeHero` — featured posts (judul + link) | ✅ Ya | Tidak dibungkus `LazySection` |
| `HomeLatest` — 6 artikel terbaru (judul + link) | ✅ Ya | Tidak dibungkus `LazySection` |
| `HomeTransitionNote` | ❌ Tidak | `LazySection` → render `<div aria-hidden="true">` kosong |
| `HomeTutorials` | ❌ Tidak | `LazySection` → render `<div aria-hidden="true">` kosong |
| `HomeTopics` | ❌ Tidak | `LazySection` → render `<div aria-hidden="true">` kosong |
| `HomeUpdates` | ❌ Tidak | `LazySection` → render `<div aria-hidden="true">` kosong |
| `HomeNotes` | ❌ Tidak | `LazySection` → render `<div aria-hidden="true">` kosong |

`LazySection` dirancang untuk optimasi Lighthouse (mengurangi TBT / main-thread work). Efek sampingnya: sekitar 70% konten homepage tidak masuk ke HTML yang dibaca crawler.

---

## 4. Server-Rendered HTML — Blog List (`/blog`)

### Status: ⚠️ TERBATAS — Hanya 9 artikel pertama

```ts
// src/app/[locale]/blog/blog-list-client.tsx
const POSTS_PER_PAGE = 9;

export function BlogListClient({ initialPosts }: ...) {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE); // ← server: 9
  
  const displayedPosts = allPosts.slice(0, visibleCount); // hanya 9 artikel di SSR
  
  // Tombol "Load More" membutuhkan JavaScript
  const handleLoadMore = () => setVisibleCount((prev) => prev + POSTS_PER_PAGE);
}
```

Dengan 34+ artikel yang sudah dipublish, AI crawler hanya bisa melihat 9 artikel pertama dari halaman `/blog`. Sisanya terkunci di balik interaksi JavaScript.

---

## 5. Meta Tags

### Status: ✅ SANGAT BAIK

```ts
// src/app/[locale]/layout.tsx
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,  // izinkan snippet penuh — sangat baik untuk AI
  },
},
```

### Checklist Meta Tags

| Tag / Elemen | Status | Catatan |
|---|---|---|
| `<title>` per halaman | ✅ | Diset via `generateMetadata` |
| `<meta name="description">` | ✅ | Unik per halaman |
| `<meta name="keywords">` | ✅ | Ada di halaman artikel (dari frontmatter `tags`) |
| OpenGraph `og:title`, `og:description` | ✅ | Lengkap |
| OpenGraph `og:type: article` | ✅ | Diset di artikel |
| OpenGraph `og:image` | ✅ | Hero image per artikel |
| OpenGraph `publishedTime`, `modifiedTime` | ✅ | Diset dari frontmatter |
| Twitter Card `summary_large_image` | ✅ | |
| `canonical` URL | ✅ | Per locale |
| `hreflang` alternates EN/ID | ✅ | Termasuk `x-default` |
| `robots: index, follow` | ✅ | Di layout utama |
| `max-snippet: -1` | ✅ | Snippet tidak dipotong |
| JSON-LD `BlogPosting` | ✅ | `headline`, `description`, `image`, `datePublished`, `dateModified`, `author`, `publisher`, `wordCount` |
| JSON-LD `BreadcrumbList` | ✅ | Di setiap artikel |
| JSON-LD `WebSite` + `SearchAction` | ✅ | Di homepage |
| JSON-LD `Organization` | ✅ | Di homepage |
| `llms.txt` | ❌ | Tidak ada — standar baru untuk AI crawler |

---

## 6. Ironi API — Temuan Paling Kritis

Kodebase sudah memiliki infrastruktur JSON API lengkap untuk AI, tapi ada tiga lapis sinyal yang saling bertentangan:

### Endpoint yang Ada

**`GET /api/posts/[slug]?locale=en`** → Mengembalikan:
```json
{
  "slug": "...",
  "locale": "en",
  "title": "...",
  "description": "...",
  "date": "...",
  "updated": "...",
  "tags": [...],
  "category": "...",
  "content": "... full markdown content ..."
}
```

**`GET /api/notes/[slug]?locale=en`** → Struktur serupa untuk catatan.

### Tiga Lapis Blocking

| Lapis | Mekanisme | Efek |
|---|---|---|
| 1 | `robots.ts` → `disallow: ['/api/']` | Crawler yang patuh pada `robots.txt` diperintahkan tidak masuk ke endpoint ini |
| 2 | `X-Robots-Tag: noindex` di response header | Endpoint diminta untuk tidak diindeks sebagai hasil pencarian, meski ini tidak identik dengan larangan membaca konten |
| 3 | Komentar kode bertentangan dengan robots.txt | Niat implementasi “AI-friendly JSON” tidak dieksekusi secara konsisten |

---

## 7. `ScrollReveal` dan `opacity: 0` di SSR

Beberapa section menggunakan `ScrollReveal` dari framer-motion yang menerapkan `opacity: 0` sebagai inline style di SSR awal:

```ts
// src/components/ui/scroll-reveal.tsx
<motion.div
  initial={shouldAnimate ? { opacity: 0, ...initialOffset } : false}
  animate={{ opacity: 1, ... }}
>
  {children}
</motion.div>
```

Komponen yang terdampak: `ArticleRelated`, `HomeTutorials`, `HomeTopics`.

Teks konten tetap ada di HTML source, tapi dengan `style="opacity: 0"` sebagai inline style. Sebagian besar AI text crawler akan tetap membacanya dari raw HTML, tapi crawler yang mengevaluasi rendered state mungkin melewatinya.

---

## 8. Tidak Ada Proxy/Middleware Blocking Tambahan

**Status: ✅ Baik**

Tidak ditemukan file `src/middleware.ts`, tetapi ada file `src/proxy.ts` yang berfungsi sebagai layer routing. Dari implementasinya, route `/api`, `/_next`, dan file statis langsung dilewatkan (`NextResponse.next()`), dan tidak ada bot-blocking, rate limiting berbasis User-Agent, atau challenge tambahan di layer ini. Jadi crawler tetap bebas mengakses route HTML yang tidak diblokir oleh `robots.txt`.

---

## 9. Sitemap

### Status: ✅ SANGAT BAIK

```ts
// src/app/sitemap.ts
// Mencakup:
// - Semua static routes (home, blog, notes, about, tools, dll.)
// - Semua blog posts per locale dengan lastModified dari frontmatter
// - Semua notes per locale
// - Tag pages (yang memenuhi ambang batas shouldIndexTag)
// - Tool pages
```

| Aspek | Status |
|---|---|
| Semua artikel ter-include | ✅ |
| `lastModified` dari frontmatter `updated` / `date` | ✅ |
| `priority` berbeda per tipe konten | ✅ (`featured: 0.8`, normal: `0.6`) |
| Bilingual EN/ID dengan locale prefix yang benar | ✅ |
| Tool pages di-include | ✅ |
| Tag pages (selective) | ✅ |

---

## Diagnosis: Mengapa Claude Tidak Bisa Membaca Artikel?

> Catatan: bagian ini adalah **hipotesis operasional berbasis audit statis**, bukan hasil pengujian live terhadap bot Claude.

### Kemungkinan Penyebab (Urut Prioritas)

**1. JSON API diblokir (Paling Mungkin)**
API yang paling ideal untuk dibaca Claude — `/api/posts/[slug]` yang mengembalikan clean JSON — tidak bisa diakses karena `Disallow: /api/` di robots.txt. ClaudeBot yang patuh terhadap robots.txt akan skip endpoint ini.

**2. HTML artikel mungkin terlalu kompleks untuk sebagian URL reader AI**
Meskipun konten ada di SSR HTML, halaman artikel tetap dibungkus boilerplate aplikasi: script hydration Next.js, inisialisasi client, font, dan elemen UI lain. Ini **masuk akal sebagai hipotesis**, tetapi tidak bisa dipastikan tanpa uji fetch langsung ke URL produksi.

**3. Tidak ada `llms.txt` sebagai panduan**
Situs modern yang ingin AI-friendly menyediakan `/llms.txt` yang berisi daftar URL konten bersih. Tanpa ini, AI crawler harus menebak struktur konten dari sitemap biasa.

**4. `ArticleTOC` collapsed di SSR**
Heading-heading artikel ada di HTML tapi dengan `opacity: 0` dan `max-h: 0`. Beberapa crawler yang mengevaluasi rendered state bisa melewatkan ini sebagai "hidden content".

---

## Rekomendasi

> ⚠️ Ini adalah dokumen audit saja — belum ada perubahan kode yang dilakukan.

### Prioritas Tinggi 🔴

1. **Buka akses `/api/posts/` dan `/api/notes/` di robots.ts**
   - Ubah `disallow: ['/api/']` menjadi lebih spesifik: hanya blokir route yang benar-benar private
   - Atau buat pengecualian eksplisit untuk `/api/posts/` dan `/api/notes/`

2. **Pertahankan atau tinjau ulang `X-Robots-Tag` di API route dengan tujuan yang jelas**
  - Header `noindex` tetap masuk akal jika endpoint JSON tidak ingin tampil di hasil pencarian
  - Fokus utama tetap membuka akses crawl; `noindex` tidak otomatis berarti bot AI tidak boleh membaca kontennya

3. **Tambahkan entri bot-spesifik di robots.ts**
   ```
   GPTBot, ClaudeBot, PerplexityBot, Applebot, Bytespider
   ```
   Bisa digunakan untuk memberi izin spesifik ke `/api/posts/` hanya untuk bot-bot ini

### Prioritas Sedang 🟡

4. **Buat file `/public/llms.txt`**
   - Format sederhana: daftar URL artikel yang ingin dibuat tersedia untuk AI
   - Lihat referensi: [llmstxt.org](https://llmstxt.org)

5. **Tambahkan `<link rel="alternate" type="application/json">` di artikel**
   - Beri tahu crawler bahwa ada versi JSON tersedia di `/api/posts/[slug]`

### Prioritas Rendah 🟢

6. **`ArticleTOC` — pertimbangkan `useState(true)` untuk SSR**
   - TOC terbuka secara default → heading links langsung visible di SSR HTML
   - User bisa menutupnya secara manual (UX tidak terlalu berubah)

7. **Homepage `LazySection` — pertimbangkan server-render judul section**
   - Minimal render teks judul section dan beberapa link di SSR
   - Konten penuh tetap lazy-loaded untuk performa

8. **Blog list — pertimbangkan sitemap sebagai sumber utama untuk crawler**
   - Sitemap sudah lengkap dengan semua URL artikel
   - Crawler yang baik akan menggunakan sitemap, bukan crawl blog list

---

## Ringkasan Skor

| Area | Skor | Keterangan |
|---|---|---|
| `robots.txt` untuk HTML pages | 8/10 | Permisif dan benar, tapi blokir API sendiri |
| `robots.txt` untuk AI API | 2/10 | Blokir endpoint yang dibuat khusus untuk AI |
| Sitemap | 10/10 | Sangat lengkap dan well-structured |
| Meta tags & Schema.org | 9/10 | Lengkap, `max-snippet: -1` adalah nilai plus |
| SSR artikel (body text) | 9/10 | `MDXRemote/rsc` sudah benar |
| SSR homepage | 4/10 | Sebagian besar konten tidak ter-render di SSR |
| SSR blog list | 5/10 | Hanya 9 dari 34+ artikel visible tanpa JS |
| AI-specific guidance (`llms.txt`) | 0/10 | Tidak ada |
| **Overall AI Accessibility** | **6/10** | Fondasi sudah kuat, perlu beberapa perbaikan kritis |

---

*Audit ini dilakukan secara statis dengan membaca kode sumber. Tidak ada perubahan kode yang dilakukan. Untuk validasi lebih lanjut, perlu test langsung ke URL produksi, termasuk fetch ke endpoint HTML dan JSON sebagai crawler yang patuh pada `robots.txt`.*