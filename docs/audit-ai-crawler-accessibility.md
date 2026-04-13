Promp "I need you to audit why article content is not visible in server-rendered HTML on this Next.js App Router blog (SnipGeek).

## Symptom
When fetching the article URL directly (e.g. /blog/rename-pc-windows-11), the raw HTML only contains the page title and skip link. No article body content is present. This means AI crawlers and search bots that don't execute JavaScript cannot read the content.

However, the JSON route handler at /api/posts/[slug]?locale=en returns full article content correctly.

## Stack
- Next.js App Router (latest)
- MDX for article content
- Firebase App Hosting
- Bilingual (id/en) via locale param

## What to check and fix

1. **Article page component** (`app/blog/[slug]/page.tsx` or similar)
   - Is it marked as `"use client"`? If yes, that's the problem — move data fetching to a server component
   - Is the MDX content rendered inside a client component wrapper? Identify which component causes CSR

2. **MDX rendering**
   - How is MDX compiled and rendered? (next-mdx-remote, @next/mdx, contentlayer, etc.)
   - If using `next-mdx-remote`, are you using the `/rsc` import for server components?
   - Check if MDXRemote or equivalent is inside a client boundary

3. **Data fetching**
   - Is article content fetched client-side (useEffect, SWR, React Query)? If yes, move it to async server component with direct file/MDX read
   - Check if fetch calls to /api/posts/ are being made from the client side

4. **Layout and Suspense boundaries**
   - Check if article content is wrapped in <Suspense> with a fallback that hides content from initial HTML
   - Check if any parent layout is "use client"

5. **generateStaticParams / generateMetadata**
   - Is generateStaticParams implemented for /blog/[slug]? 
   - Is generateMetadata returning correct title and description from MDX frontmatter?

6. **Quick SSR test**
   - Run: curl -s https://snipgeek.com/blog/rename-pc-windows-11 | grep -o '.\{100\}' | head -50
   - If article body text is absent, confirm which component in the tree is causing client-side only rendering

## Goal
Article body content (h1, h2, paragraphs) must be present in the raw server-rendered HTML without JavaScript execution. Fix should not break the existing /api/posts/ route handler.

Please start by identifying the article page component file and trace the rendering path from page.tsx down to where MDX content is rendered."

Audit dibawah ini by VsCode.

I’m starting by tracing the blog route render path from the App Router page file to the MDX renderer so we can pinpoint exactly where SSR content disappears. I’ll locate the page component and the components it delegates to first.

Ran terminal command:  set -e
cd /home/iwan-efendi/Documents/SnipGeek
rg --files src/app | rg 'blog/.*/page\.tsx|blog/\[slug\]/page\.tsx|\[locale\]/blog/\[slug\]/page\.tsx'
rg -n "MDXRemote|next-mdx-remote|use client|Suspense|api/posts|generateStaticParams|generateMetadata" src/app src/components src/lib | head -200

I found no direct match on the first pattern, so next I’m listing all blog-related route files to find the actual slug page location and continue the trace.

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
rg --files src/app | rg 'blog|post|slug|\[locale\]'

Ripgrep isn’t installed in this environment, so I’m switching to workspace file search tools to continue the same trace without changing anything.

Searched for files matching `**/src/app/**/*blog*`, 1 match

Searched for files matching `**/src/app/**/*[[]slug[]]*`, no matches

Searched for files matching `**/src/app/**/page.tsx`, 20 matches

I’ve located the article route at [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx); next I’ll read it and follow each import to the MDX renderer and any client boundaries.

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/app/%5Blocale%5D/blog/%5Bslug%5D/page.tsx#1-1), lines 1 to 260

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/app/%5Blocale%5D/layout.tsx)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/components/mdx-components.tsx#1-1), lines 1 to 260

I confirmed the page itself is a server component so far; now I’m reading the remainder of the article page and key imported wrappers to identify where MDX enters a client boundary or Suspense fallback.

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/app/%5Blocale%5D/blog/%5Bslug%5D/page.tsx#261-261), lines 261 to 384

Searched for regex `^"use client"|MDXRemote|Suspense|dynamic\(|ssr:\s*false|useEffect|/api/posts` (`**/src/components/**`), 20 results

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/components/layout/firebase-provider-wrapper.tsx)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/components/layout/layout-deferred-ui.tsx)

