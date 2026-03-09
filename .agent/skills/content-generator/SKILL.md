---
name: content-generator
description: Mandatory standards for SnipGeek content generation (Blog & Notes). Includes MDX components, SEO frontmatter, and tag standardization.
---

# SnipGeek Content Generator Skill

Use this skill when generating or modifying blog posts (`_posts/`) and technical notes (`_notes/`). This skill centralizes the SnipGeek "Golden Standard" for MDX and SEO.

## 1. Content Types & Targets

- **Blog Posts**: Located in `src/content/_posts/{locale}/`. Focus on tutorials and tech news.
- **Notes**: Located in `src/content/_notes/{locale}/`. Focus on snippet-like documentation or quick guides.

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
- `heroImage`: Path to image (usually `.webp`).
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
  <Step>
    ### Second Step
    Explain the second action.
  </Step>
</Steps>
```

### Keyboard Shortcuts
Use `<kbd>Key</kbd>` for hotkeys: `<kbd>Ctrl</kbd> + <kbd>C</kbd>`.

## 4. Media & Assets

- **Location**: Store images in `public/images/_posts/{category}/{slug}/`.
- **Format**: Prefer WebP with optimized file size.
- **Galleries**: Use `<Gallery caption="Optional caption or source">\n  ![Img 1](path1)\n  ![Img 2](path2)\n  ![Img 3](path3)\n</Gallery>` for a full-width 3-image hero-style gallery.
- **Grids**: Use `<ImageGrid columns="2">\n  ![Img 1](path1)\n  ![Img 2](path2)\n</ImageGrid>` for inline image grouping. **CRITICAL:** `ImageGrid` is STRICTLY INCOMPATIBLE with `<Steps>`. Inside `<Steps>`, you MUST only use single standard images, never grids.

## 5. Automation Logic for AI

When given a "Content Brief", you MUST automatically:
1. Generate the **English Slug** and **Translation Key**.
2. Optimize the **Title** for SEO.
3. Generate descriptive **Alt Text** for all images.
4. Normalize **Tags** to be one-word only.
5. Translate content while maintaining technical accuracy.
