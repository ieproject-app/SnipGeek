# SnipGeek

> A modern, minimalist tech blog and internal toolkit — built with Next.js 16, React 19, and Tailwind CSS v4.

SnipGeek is a bilingual (EN/ID) content platform for publishing technical articles, short notes, and running internal web-based tools. It uses the Next.js App Router with a `[locale]` dynamic segment for full i18n support, MDX for rich content, and Firebase for authentication and data storage.

---

## ✨ Features

### 📝 Blog & Notes
- MDX-powered articles and short-form notes with full syntax highlighting (via Shiki, `github-dark` theme)
- **Zoomable Images**: Interactive image previews with click-to-exit functionality
- **Download Buttons**: Custom MDX components for software/file downloads
- **Copyable Code Blocks**: One-click copy for all code snippets (`copyable-pre.tsx`)
- **Expandable Sections**: Collapsible content blocks for long details (`expandable.tsx`)
- **Gallery Lightbox**: Multi-image viewer with lightbox overlay (`gallery-lightbox.tsx`)
- **Spec Sheets**: Structured data tables for product/hardware specs (`spec-sheet.tsx`)
- Table of Contents auto-generated from `##` and `###` headings
- Reading time estimation
- Fallback to EN when a locale-specific translation does not exist
- Tag and category system with a colour-coded badge library (`category-badge.tsx`)
- Dedicated tag index page (`/tags`) and per-tag listing (`/tags/[tag]`)
- Giscus comment system (GitHub Discussions), lazy-loaded on scroll, production-only

### 📥 Download Pages
- Dedicated download routes (`/download/[slug]`) for software and driver packages
- Download metadata managed via `src/lib/data-downloads.ts`

### 🌐 Internationalization (i18n)
- Two locales: **English (`en`)** — default, no URL prefix — and **Indonesian (`id`)** — `/id/` prefix
- Locale detection via `Accept-Language` header with cookie-based persistence (`NEXT_LOCALE`)
- Client-side locale switching with `router.push(..., { scroll: false })` — no page reload, no scroll jump
- **Locale Suggestion Banner**: Prompts visitors to switch to their preferred language (`locale-suggestion-banner.tsx`)
- `hreflang` alternates on every public page for SEO

### 🎨 Theme System (3-mode)
- **Light / Dark / System** — cycled via a single button in the header and a floating button on scroll
- Preference persisted in `localStorage` with a 1-week expiry for manual overrides (light/dark)
- Switching to "System" removes the expiry so OS preference takes over immediately
- Smooth crossfade via the **View Transitions API** (`document.startViewTransition`) with a `prefers-reduced-motion` fallback

### 🔍 Search
- Full client-side search across all blog posts and notes, built into the header
- Multiple search strategies (`src/lib/search-strategies.ts`) with fuzzy matching via `fast-levenshtein`
- Highlights matching substrings in results

### 📚 Reading List
- Save/remove articles to a persistent reading list stored in `localStorage`
- Accessible from the header at any time

### 🛠️ Tools

#### Public (no login required)
| Tool | Route | Status |
|---|---|---|
| BIOS Keys & Boot Menu | `/tools/bios-keys-boot-menu` | ✅ Live |
| Spin Wheel | `/tools/spin-wheel` | ✅ Live |
| Image Crop & Compress | `/tools/image-crop` | ✅ Live |
| Random Name Picker | `/tools/random-name-picker` | ✅ Live |
| Laptop Service Estimator | `/tools/laptop-service-estimator` | ✅ Live |

#### Internal (Google login required)
| Tool | Route | Status |
|---|---|---|
| Number Generator | `/tools/number-generator` | ✅ Live |
| Employee History (Riwayat Karyawan) | `/tools/employee-history` | ✅ Live |

#### Admin-Only
| Tool | Route | Status |
|---|---|---|
| Prompt Generator | `/admin/prompt-generator` | ✅ Live |

#### Unreleased (dev mode only)
| Tool | Route | Status |
|---|---|---|
| Signatories Index | `/tools/signatories-index` | 🔧 Dev Only |
| Compress PDF | `/tools/compress-pdf` | 🔧 Dev Only |
| Address Label Generator | `/tools/address-label-generator` | 🔧 Dev Only |

#### Coming Soon
| Tool | Status |
|---|---|
| Number to Words | 🚧 In Development |