I found a high-confidence culprit: the locale layout wraps all page content in a dynamic `ssr: false` provider, which can strip server HTML for the article body. I’ll now validate that with a live curl check and finish tracing MDX/data flow for the full audit checklist.

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s https://snipgeek.com/blog/rename-pc-windows-11 | grep -o '.\{100\}' | head -50

Searched for files matching `**/src/app/**/api/posts/**/*.ts`, 2 matches

Searched for regex `MDXRemote|next-mdx-remote|compileMDX|serialize|remark|rehype` (`**/src/lib/**`), 1 result

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/firebase/provider.tsx)

Next I’m verifying how article content is sourced and checking the API route and post loader to confirm data exists server-side while page HTML is withheld.

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s https://snipgeek.com/blog/rename-pc-windows-11 | grep -i "<article\|<h1\|How to Rename Your PC\|Step" | head -40
printf "\n--- API excerpt ---\n"
curl -s "https://snipgeek.com/api/posts/rename-pc-windows-11?locale=en" | head -c 500

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/app/api/posts/%5Bslug%5D/markdown/route.ts)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/lib/posts.ts)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/app/api/posts/%5Bslug%5D/route.ts)

I’ve confirmed the API route serves full article content from server-side file reads; now I’m retrying the HTML/API diff check with smaller commands and then I’ll map exactly why the page response omits body markup.

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s https://snipgeek.com/blog/rename-pc-windows-11 | grep -i "<article\|<h1\|How to Rename Your PC\|Step" | head -40

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s "https://snipgeek.com/api/posts/rename-pc-windows-11?locale=en" | head -c 1200

Searched for regex `use client|dynamic\(|ssr:\s*false|Suspense` (`**/src/app/**`), 16 results

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
html=$(curl -s https://snipgeek.com/blog/rename-pc-windows-11)
printf "%s" "$html" | grep -o "Skip to main content" | head -1 || true
printf "%s" "$html" | grep -o "id="main-content"" | head -1 || true
printf "%s" "$html" | grep -o "<article" | head -1 || true
printf "%s" "$html" | grep -o "Why Renaming Your PC Matters" | head -1 || true

I validated the shell-only symptom in DOM markers (`main-content` and `<article>` are absent), but I also found article text embedded somewhere in the HTML payload. I’ll pinpoint whether that text is only inside serialized RSC/Flight scripts rather than actual rendered markup.

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s https://snipgeek.com/blog/rename-pc-windows-11 > /tmp/snip_blog.html
awk 'BEGIN{IGNORECASE=1} /Why Renaming Your PC Matters/{print NR":"$0; exit}' /tmp/snip_blog.html
awk 'BEGIN{IGNORECASE=1} /Skip to main content/{print NR":"$0; exit}' /tmp/snip_blog.html
awk 'BEGIN{IGNORECASE=1} /<article/{print NR":"$0; exit}' /tmp/snip_blog.html || true
awk 'BEGIN{IGNORECASE=1} /id="main-content"/{print NR":"$0; exit}' /tmp/snip_blog.html || true
wc -l /tmp/snip_blog.html
sed -n '1,220p' /tmp/snip_blog.html | cat

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s https://snipgeek.com/blog/rename-pc-windows-11 > /tmp/snip_blog.html
python3 - <<'PY'
from pathlib import Path
s=Path('/tmp/snip_blog.html').read_text(errors='ignore')
for needle in ['Skip to main content','id="main-content"','<article','Why Renaming Your PC Matters','self.__next_f']:
    i=s.find(needle)
    print(needle, i)
    if i!=-1:
        start=max(0,i-160); end=min(len(s),i+260)
        print(s[start:end].replace('\n',' ')[:420])
        print('---')
PY

Searched for regex `ssr:\s*false|BAILOUT_TO_CLIENT_SIDE_RENDERING|dynamic\(` (`**/src/**`), 12 results

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/firebase/index.ts)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/firebase/client-provider.tsx)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/components/layout/layout-header.tsx#1-1), lines 1 to 220

Searched for regex `/api/posts|api/posts` (`**/src/**`), 13 results

Searched for regex `Suspense|fallback` (`**/src/app/[locale]/**`), no results

I’ve completed the trace and now I’m gathering exact line-level references for the final audit report, including the client bailout source and MDX server-render callsite.

