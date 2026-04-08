# AI Contributor Guide

This document defines the expected workflows, boundaries, and conventions for AI-assisted contributions in the SnipGeek project.

Its main goal is to keep content, routes, and project structure consistent over time.

---

## 1. Core Principles

When contributing to SnipGeek, always follow these principles:

1. **Do not invent new structure unless necessary**
   - Prefer existing folders, patterns, and conventions.
   - If a similar file already exists, follow that pattern.

2. **Keep content separate from runtime code**
   - Public site content belongs in content folders.
   - App logic, rendering, and route behavior belong in app/source folders.

3. **Favor consistency over creativity**
   - Especially for legal pages, informational pages, and content structure.
   - Reuse templates and established layouts instead of creating one-off page structures.

4. **Do not use source folders as storage for experiments or temporary output**
   - No logs, exports, scratch files, or generated artifacts should be placed in runtime source directories.

---

## 2. Project Structure Rules

## Runtime App Code
Use these folders for application behavior and rendering:

- `src/app/`
- `src/components/`
- `src/hooks/`
- `src/lib/`
- `src/firebase/`
- `src/github/` should not be recreated for temporary files or experiments

## Public Content Source
Use these folders for website content:

- `_posts/`
- `_notes/`
- `_pages/`

These are content sources for the website, **not** internal documentation.

## Internal Documentation
Use this folder for developer-facing or project-facing documentation:

- `docs/`

Examples:
- architecture notes
- contributor guidance
- AI rules
- workflow references

## Tooling / Workspace Metadata
These are not runtime app code:

- `.idx/`
- `.agent/`

Do not move application logic into them.

---

## 3. Where Different Kinds of Work Belong

## Blog Posts
Place blog content in:

- `_posts/en/`
- `_posts/id/`

Each published article should live as an MDX file in the correct locale folder.

## Notes
Place note content in:

- `_notes/en/`
- `_notes/id/`

## Static / Informational Pages
Place static page content in:

- `_pages/<slug>/en.mdx`
- `_pages/<slug>/id.mdx`

Examples:
- `_pages/about/en.mdx`
- `_pages/privacy/id.mdx`
- `_pages/terms/en.mdx`
- `_pages/disclaimer/en.mdx`
- `_pages/contact/id.mdx`

## Route Shells
Keep route files in:

- `src/app/[locale]/.../page.tsx`

Route files should mainly handle:
- routing
- metadata
- layout shell
- content loading
- rendering

They should **not** become the primary storage place for long-form static page text.

---

## 4. Static Page Workflow

This project uses a **content source + route shell** model for static pages.

## Rule
If a page is mostly text and informational, its content should live in `_pages`.

Examples:
- `privacy`
- `terms`
- `disclaimer`
- `contact`
- `about` (hybrid pattern)

## Expected Pattern
For a page like `privacy`:

- content source:
  - `_pages/privacy/en.mdx`
  - `_pages/privacy/id.mdx`

- route shell:
  - `src/app/[locale]/privacy/page.tsx`

## Route Shell Responsibilities
A static page route shell may:
- load MDX content
- load frontmatter
- build metadata
- apply a shared layout/template
- render the page consistently

A static page route shell should **not**:
- hardcode the full legal/informational body if that body belongs in `_pages`
- duplicate text that should be managed as content
- create a unique page architecture without a strong reason

---

## 5. Hybrid Pages

Some pages are allowed to combine structured app UI with MDX content.

## Example: `about`
The `about` page may contain:
- a custom hero
- profile sections
- cards/timeline/skills layout
- MDX content block sourced from `_pages/about/*`

This is valid because the page mixes:
- reusable structured UI
- editable long-form content

## Rule for Hybrid Pages
If a page has a special UI shell **and** editorial content:
- keep the layout in `src/app/[locale]/.../page.tsx`
- keep the long-form content in `_pages/<slug>/`

Do not collapse everything into a giant TSX file if the text content is clearly editorial.

---

## 6. Legal Page Standard

Legal pages should use a **shared, standardized template** unless explicitly instructed otherwise.

Pages in this category include:
- `privacy`
- `terms`
- `disclaimer`

## Requirements
- content lives in `_pages/<slug>/<locale>.mdx`
- metadata should be derived from frontmatter when possible
- route files should use the standard static page rendering flow
- visual structure should be consistent across legal pages

## Why
This keeps:
- maintenance easier
- AI contributions more predictable
- page structure cleaner
- design more consistent

---

## 7. Contact Page Standard

The contact page should also follow the static-page content model.

## Requirements
- content lives in `_pages/contact/en.mdx` and `_pages/contact/id.mdx`
- route shell renders that content with the shared static page template
- long-form explanatory text should not be maintained only in TSX

## Goal
Make `contact` manageable like other informational pages.

---

