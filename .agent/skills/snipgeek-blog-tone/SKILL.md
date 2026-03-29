---
name: snipgeek-blog-tone
description: Writing style and tone guide for SnipGeek blog articles. Use this skill whenever generating, writing, editing, or improving blog content — especially when expanding an outline or brief into a full article, or when producing bilingual (English + Indonesian) versions of a post. Trigger on keywords like "write article", "generate post", "blog content", "tulis artikel", "improve tulisan", "konten blog", "MDX", or any request to produce narrative content for SnipGeek.
---

# SnipGeek Blog Writing Tone & Style Guide

This skill defines the writing standard for all SnipGeek blog articles — ensuring every post feels human, consistent, and alive regardless of how minimal the input was.

---

## Core Concept: Outline → Full Article

The author provides only a **brief outline or key points**. The AI's job is to expand that into a complete, publish-ready article. The output should never feel like a padded outline — it should read like a real person sitting down and sharing something they genuinely discovered or experienced.

**Input from author:** bullet points, rough notes, a few key facts, maybe a screenshot path
**Output expected:** a full MDX article with natural flow, personality, and structure — in both English and Indonesian

---

## Language Strategy

The blog is **bilingual**. Every article must be produced in both languages.

| | English | Indonesian |
|---|---|---|
| **Status** | Primary language | Secondary language |
| **Locale path** | `en/` | `id/` |
| **Tone** | Conversational, clear, slightly casual — like a developer sharing a personal discovery | Same warmth, adapted naturally to Indonesian — not a direct translation |
| **Technical terms** | Keep as-is | Keep English terms, italicize if needed: *offline*, *trial*, *rendering engine* |

> **Important:** The Indonesian version is **not a literal translation** of the English. It should be re-narrated naturally in Indonesian. The meaning is the same, but the phrasing should feel native to the language — not translated.

---

## Voice & Personality

All articles are written in **first person** ("I" in English, "saya" in Indonesian), as if the author is sharing a real personal experience.

The reader is addressed as **"you"** (English) / **"kamu"** (Indonesian) — friendly and direct, not formal.

**Character of the writing:**
- Honest and personal — tell what actually happened, including doubts or surprises
- Informative without being preachy or lecturing
- Relaxed but trustworthy — casual tone, clean structure
- Never filler — every sentence should earn its place

**What to avoid:**
- Generic openers like *"In this article, we will discuss..."*
- Robotic transitions like *"Furthermore," "In conclusion,"*
- Repeating the same point in different words just to add length
- Bullet-point-ifying everything — prose flows better for narrative sections

---

## Article Structure

> **Scope:** The structure rules below apply to **Blog Posts** (`_posts/`). Technical Notes (`_notes/`) skip the personal opener and go directly to the technical finding or problem statement. Notes are compact and factual, not narrative.

### Opening (Blog Posts only)
Start with **personal context** — why the author tried this, what problem they were solving. Pull the reader in before introducing any technical details.

**Good opening (English):**
> "I've been using SketchUp to plan home renovations for a while now, and it's been genuinely useful. But since I'm not a professional designer, paying for the Pro version felt unnecessary."

**Good opening (Indonesian):**
> "Saya sudah cukup lama pakai SketchUp untuk merencanakan renovasi rumah — dan memang sangat membantu. Tapi karena bukan desainer profesional, rasanya tidak perlu bayar untuk versi Pro-nya."

**Bad opening:**
> "SketchUp is a popular 3D design software. This article will explain how to download it."

### Body
- Use `##` and `###` headings to break up long content
- Each section follows a rhythm: **context → information → personal insight**
- Weave in personal reactions between technical facts — this is what separates a blog from documentation
- Use `<Expandable>` for secondary technical content (specs, comparisons) that doesn't need to be immediately visible. **NEVER** use `<details>`/`<summary>`.

### Closing
End with a light call to action — invite comments, mention an alternative, or express a simple hope. Keep it brief and warm.

