---
name: snipgeek_rules
description: Mandatory rules for the SnipGeek project — MDX content standards, custom features, development rules, and UI/design system to prevent build errors, crashes, and visual inconsistencies.
---

# SnipGeek Project Rules

These are permanent instructions that MUST be followed at all times when working on the SnipGeek project. All rules are based on real experience and agreed-upon architectural decisions.

---

## 1. MDX Writing Standards (Content Standard)

Content in SnipGeek is not plain text — it is structured documentation.

### Required Frontmatter
Every `.mdx` file MUST have:
```yaml
translationKey: "english-kebab-case-slug"  # REQUIRED: Must be in English kebab-case for both ID and EN
heroImage: "img-id-from-json"          # PREFERRED: Use ID from placeholder-images.json
# heroImage: "/images/blog/custom.webp" # EXCEPTION: Standard path (must start with /images/ and exist in public/images/)
published: true                        # REQUIRED: Must be true to appear in listings (avoids draft folder)
```

### Content Creation Workflow
1. **Check Images**: Scan `src/lib/placeholder-images.json` for a suitable `id`.
2. **Add Entry**: If no suitable image exists, create a new entry in `placeholder-images.json` first.
3. **Use Standard Paths**: For both `heroImage` and article images (`![alt](/images/...)`), always use the standard `/images/` path relative to `public/`.
4. **Create MDX**: Link the `heroImage` using the ID and ensure `translationKey` is descriptive English kebab-case.

### Custom Components — NEVER use raw HTML for:

| Element | Required Component |
|---|---|
| Download Button | `<DownloadButton id="slug-from-data-downloads" />` |
| Image Gallery | `<ImageGrid columns={2}> ... </ImageGrid>` |
| Zoomable Image | No external library needed — all MDX images already support Lightbox automatically |

### Heading Structure
- Only use `##` and `###`
- The system automatically uses these headings to generate the **Table of Contents (TOC)** on the side of each article

---

## 2. Custom Features & Logic

AI must recognize these built-in features of SnipGeek:

### Reading List
- Data is stored in `localStorage`
- **DO NOT** attempt to move this to Firestore unless explicitly requested
- Reason: keeps performance fast without unnecessary database roundtrips

### i18n (Internationalization)
- Uses `/[locale]/` folder structure
- Whenever content or components are changed in one language, **ALWAYS check** if the changes need to be applied to the other language as well

### Category Badge
- Badge color system is strictly defined in `category-badge.tsx`
- **DO NOT** arbitrarily change Tailwind colors in UI components
- All color changes MUST go through `categoryColorMap`

### Disqus (Comments)
- Only active on the production domain (`snipgeek.com`)
- It is normal for the comment section to not appear in development mode (IDE) — this is not a bug

---

## 3. Communication & UI Modification Protocol

To ensure 100% accuracy when modifying the UI, follow this protocol:

### 🎯 Identifying Elements
- **Text Description + Filename**: This is the mandatory method. Look for elements based on the content text and the specific component file (e.g., "In `blog-list-client.tsx`, change 'Read More' to 'Selengkapnya'").
- **No Extra IDs**: Do not add `id` or `data-testid` just for AI reference. Use the existing component structure and context.
- **Component Isolation**: Lean on the clean isolation of components like `Header`, `Footer`, and `HomeClient` to locate code.

---

## 4. Development Rules in Antigravity IDE

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

---

## 4. Design & UI System

### 🎨 Color Philosophy (Theme Protocol)
- **NEVER** use hardcoded Tailwind color classes like `text-blue-500` or `bg-red-200`
- Always use CSS HSL variables from `globals.css`: `text-primary`, `text-accent`, `text-muted-foreground`
- For opacity variants, use Tailwind opacity modifier: `text-primary/60`
- **Dark Mode Aware**: Always write code that looks good in both light and dark mode. Never allow dark text on a dark background

### ✍️ Typography Hierarchy
- `font-display` (Bricolage Grotesque) → **ONLY** for headings (h1, h2, h3) and card titles
- `font-sans` (Plus Jakarta Sans) → for body text and paragraphs
- Section labels and badges → use `uppercase` with `tracking-widest` for a clean technical look

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