## 8. MDX Frontmatter Conventions for Static Pages

Static page MDX files should use frontmatter when relevant.

Recommended fields:

- `title`
- `seoTitle`
- `description`
- `lastUpdated`
- `badgeLabel`
- `icon`

### Example
```/dev/null/example.mdx#L1-8
---
title: Privacy Policy
seoTitle: Privacy Policy
description: SnipGeek privacy policy and data handling overview.
lastUpdated: 2025-07-01
badgeLabel: Official Document
icon: Shield
---
```

## Rules
- `title` should match the page title shown to users
- `seoTitle` can be omitted if identical to `title`
- `description` should be concise and metadata-friendly
- `lastUpdated` should use a stable date format like `YYYY-MM-DD`
- `badgeLabel` should remain short
- `icon` should use an icon name already supported by the page template

Do not add arbitrary frontmatter fields unless there is a clear use for them.

---

## 9. Blog and Note Content Rules

For posts and notes, follow project MDX standards.

## Required baseline
Every content file should be structurally valid and match the collection it belongs to.

---

## 10. Lighthouse-First Workflow

All AI contributors should treat Lighthouse as a release quality gate.

## Default Targets (Mobile)

- Performance: target green whenever feasible, but prioritize directional improvement and stability.
- Accessibility: keep green (90+), do not regress.
- Best Practices: keep 100 whenever possible.
- SEO: keep 100 whenever possible.

## Required Process For Performance Work

1. Start from the latest Lighthouse JSON report in the repository root.
2. Identify the largest bottleneck first using:
   - category score
   - key metrics (LCP, TBT, Interactive)
   - opportunity savings (ms and bytes)
3. Implement only high-impact, low-risk changes first.
4. Rebuild and re-run Lighthouse before additional refactors.
5. Report deltas clearly: what improved, what stayed flat, and why.

## Prioritization Order

1. Main-thread and JS execution reductions.
2. LCP improvements (especially hero content and above-the-fold rendering).
3. Network payload reductions.
4. Secondary polish (minor audits with tiny savings).

## Do Not

- Chase a perfect score with fragile hacks.
- Regress accessibility to gain performance.
- Apply broad rewrites before validating current bottlenecks from JSON evidence.

## Reporting Standard

When asked to review a Lighthouse JSON file, include:

1. Current category scores.
2. Top 1-3 blockers with concrete numeric impact.
3. Whether the site is near practical ceiling for its architecture.
4. A short next-step plan with highest expected ROI.

### Posts
Place in:
- `_posts/en/`
- `_posts/id/`

### Notes
Place in:
- `_notes/en/`
- `_notes/id/`

## Translation Pairing
When a piece of content exists in both English and Indonesian:
- keep the same `translationKey`
- keep semantic parity between both versions
- allow natural translation, not forced literal translation

## Slug Guidance
- use English kebab-case for `translationKey`
- keep filenames/slugs stable unless there is a strong reason to rename them
- do not rename published content casually

---

## Tag Standards

Tags form public URLs at `/tags/<tag>`. Strict formatting is required.

### Format
- **Always kebab-case**: `windows-11`, `clean-install`, `ui-design`
- **Always lowercase**: never `Windows`, `Tutorial`, `Dark Mode`
- **No spaces**: spaces become `%20` in URLs — always use `-` as separator
- **EN/ID parity**: both locale files for the same article must have identical tags (English kebab-case only — no Indonesian-language tags)

### Two-Tier System
Every article must include:
1. **Tier 1 — Platform tag** (mandatory): `windows`, `ubuntu`, `linux`, `android`, `hardware`
2. **Tier 2 — Versioned tag** (when article targets a specific OS version): `windows-11`, `ubuntu-25-10`
3. **Topic tag** (mandatory): `tutorial`, `driver`, `gaming`, `opinion`, `error-fix`, etc.
4. **Specific tags** (optional, 1–2): `clean-install`, `powertoys`, `emulator`, `ui-design`, etc.

**Example:**
```yaml
tags: ["windows", "windows-11", "tutorial", "clean-install"]
```

### Count Rules
- **Minimum: 3 tags**
- **Maximum: 6 tags**
- Target 4–5 tags. More than 6 dilutes SEO and tag page value.

### Versioned OS Tags (update yearly)
| OS | Current tag |
|---|---|
| Windows | `windows-11` |
| Ubuntu | `ubuntu-25-10` |

When a new OS version releases, update this table and the More menu in `layout-header.tsx` (`moreItems` array).

### Never
- Do not use multi-word tags without hyphens: ~~`"Dark Mode"`, `"Windows 11"`~~
- Do not use locale-specific terms: ~~`"Kustomisasi"`, `"Sistem Operasi"`~~
- Do not use overly generic single tags alone (always pair with platform): ~~`["tutorial"]`~~

---

## 10. i18n Rules

