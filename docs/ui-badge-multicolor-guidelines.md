# UI Badge and Multicolor Guidelines

Status: Active
Date: 2026-03-19
Scope: Category badge sizing, spacing rhythm, and multicolor usage across cards

## 1) Goal

Keep badge visuals and card accents consistent across home, blog, notes, tags, and related sections.

Use one predictable system for:
- badge size (`xs` vs `sm`)
- badge placement rhythm (badge -> title -> time)
- multicolor accents (hover ring, overlay, accent bar)

## 2) Sources of Truth

- Badge component and palette: `src/components/layout/category-badge.tsx`
- Shared multicolor resolver: `src/lib/multicolor.ts`

Do not duplicate palette arrays or hash logic inside feature components.

## 3) Badge Size Rules

### Use `xs` (default) for compact card contexts

Use `size="xs"` for:
- card category labels in lists and grids
- tag pills in compact metadata areas
- related-content and tag-list chips
- overlay tag pills on hero/media cards

### Use `sm` only for emphasis contexts

Use `size="sm"` only when the badge is a primary visual chip in a roomy section header or hero callout.

If unsure, choose `xs`.

## 4) Badge Style Rules

- Prefer `CategoryBadge` directly instead of custom tag-pill markup.
- Keep dot indicator enabled by default.
- Disable dot only for tight overlays where readability is reduced.
- Keep hover subtle: small lift and soft shadow.

## 5) Card Rhythm Rules

For card text stack, follow this baseline order and spacing:
1. Badge container: `mb-2`
2. Title: `mb-2`
3. Time/meta line: no extra top margin

This keeps visual rhythm consistent between:
- home cards
- blog list cards
- tag list cards
- related cards

## 6) Multicolor Rules

Use `getMulticolorSeed(...)` + `getMulticolorTheme(...)` from `src/lib/multicolor.ts`.

Seed should be deterministic and content-based, usually:
- slug
- category or translationKey
- title

Apply theme tokens by intent:
- `gradient`: media/thumbnail background
- `overlayGradient`: media hover overlay
- `accentBar`: thin bottom accent on hover
- `hoverRing` + `hoverShadow`: card hover depth
- `hoverTitle`: title hover tone
- `readingButtonTone`: contextual action tone

## 7) Accessibility and Safety

- Keep text contrast readable on image overlays.
- Encode tag URLs with `encodeURIComponent`.
- Do not reduce badge text below current `xs` typography.

## 8) Quick Checklist

Before merging UI changes with badges:
- no local badge palette duplicates
- correct `xs` or `sm` choice
- badge/title/time rhythm follows baseline
- multicolor theme from shared resolver only
- hover remains subtle and readable
