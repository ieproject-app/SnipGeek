---
name: content-generator
description: Mandatory standards for SnipGeek content generation (Blog & Notes). Includes MDX components, SEO frontmatter, and tag standardization.
---

# SnipGeek Content Generator Skill

Use this skill when generating or modifying blog posts (`_posts/`) and technical notes (`_notes/`). This skill centralizes the SnipGeek "Golden Standard" for MDX and SEO.

## 1. Content Types & Targets

> [!WARNING]
> **CRITICAL:** Content folders (`_posts`, `_notes`, `_pages`) MUST be located at the **absolute root** of the project. **NEVER** place them inside `src/content/`.

- **Blog Posts**: Located in `_posts/{locale}/` at the project root.
- **Notes**: Located in `_notes/{locale}/` at the project root.
- **Static Pages**: Located in `_pages/{slug}/` at the project root.

## 2. Frontmatter Standards

Every article MUST have a valid YAML frontmatter.

### Required Fields:
- `title`: SEO-optimized (50-60 characters).
- `slug`: Unique kebab-case **English** string (required for both languages).
- `translationKey`: Shared unique kebab-case ID between translations.
- `date`: `YYYY-MM-DD`.
- `updated`: `YYYY-MM-DD` (only for modifications).
- `category`: Strictly one word if possible.
- `tags`: Array of short, **one-word** tags.
- `published`: `true` or `false`.
- `featured`: `true` or `false` (Blog only).
- `heroImage`: Full path (e.g., `/images/_posts/apps/slug/hero.webp`).
- `imageAlt`: Descriptive SEO alt text.

## 3. MDX Components Standards

Always use these components where applicable to enhance readability.

### Callouts (Alerts)
```mdx
<Callout variant="info" title="Pro Tip">
  Your content here.
</Callout>
```
Variants: `info`, `tip`, `warning`, `danger`.

### Numbered Steps (Tutorials)
```mdx
<Steps>
  <Step>
    ### First Step
    Explain the first action.
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

## 4. Media & Assets

- **Location**: Store images in `public/images/_posts/{category}/{slug}/`.
- **Format**: Prefer WebP with optimized file size.
- **Galleries**: Use `<Gallery caption="Optional caption or source">\n  ![Img 1](path1)\n  ![Img 2](path2)\n  ![Img 3](path3)\n</Gallery>` for a full-width 3-image hero-style gallery.
- **Grids**: Use `<ImageGrid columns="2">\n  ![Img 1](path1)\n  ![Img 2](path2)\n</ImageGrid>` for inline image grouping. **CRITICAL:** `ImageGrid` is STRICTLY INCOMPATIBLE with `<Steps>`. Inside `<Steps>`, you MUST only use single standard images, never grids.
- **Selective Captions**: Do not add captions to all images. Add captions only for attribution or meaningful context.
- **External Credits (Required)**: If image source is external, add credit in caption text (for example: `Source: OMG Ubuntu`).
- **Own Screenshots (Optional Caption)**: Use concise context caption only if it improves comprehension (for example: `Screenshot: SnipGeek test on Ubuntu 26.04`).
- **No Redundant Captions**: Avoid captions that only repeat the alt text.

### Image Attribution Decision Rule
1. Identify image origin before writing: `external`, `screenshot`, or `decorative`.
2. `external`: MUST include credit.
3. `screenshot`: caption optional.
4. `decorative`: no caption.

### 🔴 React Context (className)
ALWAYS use `className` instead of `class` for all elements. React will throw an error if `class` is used.

## 5. Automation Logic for AI

When given a "Content Brief", you MUST automatically:
1. Generate the **English Slug** and **Translation Key**.
2. Optimize the **Title** for SEO.
3. Generate descriptive **Alt Text** for all images.
4. Normalize **Tags** to be one-word only.
5. Translate content while maintaining technical accuracy.