### 📢 Notification Bar
- Custom status-bar notification system (`useNotification`) shown in the header
- Used for reading list actions, copy confirmations, etc.
- **Do not** replace with Shadcn's `useToast` for these short feedback messages

### 🛡️ Admin Dashboard
- Secure admin area at `/admin` with Google authentication
- Protected by Firebase Auth — only users with `admin` role in Firestore `roles_admin/{uid}` can access
- **Prompt Generator**: AI-powered content generation tool with Cloudinary image integration
  - Supports Cloudinary URLs for hero images, galleries, and grid layouts
  - Users enter Cloudinary URLs directly (e.g., `https://res.cloudinary.com/snipgeek/image/upload/...`)
  - No additional Cloudinary SDK configuration required — purely URL-based
- Dashboard overview with system status and quick actions
- Separate admin login at `/admin/login`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Install & Run

```bash
npm install
npm run dev        # starts on http://localhost:9003 (Turbopack)
```

### Other Scripts

```bash
npm run build          # production build (runs tag validation first)
npm run start          # serve the production build
npm run typecheck      # tsc --noEmit (no build artefacts)
npm run lint           # ESLint
npm run validate:tags  # validate all MDX tag metadata
npm run check          # pre-deploy checks (image sizes, etc.)
npm run test           # run Vitest test suite (once)
npm run test:watch     # run Vitest in watch mode
```

---

## 🔧 Firebase Configuration

SnipGeek uses Firebase for Auth and Firestore (internal tools). Firebase config is loaded **exclusively from environment variables** — never hardcoded.

### Local Development (`.env.local`)

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: restrict internal tools to specific Google accounts/domains
# Example: alice@snipgeek.com,bob@gmail.com,@telkomakses.co.id
NEXT_PUBLIC_INTERNAL_TOOL_ALLOWLIST=