Searched for text `FirebaseProviderWrapper|LayoutDeferredUi|<main id="main-content">|Skip to main content` (`**/src/app/[locale]/layout.tsx`), no results

Searched for regex `ssr: false|dynamic\(` (`**/src/components/layout/firebase-provider-wrapper.tsx`), 2 results

Searched for regex `MDXRemote|next-mdx-remote/rsc|generateStaticParams|generateMetadata|getPostData\(|dynamicParams` (`**/src/app/[locale]/blog/[slug]/page.tsx`), no results

Searched for text `"use client"` (`**/src/app/[locale]/blog/[slug]/page.tsx`), no results

Searched for regex `FirebaseProviderWrapper|LayoutDeferredUi|main-content|skip-link` (`SnipGeek` · `src/app/[locale]/layout.tsx`), no results

Searched for regex `MDXRemote|next-mdx-remote/rsc|generateStaticParams|generateMetadata|getPostData\(|dynamicParams` (`SnipGeek` · `src/app/[locale]/blog/[slug]/page.tsx`), no results

Searched for text `"use client"` (`SnipGeek` · `src/app/[locale]/blog/[slug]/page.tsx`), no results

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
nl -ba src/app/'[locale]'/layout.tsx | sed -n '1,240p'
printf "\n----\n"
nl -ba src/app/'[locale]'/blog/'[slug]'/page.tsx | sed -n '1,360p'
printf "\n----\n"
nl -ba src/components/layout/firebase-provider-wrapper.tsx | sed -n '1,120p'

Read [](file:///home/iwan-efendi/.config/Code/User/workspaceStorage/5086663e7019eab7b311e9c26f6fc8db/GitHub.copilot-chat/chat-session-resources/b1a6024f-9ca4-4724-9ac4-aafcd964be03/call_WAFshDYvh0Q9hOTymMlWFhif__vscode-1776059985215/content.txt#1-1), lines 1 to 320

Read [](file:///home/iwan-efendi/.config/Code/User/workspaceStorage/5086663e7019eab7b311e9c26f6fc8db/GitHub.copilot-chat/chat-session-resources/b1a6024f-9ca4-4724-9ac4-aafcd964be03/call_WAFshDYvh0Q9hOTymMlWFhif__vscode-1776059985215/content.txt#321-321), lines 321 to 675

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
nl -ba src/components/layout/layout-deferred-ui.tsx | sed -n '1,120p'

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/app/layout.tsx)

I’ve isolated the likely regression point; before finalizing I’m checking whether Firebase init is SSR-safe, since that explains why `ssr: false` may have been introduced in the first place.

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/components/blog/article-toc.tsx)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/firebase/config.ts)

