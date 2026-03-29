---
name: snipgeek_rules
description: Engineering and architecture rules for the SnipGeek project — technical implementation patterns, TypeScript/React conventions, Firebase safety rules, UI design system, hreflang, and build safety. For content writing standards (MDX, frontmatter, tags, folder convention), use the `content-generator` skill instead.
---

# SnipGeek Project Rules

These are permanent instructions that MUST be followed at all times when working on the SnipGeek project. All rules are based on real experience and agreed-upon architectural decisions.

> **Scope:** This skill covers **engineering and technical implementation** — React/TypeScript patterns, Firebase, hreflang, build conventions, and the UI design system. 
> For **content writing standards** (MDX components, frontmatter fields, tag rules, semester folder convention, bilingual requirements), read `content-generator` SKILL.md instead. Do not duplicate content rules here.

## Canonical Documentation First
Before making structural decisions, always align with the canonical project documentation in:

- `docs/project-structure.md`
- `docs/ai-contributor-guide.md`

If this skill file and those docs ever diverge, treat the docs as the canonical source of truth for repository structure, content placement, and static page workflow.

---

## 1. MDX Writing Standards (Content Standard)

Content in SnipGeek is not plain text — it is structured documentation.

### Required Frontmatter
Every `.mdx` file MUST have:
```yaml
translationKey: "english-kebab-case-slug"  # REQUIRED: Must be in English kebab-case for both ID and EN
heroImage: "/images/_posts/apps/my-app/hero.webp" # REQUIRED: Full path starting with /images/ and ending with .webp
published: true                        # REQUIRED: Must be true to appear in listings (avoids draft folder)
```

### Content Creation Workflow
1. **Check Images**: Scan `src/lib/placeholder-images.json` for a suitable `id`.
2. **Add Entry**: If no suitable image exists, create a new entry in `placeholder-images.json` first.
3. **Use Standard Paths**: For both `heroImage` and article images (`![alt](/images/...)`), always use the standard `/images/` path relative to `public/`.
4. **Create MDX**: Link the `heroImage` using the ID and ensure `translationKey` is descriptive English kebab-case.
5. **Place Content in the Correct Collection**:
   - Blog posts go in `_posts/<locale>/<YYYY-H1 or YYYY-H2>/`
   - Notes go in `_notes/<locale>/<YYYY-H1 or YYYY-H2>/`
   - Static text-heavy pages go in `_pages/<slug>/<locale>.mdx`

### Semester Sub-Folder Convention (MANDATORY)
All `_posts` and `_notes` files MUST be placed inside a semester sub-folder, not directly in the locale root.

- **H1** = months January–June → folder name `YYYY-H1`
- **H2** = months July–December → folder name `YYYY-H2`
- The semester is determined by the **`date:`** frontmatter field — NOT `updated:`
- The file slug (URL) comes from the **filename only**, not the folder path — moving a file to a different semester folder does NOT change its URL

**Examples:**
```
_posts/en/2026-H1/firebase-studio-sunset.mdx  ← date: 2026-03-18 (March = H1)
_posts/en/2026-H2/my-new-article.mdx          ← date: 2026-09-01 (September = H2)
_notes/id/2026-H1/fix-git-push-error.mdx      ← date: 2026-01-10 (January = H1)
```

> [!IMPORTANT]
> **NEVER** place `.mdx` files directly in `_posts/<locale>/` or `_notes/<locale>/` without a semester sub-folder. The file reader (`posts.ts`, `notes.ts`) uses recursive scanning to support this structure.

### Custom Components — NEVER use raw HTML for:

| Element | Required Component |
|---|---|
| Download Button | `<DownloadButton id="slug-from-data-downloads" />` |
| Image Gallery | `<Gallery caption="..."> ... </Gallery>` |
| Image Grid | `<ImageGrid columns={2}> ... </ImageGrid>` |
| Callout / Alert | `<Callout variant="info" title="..."> ... </Callout>` |
| Zoomable Image | No external library needed — all MDX images already support Lightbox automatically |