# Giscus (GitHub Discussions comments)
NEXT_PUBLIC_GISCUS_REPO_ID=your_repo_id
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your_category_id
```

If `NEXT_PUBLIC_INTERNAL_TOOL_ALLOWLIST` is empty, internal tools remain accessible to any authenticated Google account (legacy behavior). If set, only matching emails/domains can access non-public tools.

### Production (Google Cloud — `apphosting.yaml`)

The project is deployed via **Firebase App Hosting**. Environment variables for production are injected through `apphosting.yaml` using the Secret Manager bypass pattern.

> ⚠️ **Do NOT remove or modify the `value` / `availability` fields** in `apphosting.yaml`. This is the only mechanism that ensures keys are available during the Cloud Build step.

**Deployment steps:**
1. `git push` to `main`
2. Open Firebase Console → **App Hosting** → **Rollouts**
3. Click **"Start Rollout"** whenever `apphosting.yaml` is changed

---

## 📁 Project Structure

```
src/
├── app/
│   ├── [locale]/               # All public pages
│   │   ├── blog/
│   │   │   ├── [slug]/         # Individual post page (MDX rendered server-side)
│   │   │   └── page.tsx        # Blog list
│   │   ├── notes/
│   │   │   └── [slug]/         # Individual note page
│   │   ├── tools/              # Tool pages (bios-keys, spin-wheel, image-crop, …)
│   │   ├── download/[slug]/    # Software/driver download pages
│   │   ├── tags/               # Tag index + per-tag post listing
│   │   ├── login/              # Login page
│   │   ├── about/              # About page
│   │   ├── contact/            # Contact page
│   │   ├── privacy/            # Privacy policy
│   │   ├── disclaimer/         # Disclaimer
│   │   ├── terms/              # Terms of service
│   │   └── layout.tsx          # Locale layout — fonts, ThemeProvider, Header, Footer
│   ├── api/                    # API routes (numbers, posts, notes, tools, img, dev)
│   ├── admin/                  # Admin dashboard (protected)
│   │   ├── login/              # Admin login page
│   │   ├── prompt-generator/   # Prompt Generator tool
│   │   └── index-monitor/      # Index monitoring tool
│   ├── llms.txt/               # Dynamic /llms.txt route for AI crawler accessibility
│   ├── globals.css             # Tailwind 4 CSS (CSS variables for light/dark)
│   ├── not-found.tsx           # 404 page (ThemeProvider-aware, correct fonts)
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── opengraph-image.tsx     # Dynamic OG image generation
│   └── twitter-image.tsx       # Dynamic Twitter card image generation
├── components/
│   ├── layout/                 # Header, Footer, Breadcrumbs, ThemeSwitcher, LanguageSwitcher,
│   │                           #   LocaleSuggestionBanner, BackToTop, SearchPanel, StaticPageTemplate,
│   │                           #   FirebaseProviderWrapper, AddToReadingListButton, CategoryBadge
│   ├── blog/                   # article-meta, article-share, article-related, article-toc,
│   │                           #   article-tags, article-comments
│   ├── home/                   # home-hero, home-latest, home-notes, home-topics,
│   │                           #   home-tutorials, home-updates, home-transition-note
│   ├── tools/                  # tool-wrapper, tools-list, tool-bios-keys, tool-history,
│   │                           #   tool-numbers, tool-image-crop, tool-prompt-builder,
│   │                           #   tool-random-name-picker, + address-label/, compress-pdf/,
│   │                           #   numbers/, pdf/, prompt-builder/, random-name-picker/,
│   │                           #   signatories-index/, image-crop/, employee-history/
│   ├── mdx/                    # Custom MDX components: copyable-pre, expandable,
│   │                           #   gallery-lightbox, spec-sheet
│   ├── ui/                     # 40+ Shadcn/UI primitives + custom (SnipTooltip, Skeleton,
│   │                           #   ScrollReveal, RevealImage, RelativeTime, …)
│   ├── icons/                  # Custom SVG icons: XLogo, TikTokLogo, SnipGeekLogo,
│   │                           #   PinterestLogo, WindowsStoreLogo
│   ├── analytics/              # Firebase Analytics tracker (client-side page_view logging)
│   ├── admin/                  # Admin/dev components
│   ├── mdx-components.tsx      # Global MDX component registry
│   ├── zoomable-image.tsx      # Click-to-zoom image overlay
│   └── theme-provider.tsx      # next-themes ThemeProvider wrapper
├── dictionaries/
│   ├── en.json                 # English strings
│   └── id.json                 # Indonesian strings (must always be in sync with en.json)
├── firebase/
│   ├── config.ts               # Firebase singleton init (memoizedServices pattern)
│   ├── index.ts                # Re-exports (useUser, useAuth, etc.)
│   ├── provider.tsx            # FirebaseProvider context
│   ├── client-provider.tsx     # Client-side Firebase provider
│   ├── non-blocking-login.tsx  # Non-blocking Google sign-in flow
│   ├── non-blocking-updates.tsx# Non-blocking Firestore update helpers
│   ├── error-emitter.ts        # Firebase error event emitter
│   ├── errors.ts               # Typed Firebase error handling
│   ├── storage.ts              # Firebase Storage helpers
│   └── firestore/              # Firestore collection helpers
├── hooks/
│   ├── use-theme-mode.ts       # Centralised theme cycling + persistence logic
│   ├── use-reading-list.tsx    # Reading list context + localStorage persistence
│   ├── use-notification.tsx    # Status bar notification context
│   ├── use-image-compress.ts   # Client-side image compression hook (browser-image-compression)
│   ├── use-toast.ts            # Shadcn toast hook (for complex UI toasts only)
│   └── use-mobile.tsx          # Mobile breakpoint detection
├── lib/
│   ├── constants.ts            # localStorage key constants (STORAGE_KEYS)
│   ├── utils.ts                # cn(), getLinkPrefix(), resolveHeroImage(), formatRelativeTime()
│   ├── posts.ts                # MDX post utilities (read, sort, translate)
│   ├── notes.ts                # MDX notes utilities
│   ├── pages.ts                # Static page utilities
│   ├── static-pages.ts         # Static page route generation
│   ├── tags.ts                 # Tag registry and utilities
│   ├── mdx-utils.ts            # extractHeadings() for ToC
│   ├── get-dictionary.ts       # Async dictionary loader
│   ├── content-engine.ts       # Shared MDX file helpers (MdxFileEntry, frontmatter reading)
│   ├── api-helpers.ts          # Shared API route helpers and response utilities
│   ├── placeholder-images.ts   # Typed wrapper for placeholder-images.json
│   ├── placeholder-images.json # Image placeholder registry (id → imageUrl + hint)
│   ├── data-downloads.ts       # Download page metadata (drivers, software)
│   ├── cv-data.ts              # CV/resume data for internal tools
│   ├── firebase-admin.ts       # Firebase Admin SDK init (server-side)
│   ├── firebase-config.ts      # Firebase client config helper
│   ├── search-strategies.ts    # Search algorithms (fuzzy, exact, etc.)
│   ├── slugify.ts              # URL slug utilities
│   ├── multicolor.ts           # Multi-colour generation utilities
│   └── rate-limit.ts           # API rate limiting
├── types/
│   ├── address-types.ts        # Type definitions for address label tool
│   ├── pdf-types.ts            # Type definitions for PDF tools
│   └── lucide-react.d.ts       # Type augmentation for Lucide React
├── i18n-config.ts              # Locale definitions (en, id)
└── proxy.ts                    # Locale detection + cookie-based redirect/rewrite (replaces middleware.ts in Next.js 16)
```

### Content Directories

```
_posts/
├── en/
│   └── 2026-H1/   # English MDX posts (period-based subdirectories)
└── id/
    └── 2026-H1/   # Indonesian MDX posts

