# SnipGeek Blog Post Conventions

> Full skill references:
> - `.agent/skills/content-generator/content-generator.md` — MDX format, frontmatter, routing, tags, components
> - `.agent/skills/snipgeek-blog-tone/snipgeek-blog-tone.md` — voice, tone, bilingual rules, paragraph rhythm

---

## Critical Rules (Quick Reference)

### Slug = Filename (NOT frontmatter)
The router reads `entry.name.replace(/\.mdx$/, "")` — the `slug` frontmatter field is never used for routing. **The filename IS the URL slug.**

### EN and ID filenames must be identical
```
_posts/en/2026-H1/ubuntu-26-04-minimum-ram-requirement.mdx  ✅
_posts/id/2026-H1/ubuntu-26-04-minimum-ram-requirement.mdx  ✅

_posts/id/2026-H1/ubuntu-26-04-kebutuhan-ram-minimum.mdx    ❌ wrong — different URL
```

### Only these 3 frontmatter fields differ between EN and ID
`title`, `description`, `imageAlt` — everything else is identical.

### Tags — kebab-case only, 3–6 tags
- Always include 1 platform tag: `ubuntu`, `linux`, `windows`, `android`, `hardware`
- Include 1 versioned tag if OS-specific: `ubuntu-26-04`, `windows-11`
- No spaces in tags — spaces cause `%20` in URLs

### Hero image — frontmatter only
Never render the hero image inside the article body unless explicitly requested.

### Voice
- English: "I" + "you"
- Indonesian: "saya" + "kamu" (never "Anda")
- Never open with "In this article", "Artikel ini akan membahas", or equivalents
- Indonesian version must be re-narrated natively — not translated sentence by sentence

### SnipGeek's Take
Every news/update article ends with `## SnipGeek's Take` — personal opinion, not a summary.

---

## Do NOT
- Derive slug from title or frontmatter `slug` field
- Use different filenames for EN and ID versions
- Translate Indonesian articles word-for-word from English
- Use "Anda" in Indonesian content
- Put hero image in the article body
- Create tags with spaces or uppercase letters