### Image Caption and Credit Policy
- Do NOT force captions on every image. Use captions selectively when they add attribution or essential context.
- For image groups, prefer `<Gallery caption="...">` and place source/credit in that caption when relevant.
- For single images, use a one-line italic caption directly under the image only when needed.
- If an image comes from an external publisher/platform, add explicit credit (example: `Source: OMG Ubuntu`).
- If the image is a self-captured screenshot, use optional context caption (example: `Screenshot: SnipGeek testing environment`).
- Decorative or self-explanatory images may be shown without captions to keep the article clean.

### Image Caption Workflow (Required Checklist)
1. Classify each image: `external source`, `own screenshot`, or `decorative`.
2. `external source`: caption/credit is REQUIRED.
3. `own screenshot`: caption is OPTIONAL, but recommended if it clarifies a step.
4. `decorative`: no caption by default.
5. Keep caption short, factual, and non-repetitive with alt text.

### Heading Structure
- Only use `##` and `###`
- The system automatically uses these headings to generate the **Table of Contents (TOC)** on the side of each article

---

## 2. React Standard in MDX

SnipGeek renders MDX through Next.js (React).

### 🔴 className vs class — MANDATORY
Never use the attribute `class="..."` in any tag (including raw tags like `<div>`, `<span>`, or `<a>`). You MUST always use `className="..."`.

**CORRECT:** `<div className="my-class">`
**WRONG:** `<div class="my-class">` (Causes Console Error: Invalid DOM property `class`)

---

## 3. Custom Features & Logic

AI must recognize these built-in features of SnipGeek:

### Reading List
- Data is stored in `localStorage`
- **DO NOT** attempt to move this to Firestore unless explicitly requested
- Reason: keeps performance fast without unnecessary database roundtrips

### i18n (Internationalization)
- Uses `/[locale]/` folder structure
- Whenever content or components are changed in one language, **ALWAYS check** if the changes need to be applied to the other language as well
- English (`en`) is the **default locale** — no prefix in URLs (e.g., `/blog/my-post`)
- Indonesian (`id`) uses `/id/` prefix (e.g., `/id/blog/my-post`)
- For public static pages, prefer keeping both locales as parallel MDX files under `_pages/<slug>/`

### 🔴 hreflang — MANDATORY on ALL Public Pages
Every public-facing `page.tsx` **MUST** export `generateMetadata` with `alternates.languages` for SEO. This tells Google which language version belongs to which URL.