_notes/
├── en/
│   └── 2026-H1/
└── id/
    └── 2026-H1/

_pages/              # Static pages (about, contact, privacy, disclaimer, terms)
├── about/
│   ├── en.mdx
│   └── id.mdx
├── contact/
├── disclaimer/
├── privacy/
└── terms/
```

---

## ✍️ Writing Content

### Required Frontmatter

Every `.mdx` file **must** include:

```yaml
---
title: "Your Article Title"
date: "2025-01-15"
updated: "2025-01-20"       # optional — used in sitemap lastModified
description: "One-sentence summary for SEO and card previews."
translationKey: "english-kebab-case-slug"  # REQUIRED — same in EN and ID versions
heroImage: "img-id-from-json"              # Use an ID from placeholder-images.json
# heroImage: "/images/blog/custom.webp"   # or a /images/ path for a custom image
published: true                            # false = draft (visible only in dev)
featured: false                            # true = shown in HomeHero carousel
category: "Tutorial"                       # drives the colour-coded badge
tags: ["Windows", "PowerShell"]
---
```

### Heading Structure
- Use only `##` (H2) and `###` (H3) — these are automatically parsed into the Table of Contents
- Never use `#` (H1) inside content — the page `<h1>` is the article title

### Bilingual Post Rules
- **Filenames must be identical** between EN and ID versions — the filename IS the URL slug
- EN: `_posts/en/2026-H1/my-post.mdx` → `/blog/my-post`
- ID: `_posts/id/2026-H1/my-post.mdx` → `/id/blog/my-post`
- Identical fields across EN/ID: `slug`, `translationKey`, `tags`, `category`, `heroImage`, `date`, `published`, `featured`
- Translated fields: `title`, `description`, `imageAlt`

### Content Workflow
1. Check `src/lib/placeholder-images.json` for a suitable hero image `id`
2. If none fits, add a new entry to the JSON first
3. Create the MDX file in `_posts/en/2026-H1/` (and optionally the ID version with the same filename)
4. Set `published: false` while drafting — the Dev Tools draft panel shows all unpublished files
5. Run `npm run validate:tags` to ensure tag metadata is valid before pushing

---

## 🎨 Design System

### Typography (fluid — always use tokens, never raw `text-5xl`)

| Token | Range | Use |
|---|---|---|
| `text-display-sm` | 36–68px | Page H1 (blog list, contact, notes list) |
| `text-h1` – `text-h6` | 14–30px | Section and card headings |
| `text-article-base` | 17–20px | Article body prose |
| `text-ui-sm` / `text-ui-xs` | 11 / 10px | Badges, timestamps |

### Colour Philosophy
- **Never** hardcode Tailwind palette classes (`text-blue-500`, `bg-gray-900`)
- Always use semantic CSS variable tokens: `text-primary`, `text-accent`, `bg-muted`, etc.
- Use opacity modifiers for variants: `text-primary/60`, `bg-primary/10`

### Spacing Tokens
```tsx
// ✅ Semantic section padding
<section className="py-section-sm sm:py-section-md">

// ❌ Hardcoded — avoid
<section className="py-12 sm:py-16">
```

