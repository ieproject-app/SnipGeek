---
name: content-generator
description: Mandatory standards for SnipGeek content generation (Blog & Notes). Includes MDX components, SEO frontmatter, tag standardization, and file placement rules.
---

# SnipGeek Content Generator Skill

Use this skill when generating or modifying blog posts (`_posts/`) and technical notes (`_notes/`). This skill centralizes the SnipGeek "Golden Standard" for MDX and SEO.

## 1. Content Types & File Placement

> [!WARNING]
> **CRITICAL:** Content folders (`_posts`, `_notes`, `_pages`) MUST be located at the **absolute root** of the project. **NEVER** place them inside `src/content/`.

- **Blog Posts**: `_posts/{locale}/{YYYY-H1 or YYYY-H2}/slug.mdx`
- **Notes**: `_notes/{locale}/{YYYY-H1 or YYYY-H2}/slug.mdx`
- **Static Pages**: `_pages/{slug}/{locale}.mdx`

### Semester Sub-Folder Convention (MANDATORY)

All `_posts` and `_notes` files MUST be placed inside a semester sub-folder:

- **H1** = months January–June → folder `YYYY-H1`
- **H2** = months July–December → folder `YYYY-H2`
- Determined by the **`date:`** frontmatter field, NOT `updated:`

```
_posts/en/2026-H1/firebase-studio-sunset.mdx   ← date: 2026-03-18 ✅
_notes/id/2026-H1/fix-git-push-error.mdx       ← date: 2026-01-10 ✅
_posts/en/2026-H1/new-article.mdx              ← date: 2026-09-01 ❌ Wrong folder!
```

---

## 2. Content Character: Blog Posts vs Technical Notes

These two content types have **fundamentally different characters**. Never mix their conventions.

### Blog Posts (`_posts/`)

- **Opener**: MUST start with personal context — why the author tried this, what problem they solved. Pull the reader in before any technical detail.
- **Voice**: First person ("I" / "saya"), conversational and personal.
- **Bilingual**: ALWAYS produce both English and Indonesian versions.
- **Length**: Long-form, narrative. Sections follow a rhythm: context → info → personal insight.
- **heroImage**: REQUIRED for all blog posts.
- **Components**: May use Gallery, ImageGrid, DownloadButton, Steps, Callout.

### Technical Notes (`_notes/`)

- **Opener**: Skip personal preamble — go directly to the technical point. First sentence should state the problem or finding.
- **Voice**: Still first person but terse and factual.
- **Bilingual**: NOT required. Notes can be monolingual (EN only or ID only).
- **Length**: Short, dense, scannable. Avoid stretching into blog narrative.
- **heroImage**: NOT used. Do not add heroImage or imageAlt to notes.
- **Components**: Prefer Steps, Callout, tables. Gallery and ImageGrid are rarely appropriate.
- **Intent types**: `finding` (discovered behavior), `reference` (reusable guide), `mini-fix` (quick fix record), `observation` (noticed pattern).

---

## 3. Frontmatter Standards

### Blog Post Frontmatter (required)

```yaml
title: "SEO-Optimized Title Here"          # 55–65 characters target
slug: "english-kebab-case-slug"            # unique, English, kebab-case
translationKey: "english-kebab-case-slug"  # same as slug, shared between EN/ID
date: "YYYY-MM-DD"
updated: "YYYY-MM-DD"                      # only when modifying an existing post
description: "Meta description here."     # 140–160 characters target
category: "OneWord"                        # one word if possible
tags: ["platform", "versioned-tag", "topic"]  # see Tag Rules below
published: true
featured: false
heroImage: "/images/_posts/{category}/{slug}/hero.webp"
imageAlt: "Descriptive SEO alt text for hero image"
```

### Technical Note Frontmatter (required)

```yaml
title: "Concise Technical Title"           # 55–65 characters target
slug: "english-kebab-case-slug"
translationKey: "english-kebab-case-slug"
date: "YYYY-MM-DD"
updated: "YYYY-MM-DD"                      # only when modifying
description: "Short factual description."
category: "OneWord"
tags: ["platform", "topic"]               # see Tag Rules below
published: true
```

> **Notes do NOT include:** `heroImage`, `imageAlt`, `featured`.

---

## 4. Tag Rules

Tags must follow these rules strictly:

- **Format**: Lowercase kebab-case. Spaces are NEVER allowed. A tag like `ubuntu 26` is invalid and will produce broken URLs (`%20`).
- **Minimum**: 3 tags. **Maximum**: 6 tags.
- **1 Platform Tag (required)**: Always include one of: `windows`, `ubuntu`, `linux`, `android`, `hardware`, `macos`, `web`.
- **1 Versioned Tag (required if OS-specific)**: Include a specific version tag when the article targets a particular OS version. Examples: `ubuntu-26-04`, `windows-11`, `ubuntu-25-10`.
- **Multi-word tags are valid** in kebab-case: `ubuntu-26-04`, `version-control`, `code-editor`, `clean-install` are all valid.

