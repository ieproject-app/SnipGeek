# Skill: content-generator

> Technical standards for generating SnipGeek blog posts (MDX format, frontmatter, routing, bilingual conventions). Must be read before creating or editing any blog post.

---

## 1. File Locations

| Type | EN path | ID path |
|------|---------|---------|
| Blog posts | `_posts/en/[year-half]/[filename].mdx` | `_posts/id/[year-half]/[filename].mdx` |
| Notes | `_notes/en/[year-half]/[filename].mdx` | `_notes/id/[year-half]/[filename].mdx` |

Current active half: `2026-H1`

---

## 2. Slug Rule — CRITICAL

**Slug = filename minus `.mdx`.** The `slug` frontmatter field is NOT read by the router (`posts.ts` derives slug from `entry.name.replace(/\.mdx$/, "")`).

- The **filename** determines the URL, not the frontmatter `slug` field.
- EN and ID files **must have identical filenames**.
- Example: `ubuntu-26-04-minimum-ram-requirement.mdx` (EN) and `ubuntu-26-04-minimum-ram-requirement.mdx` (ID) → same URL slug, different locale prefix.
- Slug must be lowercase kebab-case only. No spaces, no uppercase, no special characters.

---

## 3. Frontmatter — Full Spec

```yaml
---
title: "Article Title Here"
slug: "same-as-filename-without-mdx"          # mirrors filename — documentation only
translationKey: "same-as-filename-without-mdx" # must be identical in EN and ID
date: "YYYY-MM-DD"
updated: "YYYY-MM-DD"                          # optional — only if article was revised
description: "140–160 char SEO meta description."
heroImage: "/images/_posts/[category]/[folder]/[filename].webp"
imageAlt: "Descriptive alt text for the hero image."
published: true                                # false = draft, not served in production
featured: false                                # true = shown in featured section
tags: ["tag-one", "tag-two", "tag-three"]      # 3–6 tags, kebab-case only
category: "Linux"                              # auto-detect from content
---
```

### Fields that differ between EN and ID
Only these three fields are translated:
- `title`
- `description`
- `imageAlt`

All other fields (`slug`, `translationKey`, `tags`, `category`, `heroImage`, `date`, `published`, `featured`) must be **identical** in both EN and ID files.

---

## 4. Tags Rules

- Format: `lowercase-kebab-case` only. Never spaces — spaces produce `%20` in URLs.
- Count: minimum 3, maximum 6 per article.
- Always include **1 platform tag**: `windows`, `ubuntu`, `linux`, `android`, or `hardware`.
- Include **1 versioned tag** if the article targets a specific OS version: e.g. `ubuntu-26-04`, `windows-11`.
- Prefer established tags over new ones. Established tag registry (as of 2026-H1):
  `windows`, `tutorial`, `linux`, `windows-11`, `nextjs`, `ubuntu`, `debugging`, `printer`, `wayland`, `ai`, `driver`, `epson`, `firebase`, `setup`, `troubleshooting`, `ubuntu-26-04`, `ui-design`, `disqus`, `gaming`, `git`, `github`, `gnome-50`, `hardware`, `performance`, `ram`, `sap`, `vercel`, `version-control`, `android`, `antigravity`, `apps`, `archive`, `authentication`, `bash`, `beta`, `bootable-usb`, `clean-install`, `code-editor`, `css`, `customization`, `design`, `dev-channel`, `device-name`, `devops`, `download`, `dual-boot`

---

## 5. Hero Image

- Set in frontmatter `heroImage` only.
- **Never insert the hero image into the article body** unless explicitly requested.
- Path format: `/images/_posts/[category]/[subfolder]/[filename].webp`

---

## 6. Available MDX Components

### `<Callout>`
```mdx
<Callout variant="info" title="Title Here">
  Content of the callout.
</Callout>
```
Variants: `info`, `warning`, `danger`, `success`

### `<Steps>` + `<Step>`
Use for sequential procedural steps. Never use plain numbered markdown lists for step-by-step instructions.
```mdx
<Steps>
  <Step>
    ### Step Title
    Step description here.
  </Step>
  <Step>
    ### Next Step
    Next description.
  </Step>
</Steps>
```

### `<Gallery>`
```mdx
<Gallery caption="Optional caption text.">
  ![Alt text for image 1.](/images/_posts/path/image1.webp)
  ![Alt text for image 2.](/images/_posts/path/image2.webp)
</Gallery>
```

---

## 7. Internal Links

Format: `/blog/[slug]` — use the filename slug (EN slug), which is valid in both locales.

```mdx
[link text](/blog/ubuntu-26-04-lts-resolute-raccoon-new-features-major-changes)
```

Do not use absolute URLs for internal links. Do not use locale prefixes in internal links.

---

## 8. SEO Requirements

- Title: target 55–65 characters.
- `description`: target 140–160 characters.
- First 120 words must contain a direct answer to the primary search intent.
- One clear H1 (comes from `title` frontmatter — do not add a second H1 in the body).
- H2 for major sections, H3 for subsections.

---

## 9. References Section

Always close the article with a `### References` section listing all external sources cited.

```mdx
### References
1. [Article Title — Source Name](https://url.com)
2. [Article Title — Source Name](https://url.com)
```

---

## 10. Category Detection

Auto-detect category from content:

| Content topic | Category |
|---------------|----------|
| Ubuntu, Linux distros, shell | `Linux` |
| Windows, Windows 11 | `Windows` |
| RAM, GPU, motherboard, peripherals | `Hardware` |
| Next.js, Firebase, Git, dev tools | `Development` |
| AI tools, LLMs, AI assistants | `AI` |
| Printers, drivers | `Hardware` |

---

## 11. Freshness Note

If the article targets a specific software version or time-sensitive information, include a `<Callout variant="info" title="Freshness Note">` or `<Callout variant="warning">` near the top stating the version/date context.

---

## 12. Image Asset Convention

Hero image path must be placed at:
```
public/images/_posts/[category]/[subfolder]/[filename].webp
```

**When committing a new article, always include the image directory in the same commit or the immediately preceding one.** Never commit MDX files pointing to a `heroImage` path without also committing the actual image file.

Run `git status` before committing and check for untracked `public/images/` directories — those must be staged alongside the article files.

---

## 13. Final QA Before Output

- [ ] EN and ID filenames are identical
- [ ] `translationKey` is identical in both files
- [ ] `slug` frontmatter mirrors filename (without `.mdx`)
- [ ] Tags: kebab-case, 3–6, includes platform tag
- [ ] Hero image in frontmatter only, not in body
- [ ] No `{{...}}` source markers left unresolved
- [ ] No invalid/unclosed MDX component tags
- [ ] SEO title 55–65 chars, description 140–160 chars
- [ ] `### References` section present
- [ ] Internal links use `/blog/[en-slug]` format
- [ ] Image file exists at the `heroImage` path and is staged for commit