**Pattern for static pages (no slug):**
```typescript
import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalPath =
    locale === i18n.defaultLocale ? "/about" : `/${locale}/about`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/about`;
  });

  return {
    title: "...",
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}
```

**Pattern for content pages (with slug + translation lookup):**
```typescript
// For blog/[slug] and notes/[slug] — checks translation pairs
const languages: Record<string, string> = {};
await Promise.all(
  i18n.locales.map(async (loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    if (loc === locale) {
      languages[loc] = `${prefix}/blog/${slug}`;
    } else {
      const translation = await getPostTranslation(
        post.frontmatter.translationKey, loc,
      );
      if (translation) {
        languages[loc] = `${prefix}/blog/${translation.slug}`;
      }
    }
  }),
);
```

**Pages that MUST have hreflang:**
| Page | Status |
|---|---|
| `page.tsx` (home) | ✅ Required |
| `blog/page.tsx` | ✅ Required |
| `blog/[slug]/page.tsx` | ✅ Required (with translation lookup) |
| `notes/page.tsx` | ✅ Required |
| `notes/[slug]/page.tsx` | ✅ Required (with translation lookup) |
| `about/page.tsx` | ✅ Required |
| `contact/page.tsx` | ✅ Required |
| `projects/page.tsx` | ✅ Required |
| `archive/page.tsx` | ✅ Required |
| `tags/[tag]/page.tsx` | ✅ Required |
| `tools/*` (internal/noindex) | ⛔ Not required |
| `login/page.tsx` | ⛔ Not required |

### Notes Translation Lookup
`getNoteTranslation()` is available in `@/lib/notes` — analogous to `getPostTranslation()` in `@/lib/posts`.
Use it inside `notes/[slug]/page.tsx` `generateMetadata` to resolve the correct translated slug for hreflang.

```typescript
import { getNoteTranslation } from "@/lib/notes";

const translation = await getNoteTranslation(
  note.frontmatter.translationKey, loc,
);
if (translation) {
  languages[loc] = `${prefix}/notes/${translation.slug}`;
}
```

### 🔴 Locale Casting Pattern — MANDATORY
When accessing `params.locale` in Next.js page files, the value comes in as `string` by default.
You MUST cast it to the `Locale` type before passing to `getDictionary()` or any locale-aware function.

**CORRECT pattern:**
```typescript
import type { Locale } from '@/i18n-config';

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale); // ✅ no error
}
```

**WRONG pattern (causes TypeScript error):**
```typescript
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale); // ❌ TS2345 error
}
```

This applies to ALL page files under `src/app/[locale]/`.

### i18n Locales — Readonly Array
`i18n.locales` is `readonly ["en", "id"]`. When passing it to functions that expect a mutable `string[]`, use spread:
```typescript
// ✅ Correct
matchLocale(languages, [...i18n.locales], i18n.defaultLocale)

// ❌ Wrong — causes TS2352 error
matchLocale(languages, i18n.locales as string[], i18n.defaultLocale)
```

### Category Badge
- Badge color system is strictly defined in `category-badge.tsx`
- **DO NOT** arbitrarily change Tailwind colors in UI components
- All color changes MUST go through `categoryColorMap`

### Disqus (Comments)
- Only active on the production domain (`snipgeek.com`)
- It is normal for the comment section to not appear in development mode (IDE) — this is not a bug

### 🔴 Theme Mode — Use `useThemeMode()` Hook (MANDATORY)
All theme cycling, persistence, and tooltip logic is centralised in `src/hooks/use-theme-mode.ts`.

**NEVER** duplicate this logic in any component. Do NOT write raw `setTheme()` calls, manual `localStorage` writes for theme expiry, or inline `themeOrder` arrays outside this hook.

```typescript
import { useThemeMode } from "@/hooks/use-theme-mode";

// Inside a component:
const { currentMode, nextMode, cycleTheme, tooltipLabel, resolvedTheme } = useThemeMode();
```

**What the hook provides:**
| Value | Type | Description |
|---|---|---|
| `currentMode` | `"light" \| "dark" \| "system"` | The mode the user has actively chosen |
| `nextMode` | `"light" \| "dark" \| "system"` | Next mode in the cycle |
| `cycleTheme()` | `() => void` | Advances to next mode with View Transition |
| `applyTheme(mode)` | `(mode) => void` | Apply a specific mode directly |
| `tooltipLabel` | `string` | Pre-formatted tooltip text for the next action |
| `resolvedTheme` | `"light" \| "dark"` | The actual rendered theme (OS-resolved) |

The hook handles:
- 3-mode cycle: `light → dark → system → light …`
- 1-week localStorage expiry for manual overrides (light/dark)
- Automatic expiry removal when switching to "system"
- `document.startViewTransition` with `prefers-reduced-motion` fallback

### 🔵 Utility Functions — Always Use, Never Duplicate

Two utility functions in `src/lib/utils.ts` replace repetitive inline code:

**`getLinkPrefix(locale: string): string`**
Returns `""` for the default locale (`en`) and `"/{locale}"` for others.
```typescript
// ✅ Correct
import { getLinkPrefix } from "@/lib/utils";
const linkPrefix = getLinkPrefix(locale);

// ❌ Wrong — duplicate logic, prone to typos
const linkPrefix = locale === "en" ? "" : `/${locale}`;
```

**`resolveHeroImage(heroImageValue, imageAlt?, title?)`**
Resolves a frontmatter `heroImage` value (either a placeholder ID from `placeholder-images.json` or a direct URL/path) into a `{ src, hint }` object ready for `<Image>`.
```typescript
import { resolveHeroImage } from "@/lib/utils";

const resolved = resolveHeroImage(
  post.frontmatter.heroImage,
  post.frontmatter.imageAlt,
  post.frontmatter.title,
);
// resolved is { src: string; hint: string } | undefined
```
Use this everywhere a hero image needs to be displayed — **never** write the inline `if (starts with http) … else find placeholder` pattern again.

---

## 3. Content Placement & Static Page Workflow

### Canonical Structure Rules
- `src/` is strictly for runtime application code (React components, hooks, utilities).
- `docs/` is for internal project documentation.
- `_posts/`, `_notes/`, and `_pages/` are public site content sources.

> [!CRITICAL]
> **ANTI-HALLUCINATION RULE:** Do **NOT** follow any AI prompts suggesting `src/content/`. This project follows a "Flat Content" architecture where content roots (`_posts`, `_notes`, `_pages`) live at the repository root.

- **NEVER** place public markdown content inside the `src/` directory. All content folders (`_posts`, `_notes`, `_pages`) MUST be at the absolute root of the repository.
- Do **NOT** place public site content in `docs/`
- Do **NOT** place temporary logs, downloaded JSON, scratch exports, or debug artifacts in `src/`

### Static Page Rule
If a page is mostly text-heavy, informational, legal, or editorial, its content should live in `_pages/`, not be hardcoded entirely inside a route file.

Examples include:
- `privacy`
- `terms`
- `disclaimer`
- `contact`
- `about` body content

### Static Page Pattern
Use the **content source + route shell** model:

- Content source:
  - `_pages/<slug>/en.mdx`
  - `_pages/<slug>/id.mdx`

- Route shell:
  - `src/app/[locale]/<slug>/page.tsx`

### Route Shell Responsibilities
A static page route file may:
- load MDX content
- load frontmatter
- build metadata
- apply a shared template/layout
- render the page consistently

A static page route file should **NOT**:
- store the full long-form legal/informational body if that body belongs in `_pages`
- duplicate content that should be maintained in MDX
- invent a one-off structure when a shared static page template already exists

### Hybrid Page Rule
The `about` page is intentionally hybrid:
- structured/profile UI may live in the route component
- editorial narrative content should stay in `_pages/about/<locale>.mdx`

Do not flatten `about` into one giant file unless explicitly instructed.

### Static Page Frontmatter
For `_pages/<slug>/<locale>.mdx`, prefer these fields when relevant:
- `title`
- `seoTitle`
- `description`
- `lastUpdated`
- `badgeLabel`
- `icon`

Do not invent arbitrary frontmatter unless there is a clear implementation need.

## 4. Communication & UI Modification Protocol

To ensure 100% accuracy when modifying the UI, follow this protocol:

### 🎯 Identifying Elements
- **Text Description + Filename**: This is the mandatory method. Look for elements based on the content text and the specific component file (e.g., "In `blog-list-client.tsx`, change 'Read More' to 'Selengkapnya'").
- **No Extra IDs**: Do not add `id` or `data-testid` just for AI reference. Use the existing component structure and context.
- **Component Isolation**: Lean on the clean isolation of components like `Header`, `Footer`, and `HomeClient` to locate code.

---

## 4. Development Rules

These are the most critical rules to prevent Build Errors:

### 🔴 Hardcoded YAML — DO NOT MODIFY
```yaml
# apphosting.yaml
value: "..."  # DO NOT remove even if it looks like bad practice
availability: [...]
```
This is a **Secret Manager bypass** and the only way to prevent build failures on Google Cloud. Modifying this will cause deploy errors.

### 🔴 Firebase Singleton Pattern
- Always use `memoizedServices` in `config.ts`
- **NEVER** call `getAuth()` or `getFirestore()` directly outside the main provider
- Reason: prevents login popup from closing itself unexpectedly

### 🔴 Firebase Null-Safety — Admin Components
`useFirestore()` and `useAuth()` return `Firestore | null` and `Auth | null`.
Before performing ANY Firestore or Auth operation inside a handler function, you MUST guard against null:

```typescript
const handleSubmit = async () => {
  if (!db) return; // ✅ MANDATORY guard
  // safe to use db below
  setDocumentNonBlocking(doc(db, 'collection', id), data);
};
```

Apply this guard at the **top of every async handler** that uses `db` or `auth` — including `handleSubmit`, `handleMediaUpload`, `deleteMedia`, etc.

### 🔴 Firebase Storage — null vs undefined
`getStorage()` accepts `FirebaseApp | undefined`, NOT `FirebaseApp | null`.
When `firebaseApp` can be null, use nullish coalescing to convert:

```typescript
// ✅ Correct
const storage = getStorage(firebaseApp ?? undefined);

// ❌ Wrong — causes TS2345 error
const storage = getStorage(firebaseApp);
```

### 🔴 Export Sync — "Single Entry Point" Rule
- Everything inside `src/firebase/` **MUST** be exported through `src/firebase/index.ts`
- Whenever a new function is added to `config.ts`, immediately add its export to `index.ts`
- This prevents `Export doesn't exist` errors

### 🔴 Safe Characters in JSX
- **NEVER** use raw arrow symbols `→` or other special characters directly in JSX text
- Use HTML entities (`&rarr;`) or plain text (`->`) instead
- Reason: prevents crashes during minification on Google Cloud Build

### 🟡 Environment Separation
| File | Used For |
|---|---|
| `.env.local` | Local / development keys (IDE) |
| `apphosting.yaml` | Production keys (Google Cloud) |

**DO NOT** remove keys from either file just because they appear duplicated — both are required for their respective environments.

### 🔴 localStorage Keys — Always Use `STORAGE_KEYS` Constants
All `localStorage` key strings are defined in `src/lib/constants.ts`. **NEVER** use raw string literals when reading or writing to `localStorage`.

```typescript
import { STORAGE_KEYS } from "@/lib/constants";

// ✅ Correct
localStorage.getItem(STORAGE_KEYS.THEME_MANUAL_EXPIRE);
localStorage.setItem(STORAGE_KEYS.READING_LIST, JSON.stringify(items));

// ❌ Wrong — raw strings are fragile and hard to trace
localStorage.getItem("snipgeek-theme-manual-expire");
```

| Constant | Key String | Purpose |
|---|---|---|
| `STORAGE_KEYS.READING_LIST` | `readingList` | Saved reading list items (JSON array) |
| `STORAGE_KEYS.THEME_MANUAL_EXPIRE` | `snipgeek-theme-manual-expire` | Unix ms timestamp for manual theme expiry |
| `STORAGE_KEYS.THEME` | `theme` | Active next-themes value (`light`/`dark`/`system`) |
| `STORAGE_KEYS.LOCALE` | `NEXT_LOCALE` | User's chosen language cookie |

### 🔴 OpenGraph Images — MANDATORY on Blog & Notes Post Pages
Every `blog/[slug]/page.tsx` and `notes/[slug]/page.tsx` **MUST** include per-article `openGraph` and `twitter` metadata so the article's hero image is shown when shared on social media.

```typescript
// In generateMetadata():
const heroSource = resolveHeroImage(
  post.frontmatter.heroImage,
  post.frontmatter.imageAlt,
  post.frontmatter.title,
);
const ogImageUrl = heroSource
  ? heroSource.src.startsWith("http")
    ? heroSource.src
    : `https://snipgeek.com${heroSource.src}`
  : "https://snipgeek.com/images/footer/about.webp";

return {
  // …title, description, alternates…
  openGraph: {
    type: "article",
    url: `https://snipgeek.com${canonicalPath}`,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.frontmatter.title }],
    publishedTime: post.frontmatter.date,
    modifiedTime: post.frontmatter.updated ?? post.frontmatter.date,
  },
  twitter: {
    card: "summary_large_image",
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    images: [ogImageUrl],
  },
};
```

### 🟡 Sitemap — Keep Static Routes In Sync
`src/app/sitemap.ts` must be updated whenever a new public static page is added.

Current static routes in the sitemap:
`""`, `/blog`, `/notes`, `/tools`, `/about`, `/contact`, `/archive`, `/projects`, `/privacy`, `/terms`, `/disclaimer`

**Do NOT add** `/login` or `/download` — these are internal/non-indexable pages.

### 🟡 Dead Code — `post-page-client.tsx` Removed
The file `src/app/[locale]/blog/[slug]/post-page-client.tsx` was deleted (it was never imported by `page.tsx` and imported a server module inside a client component). **Do not recreate it.** The canonical post rendering lives entirely in `page.tsx` as a Server Component.

### 🟡 Security Headers
HTTP security headers are configured in `next.config.ts` and applied to all routes. Do NOT remove them.

Current headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

If a new page or API route has a legitimate reason to relax a header (e.g., embedding via iframe), add a targeted override in `next.config.ts` rather than removing the global rule.

### 🟡 Scroll Listeners — Always Use `{ passive: true }`
Any `window.addEventListener("scroll", handler)` call **must** include `{ passive: true }` to avoid blocking the main thread.

```typescript
// ✅ Correct
window.addEventListener("scroll", handler, { passive: true });

// ❌ Wrong — blocks scroll performance
window.addEventListener("scroll", handler);
```

---

## 5. Dictionary & Notification Rules

### 🔴 Required Keys — Both Dictionaries Must Always Be In Sync
The following top-level keys MUST exist in **both** `en.json` and `id.json`:
- `home.title` and `home.description` — used by `page.tsx` `generateMetadata` for SEO
- All section keys that are referenced in `generateMetadata` of any page (e.g., `notes.title`, `blog.title`, `tags.title`)


### 🔴 Dictionary Sync — Always Update Both Languages
When adding a new key to `notifications` or any section of the dictionary, you MUST update **both** files simultaneously:
- `src/dictionaries/en.json`
- `src/dictionaries/id.json`

Failing to sync both files will cause runtime `undefined` values in one of the languages.

### 🔴 Adding New Notification Keys
When a component needs a new notification string (e.g., `logoutSuccess`), the full chain must be updated:

1. Add the key to `src/dictionaries/en.json` under `notifications`
2. Add the translated key to `src/dictionaries/id.json` under `notifications`
3. The `Dictionary` type in `src/lib/get-dictionary.ts` is automatically inferred — no manual type update needed

### 🔔 Notification System — useNotification() API
SnipGeek uses a **custom Status Bar Notification** system. Always use `useNotification()`, never Shadcn's `useToast()` for short feedback messages.

**Correct usage:**
```typescript
const { notify } = useNotification();

// Message only
notify("Tersalin ke Clipboard");

// Message with icon
notify("Berhasil keluar.", <LogOut className="h-4 w-4" />);

// Using dictionary key (preferred)
notify(dictionary?.notifications?.logoutSuccess || "Berhasil keluar.", <LogOut className="h-4 w-4" />);
```

**Signature:** `notify(message: React.ReactNode, icon?: React.ReactNode) => void`

Use `useNotification()` for: theme changes, language switches, copy actions, reading list updates, logout success.
Use `useToast()` (Shadcn) ONLY inside admin panel components (`post-editor.tsx`, `note-editor.tsx`) where it is already established.

---

## 6. Library Version Notes

These notes exist to prevent introducing code that is incompatible with the installed versions.

### react-day-picker — v9 API
The project uses `react-day-picker@9.x`. The v8 API is **incompatible**.

| v8 (OLD — DO NOT USE) | v9 (CORRECT) |
|---|---|
| `IconLeft` component | `Chevron` component with `orientation` prop |
| `IconRight` component | `Chevron` component with `orientation` prop |

**Correct `Chevron` implementation:**
```typescript
components={{
  Chevron: ({ orientation }: { orientation?: string }) =>
    orientation === 'left' || orientation === 'up'
      ? <ChevronLeft className="h-4 w-4" />
      : <ChevronRight className="h-4 w-4" />,
}}
```

### next-mdx-remote — v6 (No RSC Types Export)
The project uses `next-mdx-remote@6.x`. This version does **NOT** export `MDXComponents` from `next-mdx-remote/rsc/types` — that path does not exist.

**DO NOT write:**
```typescript
import type { MDXComponents } from 'next-mdx-remote/rsc/types' // ❌ module not found
```

**Instead, let TypeScript infer the type:**
```typescript
// ✅ No import needed — TypeScript infers the type from the object shape
export const mdxComponents = {
  h1: MdxH1,
  h2: MdxH2,
  // ...
};
```

### Progress Component — Custom Pure CSS (No Radix)
`@radix-ui/react-progress` is **NOT installed**. The project uses a custom `Progress` component in `src/components/ui/progress.tsx`.

**Accepted props:**
```typescript
interface ProgressProps {
  value?: number;        // 0–100
  className?: string;    // outer container classes
  indicatorClassName?: string; // inner fill bar classes
}
```

Do NOT attempt to install `@radix-ui/react-progress` or use any external progress library.

---

## 7. Design & UI System

### 📐 Typography Scale — MANDATORY Token Usage
SnipGeek has a **fluid typography system** defined in `tailwind.config.ts`. Always use these semantic tokens instead of hardcoded responsive size classes.

**DO NOT use:**
```tsx
// ❌ Hardcoded responsive sizes
<h1 className="text-5xl md:text-6xl">...</h1>
<h1 className="text-4xl md:text-5xl lg:text-6xl">...</h1>
<h2 className="text-3xl">...</h2>
```

**ALWAYS use:**
```tsx
// ✅ Semantic fluid typography tokens
<h1 className="text-display-sm">...</h1>  // Page/section titles
<h1 className="text-h1">...</h1>          // Article/note titles (medium)
<h2 className="text-h2">...</h2>          // Section headings
<h3 className="text-h3">...</h3>          // Section subheadings
<h4 className="text-h4">...</h4>          // Minor headings
```

**Token Reference:**
| Token | Fluid Range | Use Case |
|---|---|---|
| `text-display-lg` | 48px → 96px | Hero displays only |
| `text-display-md` | 40px → 76px | Large hero sections |
| `text-display-sm` | 36px → 68px | Page H1 titles (blog list, notes list, tags, tools, contact) |
| `text-h1` | 30px → 52px | Article detail H1 (also used in MDX `# heading`) |
| `text-h2` | 24px → 36px | Section headings (related posts, home sections) |
| `text-h3` | 20px → 28px | Section subheadings, footer author name |
| `text-h4` | 18px → 24px | Minor headings |
| `text-h5` | 16px → 20px | Card titles, small headings |
| `text-h6` | 14px → 18px | Topic section cards, compact labels |
| `text-article-base` | 17px → 20px | Article body text |
| `text-ui-md` | 14px | UI labels, badges |
| `text-ui-sm` | 11px | Small UI labels |
| `text-ui-xs` | 10px | Micro labels, timestamps |

**MDX Content Headings** (`mdx-components.tsx`) already use these tokens:
- `##` → `text-h2`
- `###` → `text-h3`

### 📏 Spacing Tokens — Use Semantic Section Spacing
SnipGeek defines semantic spacing tokens in `tailwind.config.ts`. Use them for section-level padding.

**Token Reference:**
| Token | Value | Use Case |
|---|---|---|
| `section-sm` | 3rem (48px) | Compact section vertical padding |
| `section-md` | 5rem (80px) | Standard section vertical padding |
| `section-lg` | 7.5rem (120px) | Large section vertical padding |
| `section-xl` | 10rem (160px) | Hero / landing sections |
| `prose-gap` | 1.5rem | Spacing between prose elements |
| `prose-gap-lg` | 2.5rem | Larger prose element gaps |

**Pattern:**
```tsx
// ✅ Use semantic tokens for section padding
<section className="py-section-sm sm:py-section-md">
<section className="py-section-md sm:py-section-lg">

// ❌ Avoid hardcoded section spacing
<section className="py-12 sm:py-16">
<section className="py-16 sm:py-24">
```

**Standard page container pattern** (keep consistent across all pages):
```tsx
// Detail pages (blog/notes)
<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">

// Simple/list pages (contact, archive, projects)
<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">

// List pages with grid (blog list, notes list)
<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16">
```

### 🎨 Color Philosophy (Theme Protocol)
- **NEVER** use hardcoded Tailwind color classes like `text-blue-500` or `bg-red-200`
- Always use CSS HSL variables from `globals.css`: `text-primary`, `text-accent`, `text-muted-foreground`
- For opacity variants, use Tailwind opacity modifier: `text-primary/60`
- **Dark Mode Aware**: Always write code that looks good in both light and dark mode. Never allow dark text on a dark background

### ✍️ Typography Hierarchy
- `font-display` (Bricolage Grotesque) → **ONLY** for headings (h1, h2, h3) and card titles. Use via `font-headline` alias.
- `font-sans` (Plus Jakarta Sans) → for body text and paragraphs
- Section labels and badges → use `uppercase` with `tracking-widest` for a clean technical look
- **See Typography Scale section above** for the full fluid token reference (`text-display-sm`, `text-h1` – `text-h6`, etc.)

### 🖼️ Visual Signature & Assets
These are the design "fingerprints" and asset rules that must be preserved:

| Element | Rule |
|---|---|
| Image Paths | **MUST** start with `/images/` (e.g., `/images/blog/my-image.webp`). Never use relative paths like `../images/`. |
| Image Format | Use `.webp` whenever possible for performance. |
| Alt Text | Always provide descriptive alt text for accessibility and SEO. |
| Rounded Corners | Always `rounded-xl` or `rounded-2xl` — **NEVER** `rounded-sm` |
| Glassmorphism | Use `bg-card/50` + `backdrop-blur-sm` + `border-primary/5` for floating/overlay elements |
| Shadows | Always use soft shadows — avoid thick black borders |
| Staggered Grid | For featured galleries, apply "zig-zag" effect: even columns get `mt-10` on large screens |

### 🏷️ Badge & Icon System
- **Badge Sync**: NEVER create new badge colors from scratch — always reference `category-badge.tsx` so that "Windows" is always sky blue and "Tutorial" is always amber
- **Lucide-React Only**: Only use icons from `lucide-react` — do not hallucinate icon names (e.g., there is no "Tooth" icon). Always use icons with consistent stroke width

### 📱 Responsiveness (Mobile-First)
- **NEVER** create a 3 or 4 column grid without defining its mobile version
- Standard responsive pattern: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Minimum horizontal padding on mobile: `px-4`

### 🔔 Notification System
- SnipGeek has a custom **Status Bar Notification** system in the Header (toast bar from bottom)
- Always use `useNotification()` instead of Shadcn's built-in `useToast()`
- This applies for short success messages like "Link Copied" or "Theme Changed"
- Full API and usage guide is documented in **Section 5** above