SnipGeek uses locale routing with:
- `en` as default locale
- `id` as Indonesian locale

## URL behavior
- English pages usually use no locale prefix
- Indonesian pages use `/id`

## AI expectations
Whenever content or metadata is added or changed:
- check whether both locales should be updated
- do not update one language and forget the other without a reason

If only one locale is intentionally updated, that should be explicit and justified.

---

## 11. What Must Not Go Into `src/`

Do **not** place these in `src/`:

- downloaded logs
- JSON exports
- scratch notes
- ad hoc reference files
- temporary generated artifacts
- old experiment leftovers

`src/` is for runtime application code only.

If something is:
- documentation -> `docs/`
- website content -> `_posts`, `_notes`, `_pages`
- temporary/local experiment -> keep it outside runtime source and preferably out of versioned project structure unless truly needed

---

## 12. Root Folder Discipline

Do not add new top-level folders casually.

Before creating a new root folder, ask:
1. Does an existing folder already fit this purpose?
2. Is this runtime code, content, documentation, or tooling?
3. Will this still make sense to future contributors?

## Allowed mental model
- app code -> `src/`
- public assets -> `public/`
- scripts -> `scripts/`
- docs -> `docs/`
- website content -> `_posts/`, `_notes/`, `_pages/`
- tooling metadata -> existing hidden folders only when required

---

## 13. `docs/` Folder Rule

The `docs/` folder is for **internal documentation**, not public website content.

Good uses of `docs/`:
- contributor guides
- architecture decisions
- workflow notes
- backend references
- AI rules

Bad uses of `docs/`:
- blog articles
- published notes
- public legal pages that should be rendered as site content
- random unlabeled JSON leftovers with unclear ownership

If a document is meant to appear on the website, it belongs in a content folder, not `docs/`.

---

## 14. AI Workflow for New Static Pages

When asked to add a new text-heavy static page, use this workflow:

1. Create content source:
   - `_pages/<slug>/en.mdx`
   - `_pages/<slug>/id.mdx`

2. Add or update route shell:
   - `src/app/[locale]/<slug>/page.tsx`

3. Use shared static page template if applicable

4. Use frontmatter-driven metadata where possible

---

## 15. UI Badge and Multicolor Conventions

For badge sizing, placement rhythm, and multicolor card accents, use this companion guide:

- `docs/ui-badge-multicolor-guidelines.md`

When updating card UIs, do not create one-off badge or color systems.
Always reuse:

- `src/components/layout/category-badge.tsx`
- `src/lib/multicolor.ts`

5. Keep layout consistent with existing static page patterns

Do not start by writing the entire page body only inside TSX unless explicitly instructed.

---

## 15. AI Workflow for Editing Existing Static Pages

When editing `privacy`, `terms`, `disclaimer`, `contact`, or similar pages:

1. Check whether the content lives in `_pages`
2. Prefer editing the MDX content file first
3. Only edit the route shell if:
   - metadata behavior must change
   - layout behavior must change
   - template behavior must change
   - content loading behavior must change

This prevents content and layout from being mixed unnecessarily.

---

## 16. AI Workflow for About Page Changes

For the `about` page:

- edit `_pages/about/*.mdx` for editorial body content
- edit route shell/components only for layout or structured UI changes
- preserve the hybrid nature unless explicitly told to redesign it fully

Do not flatten the page into a single giant file when the content/UI separation is already useful.

---

## 17. Design Consistency Guidance

When working on informational pages:
- keep typography readable
- avoid unnecessary decorative variation between legal pages
- prefer shared templates
- keep spacing and hierarchy consistent
- use consistent heading levels in MDX

For legal/static pages:
- consistency matters more than novelty

For `about`:
- some visual richness is acceptable because it is a profile/brand page

---

## 18. When to Update Documentation

Update contributor docs when you introduce any structural convention such as:
- a new shared page template
- a new content folder rule
- a new frontmatter convention
- a new AI workflow requirement

The goal is to avoid repeating implicit rules only in chat history.

---

## 19. Safe Defaults for AI

If unsure where something belongs, follow these defaults:

- Long-form public content -> `_posts`, `_notes`, `_pages`
- Static legal/informational content -> `_pages`
- Rendering/layout logic -> `src/app` and `src/components`
- General reusable helpers -> `src/lib`
- Internal project documentation -> `docs`
- Temporary artifacts -> do not place in runtime source

---

## 20. Summary

If you remember only a few rules, remember these:

1. **Public content lives in `_posts`, `_notes`, `_pages`**
2. **Text-heavy static pages should source content from `_pages`**
3. **Route files are shells, not long-form content storage**
4. **`docs/` is for internal documentation, not site content**
5. **Do not put temp files, logs, or exports in `src/`**
6. **Prefer shared templates and established structure over one-off solutions**