Read [](file:///home/iwan-efendi/Documents/SnipGeek/src/components/blog/article-comments.tsx#1-1), lines 1 to 220

Ran terminal command:  cd /home/iwan-efendi/Documents/SnipGeek
curl -s https://snipgeek.com/blog/rename-pc-windows-11 | grep -o "BAILOUT_TO_CLIENT_SIDE_RENDERING" | head -1 || true

Read memory [](file:///home/iwan-efendi/.config/Code/User/workspaceStorage/5086663e7019eab7b311e9c26f6fc8db/GitHub.copilot-chat/memory-tool/memories/repo/snippet-facts.md)

Hasil audit tanpa perubahan kode:

1. Temuan utama (penyebab paling kuat)
- Route artikel memang dirender dari server component di [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L133), bukan client page.
- Tetapi seluruh isi halaman dibungkus oleh komponen client-only yang di-load dengan SSR dimatikan:
  - Wrapper dipakai di [src/app/[locale]/layout.tsx](src/app/[locale]/layout.tsx#L214)
  - Children artikel ada di [src/app/[locale]/layout.tsx](src/app/[locale]/layout.tsx#L228)
  - Definisi wrapper ada di firebase-provider-wrapper.tsx
  - Flag pemicu bailout ada di firebase-provider-wrapper.tsx
- Ini sangat konsisten dengan gejala kamu: HTML awal hanya shell (title + skip link), lalu konten artikel jatuh ke client rendering.

2. Bukti dari fetch production
- Di HTML production ada marker Next bailout: BAILOUT_TO_CLIENT_SIDE_RENDERING.
- Skip link muncul, tapi marker DOM konten utama seperti id="main-content" dan tag article tidak muncul sebagai HTML final saat initial response.
- Teks artikel memang terlihat di payload sebagai data RSC/Flight script, bukan sebagai markup artikel yang sudah jadi di HTML body.

3. Cek komponen artikel dan MDX
- File artikel tidak punya use client: [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L1)
- MDX dirender pakai varian server next-mdx-remote/rsc:
  - Import di [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L13)
  - Render di [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L273)
- Jadi pipeline MDX-nya sendiri sudah benar untuk SSR.

4. Cek data fetching
- Konten artikel diambil langsung dari server via getPostData di [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L139)
- Tidak ada pola useEffect atau fetch client ke /api/posts untuk body artikel.
- API route memang sehat dan mengembalikan content penuh:
  - [src/app/api/posts/[slug]/route.ts](src/app/api/posts/[slug]/route.ts#L1)
  - Loader konten file-based via engine di posts.ts

5. Cek Suspense dan parent layout
- Tidak ada Suspense fallback pada tree artikel yang menjelaskan hilangnya konten.
- Parent layout [src/app/[locale]/layout.tsx](src/app/[locale]/layout.tsx) adalah server component, tapi memasukkan boundary client-only yang men-disable SSR untuk subtree utama.

6. generateStaticParams dan generateMetadata
- Sudah ada dan terimplementasi:
  - generateMetadata: [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L31)
  - generateStaticParams: [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L122)
  - dynamicParams false: [src/app/[locale]/blog/[slug]/page.tsx](src/app/[locale]/blog/[slug]/page.tsx#L29)
- Metadata bukan sumber masalah ini.

Kesimpulan
- Akar masalah bukan di MDX article page, melainkan di layout-level client bailout akibat dynamic import dengan ssr false yang membungkus seluruh children halaman. Ini membuat konten artikel tidak hadir sebagai HTML SSR yang dapat langsung dibaca crawler non-JS.
- Endpoint /api/posts tetap aman dan tidak perlu diubah.

Kalau kamu mau, langkah berikutnya saya bisa kasih patch plan minimal-risk (tanpa eksekusi dulu) supaya body artikel kembali muncul di raw HTML sambil mempertahankan fitur Firebase client-only.

---

## Fix Applied (Cascade Re-Audit — 13 Apr 2026)

### Perubahan yang dilakukan

**1. `src/components/layout/firebase-provider-wrapper.tsx`** — Menghapus `dynamic()` dengan `ssr: false`

Sebelum:
```tsx
const FirebaseClientProvider = dynamic(() =>
  import('@/firebase').then((mod) => mod.FirebaseClientProvider),
  { ssr: false }
);
```

Sesudah:
```tsx
import { FirebaseClientProvider } from '@/firebase/client-provider';
```

Alasan aman: `initializeFirebase()` di `firebase/config.ts` sudah punya guard `typeof window === 'undefined'` yang return null services saat SSR. Semua consumer `useFirebase()` juga handle null gracefully.

**2. `src/app/[locale]/blog/loading.tsx`** — Direname ke `_loading.tsx.bak`

**3. `src/app/[locale]/blog/[slug]/loading.tsx`** — Direname ke `_loading.tsx.bak`

Alasan: `loading.tsx` membuat Suspense boundary otomatis yang menempatkan konten halaman ke `<div hidden id="S:x">`, sehingga crawler tanpa JS hanya melihat skeleton fallback. Untuk halaman SSG statis, ini tidak diperlukan.

### Hasil verifikasi (localhost `next start`)

```
✅ <article> in initial visible DOM
✅ prose-content in initial visible DOM
✅ id=main-content present
✅ <h1> present
✅ <h2> present
✅ No hidden replacement divs
✅ Text: "Why Renaming Your PC Matters"
✅ Text: "DESKTOP-"
✅ Text: "Rename this PC"
✅ prose-content is real DOM (not in script)
✅ 3x BAILOUT markers ALL before main-content (dari LayoutDeferredUi leaf components — tidak mempengaruhi konten)
```

### Yang tidak diubah
- `/api/posts/` route handler — tetap aman
- `generateStaticParams` dan `generateMetadata` — tetap berfungsi
- MDX rendering pipeline (`next-mdx-remote/rsc`) — tidak dimodifikasi
- Notes route `loading.tsx` — tidak diubah (terpisah dari blog)