```yaml
# ✅ Correct
tags: ["linux", "ubuntu-26-04", "keyd", "keyboard", "wayland"]

# ❌ Wrong — spaces will break URLs
tags: ["ubuntu 26 04", "code editor"]

# ❌ Wrong — too few tags
tags: ["linux"]
```

---

## 5. MDX Components Standards

Always use these components where applicable to enhance readability.

### Callouts (Alerts)

```mdx
<Callout variant="info" title="Pro Tip">
  Your content here.
</Callout>
```

Variants: `info`, `tip`, `warning`, `danger`.

### Numbered Steps (Tutorials)

For ANY procedural or tutorial section, use `<Steps>` and `<Step>` instead of plain numbered markdown lists.

```mdx
<Steps>
  <Step>

  ### First Step
  Explain the first action.

  </Step>
  <Step>

  ### Second Step
  Explain the second action.

  </Step>
</Steps>
```

### Expandable (Accordions)

**NEVER** use standard `<details>`/`<summary>`. ALWAYS use the custom `<Expandable>` component for interactive collapse blocks.

```mdx
<Expandable title="Question or Topic Title" icon="help">
  Your hidden content here.
</Expandable>
```

Icons available: `info`, `help`, `folder`, `warning`, `tip`.

### Keyboard Shortcuts

Use `<kbd>Key</kbd>` for hotkeys: `<kbd>Ctrl</kbd> + <kbd>C</kbd>`.

---

## 6. Media & Assets

- **Location**: Store images in `public/images/_posts/{category}/{slug}/`.
- **Format**: Prefer WebP with optimized file size.
- **Galleries**: Use `<Gallery caption="Optional caption or source">\n  ![Img 1](path1)\n  ![Img 2](path2)\n  ![Img 3](path3)\n</Gallery>` for a full-width 3-image hero-style gallery.
- **Grids**: Use `<ImageGrid columns={2}>\n  ![Img 1](path1)\n  ![Img 2](path2)\n</ImageGrid>` for inline image grouping.  
  **CRITICAL:** `ImageGrid` is STRICTLY INCOMPATIBLE with `<Steps>`. Inside `<Steps>`, ONLY use single standard images, never grids.

### Image Caption Rules

**Canonical caption syntax** — use italic markdown placed directly below the image:

```mdx
![Descriptive alt text](/images/path/to/image.webp)
*Short caption or credit here.*
```

Do NOT use raw `<div>` elements for captions unless the prompt builder explicitly generates them with a className policy.

**Caption decision rules:**

1. Classify each image: `external`, `screenshot`, or `decorative`.
2. `external` → caption/credit is **REQUIRED**. Example: `*Source: OMG Ubuntu*`
3. `screenshot` → caption is **OPTIONAL**. Use only if it adds clarity. Example: `*Screenshot: SnipGeek test on Ubuntu 26.04*`
4. `decorative` → **no caption**.
5. **Never caption every image** — selective captioning keeps articles clean.
6. **Never repeat alt text** in a caption.

### React className

ALWAYS use `className` instead of `class` for all elements. React will throw an error if `class` is used.

---

## 7. References Section

For news articles and factual posts that cite external sources, add a `### References` section at the end with numbered links:

```mdx
### References
1. [GNOME 50 Release Notes](https://release.gnome.org/50/)
2. [Some Article Title](https://example.com/article)
```

**When to include References:**
- News/update articles citing official changelogs or external coverage.
- Factual claims that need source attribution.
- NOT required for: personal experience posts, opinion pieces, tutorial walkthroughs based on own experience.

---

## 8. Automation Logic for AI

When given a "Content Brief", you MUST automatically:

1. Determine content type (**Blog Post** or **Technical Note**) and apply the correct frontmatter template.
2. Determine semester folder from the `date:` field (H1 = Jan–Jun, H2 = Jul–Dec).
3. Generate the **English Slug** and **Translation Key** (always English kebab-case).
4. Optimize the **Title** for SEO (~55–65 characters).
5. Generate descriptive **Alt Text** for all images (Blog only).
6. Apply **Tag Rules**: kebab-case only, min 3 max 6, include platform tag + versioned tag if applicable.
7. For Blog Posts: produce **both** English and Indonesian versions.
8. For Technical Notes: monolingual output is acceptable.
9. For Tutorial sections: use `<Steps>/<Step>` — never plain numbered markdown lists.