### Component Rules
| Element | Rule |
|---|---|
| Rounded corners | `rounded-xl` or `rounded-2xl` — never `rounded-sm` |
| Glassmorphism | `bg-card/50 backdrop-blur-sm border-primary/5` |
| Icons | Lucide React only — never guess icon names |
| Badges | Use `CategoryBadge` — never create colours ad-hoc |
| Notifications | `useNotification()` — never `useToast()` for short feedback |
| Tool headers | Always use `ToolWrapper` — never create custom hero sections |

---

## 🔑 localStorage Key Reference

All keys are defined in `src/lib/constants.ts` as `STORAGE_KEYS`. **Always use the constant, never a raw string.**

| Constant | Key | Purpose |
|---|---|---|
| `STORAGE_KEYS.READING_LIST` | `readingList` | Saved reading list items (JSON array) |
| `STORAGE_KEYS.THEME_MANUAL_EXPIRE` | `snipgeek-theme-manual-expire` | Unix ms timestamp — manual theme expiry |
| `STORAGE_KEYS.THEME` | `theme` | Active theme (`light`/`dark`/`system`) |
| `STORAGE_KEYS.LOCALE` | `NEXT_LOCALE` | User's chosen language |

---

## 🌍 i18n Rules

- `i18n.defaultLocale` is `"en"` — English URLs have **no prefix** (e.g., `/blog/my-post`)
- Indonesian URLs use `/id/` prefix (e.g., `/id/blog/my-post`)
- When adding new dictionary keys, **always update both** `en.json` and `id.json` simultaneously
- `i18n.locales` is a readonly tuple — use spread `[...i18n.locales]` when a mutable array is needed
- Every public `page.tsx` **must** export `generateMetadata` with `alternates.languages` for hreflang SEO

---

## 🛡️ Security Headers

The following HTTP headers are applied to all routes via `next.config.ts`:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, mic, geolocation, interest-cohort blocked |
| `Strict-Transport-Security` | 1 year, includeSubDomains |
| `Content-Security-Policy` | Comprehensive CSP covering Firebase, GA4, Giscus, YouTube, Monetag |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` (required for Firebase/Google Auth popups) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router, Turbopack) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 + Shadcn/UI |
| Icons | Lucide React |
| Fonts | Bricolage Grotesque, Plus Jakarta Sans, Lora, JetBrains Mono |
| Content | MDX via `next-mdx-remote` v6 |
| Syntax Highlighting | Shiki (`github-dark` theme) |
| Auth & DB | Firebase v12 (Auth + Firestore + Storage) |
| Animations | Framer Motion + CSS View Transitions API |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |
| Date Utilities | date-fns |
| PDF | pdf-lib (generation) + pdfjs-dist (parsing) |
| OCR | Tesseract.js (client) + `@google-cloud/vision` (server) |
| Image Processing | Sharp (server) + browser-image-compression (client) + Cloudinary (URL-based image hosting) |
| Spreadsheets | ExcelJS |
| Carousel | Embla Carousel React |
| Confetti | react-confetti |
| Testing | Vitest + `@testing-library/react` + happy-dom |
| i18n | Custom proxy + `@formatjs/intl-localematcher` |
| Analytics | Firebase Analytics (client-side page_view) |
| Ads | Google AdSense (`lazyOnload` strategy) |
| Comments | Giscus (GitHub Discussions) |
| Deployment | Firebase App Hosting (Google Cloud) |

---

## 📋 Firebase Singleton Pattern

All Firebase services are initialised once via `src/firebase/config.ts` using a `memoizedServices` pattern. **Never** call `getAuth()` or `getFirestore()` directly outside the provider.

```typescript
// ✅ Always guard against null before Firestore operations
const handleSubmit = async () => {
  if (!db) return;
  // safe to use db
};

// ✅ getStorage needs undefined, not null
const storage = getStorage(firebaseApp ?? undefined);
```

---

## 📄 License

This project uses a **dual license** — please read carefully:

### Source Code — MIT License
All application code in this repository (under `src/`, config files, etc.) is licensed under the **MIT License**.
See the [`LICENSE`](./LICENSE) file for the full terms.

### Content — All Rights Reserved
All written content, articles, and notes — including everything under `_posts/`, `_notes/`, and `_pages/` — are the exclusive intellectual property of **SnipGeek (snipgeek.com)**.

You may **NOT** reproduce, republish, or create derivative works from this content without explicit written permission.

For inquiries: hello@snipgeek.com

---

*SnipGeek &copy; 2026 — Iwan Efendi. All Rights Reserved.*