---

## MDX Format Reference

### Headings
```mdx
## Main Section Title
### Subsection
```

```mdx
<Callout variant="warning" title="Note on Licensing">
  The **Make** version is for **non-commercial** use only...
</Callout>
```

### Blockquote — Updates & Addendums
For information added after initial publish:
```mdx
> **Update:** After the 30-day trial expired, the software continued to work normally under the SketchUp Make 2017 User license.
```

### Collapsible Technical Content
Use the custom `<Expandable>` component. **NEVER** use raw `<details>`/`<summary>` — it is not a valid MDX component in SnipGeek and will cause rendering issues.

```mdx
<Expandable title="Minimum System Requirements" icon="info">
  - 2.1+ GHz Intel Processor
  - 4GB RAM
  - 512MB VRAM
</Expandable>
```

Icons available: `info`, `help`, `folder`, `warning`, `tip`.

### Images
```mdx
![Short descriptive alt text](/images/path/to/image.webp)
*Caption (optional): add only when the image needs context or source attribution.*
```

Image caption style rules:
- Do not caption every image. Over-captioning makes articles feel noisy.
- If image is externally sourced, include a short credit line (example: `Source: OMG Ubuntu`).
- If image is your own screenshot, optional context line is enough (example: `Screenshot from my test setup`).
- Keep captions small, factual, and brief. Avoid repeating alt text.

### Links
Use descriptive link text — never "click here":
```mdx
[Download SketchUp Make 2017 (via Mediafire)](/download/sketchup-make-2017)
[SketchUp for Web](https://app.sketchup.com/app)
```

---

## Output Format

When generating a bilingual article from an outline, always output in this order:

```
## English Version (Primary)

[Full English MDX article]

---

## Indonesian Version (id)

[Full Indonesian MDX article — re-narrated, not translated]
```

Both versions should have the same structure and cover the same points, but each should feel natural in its own language.

---

## Transformation Example

**Input outline from author:**
```
- SketchUp 2017 Make = last free offline version
- Specs: min 2.1GHz Intel, 4GB RAM, 512MB VRAM / rec 2.8GHz, 8GB RAM, discrete GPU
- Not for commercial use — need Pro license for that
- Thought it had a 30-day trial, but after 30 days it still works fine
- Download link available
- Alternative: SketchUp for Web
```

**Expected English opening:**
> "I've been using SketchUp for home renovation planning for a while — and it's been genuinely helpful. Since I'm not a professional designer though, the paid Pro version always felt like overkill. After some digging, I found that **SketchUp 2017 Make** is the last officially released version that's both free and works fully offline."

**Expected Indonesian opening:**
> "Sudah cukup lama saya pakai SketchUp untuk bantu perencanaan renovasi rumah — dan memang sangat membantu. Tapi karena bukan desainer profesional, rasanya tidak perlu bayar untuk versi berbayarnya. Setelah riset sebentar, saya menemukan bahwa **SketchUp 2017 Make** adalah versi gratis terakhir yang dirilis resmi dan bisa dipakai sepenuhnya secara *offline*."

---

## Pre-Publish Checklist

Before considering an article done, verify:

- [ ] Opening is personal, not generic
- [ ] No sentences that repeat the same point with different words
- [ ] Technical terms are consistent (capitalization, italics)
- [ ] Headings help the reader scan, not just divide content
- [ ] Callouts are used only for truly critical information
- [ ] Article has a proper closing — not cut off abruptly
- [ ] MDX is valid — all tags closed, no broken syntax
- [ ] English version reads naturally (not translated from Indonesian)
- [ ] Indonesian version reads naturally (not translated from English)
- [ ] Both versions cover the same content and structure

---

## Additional Notes

- Short and dense beats long and repetitive — don't pad
- If the author provides additional notes or updates after the initial draft, weave them into the narrative naturally — don't just append at the end
- Inline updates in existing articles (via blockquotes) are preferred over writing a new article for the same topic
