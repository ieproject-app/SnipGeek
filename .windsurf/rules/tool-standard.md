# SnipGeek Tool Standard

> Full skill reference: `.agent/skills/tool-standard/tool-standard.md`

## Rule: All tools MUST use `ToolWrapper`

Every tool component under `/src/components/tools/` **must** use `ToolWrapper` for the page header. Never build a custom header, hero section, or `<h1>` inside the tool component itself.

### Auth-required tool (internal):
```tsx
const toolMeta = dictionary.tools.tool_list.{key};
return (
  <ToolWrapper title={toolMeta.title} description={toolMeta.description} dictionary={dictionary}>
    {/* tool content */}
  </ToolWrapper>
);
```

### Public tool (no login wall):
```tsx
<ToolWrapper title={toolMeta.title} description={toolMeta.description} dictionary={dictionary} isPublic={true}>
  {/* tool content */}
</ToolWrapper>
```

### Header rendered by `ToolWrapper`:
- Title: `font-display text-4xl font-extrabold tracking-tighter text-primary uppercase`
- Description: italic, muted, flanked by `h-px w-8 bg-accent/30` decorative lines

---

## Dictionary entries (required for every new tool)

Add to **both** files under `tools.tool_list.{key}`:
- `src/dictionaries/en.json`
- `src/dictionaries/id.json`

```json
"{key}": { "title": "Tool Title", "description": "Short description." }
```

---

## Reference files

| File | Role |
|---|---|
| `src/components/tools/tool-wrapper.tsx` | Standard wrapper component |
| `src/components/tools/tool-history.tsx` | Example — auth-required tool |
| `src/components/tools/tool-numbers.tsx` | Example — auth-required tool |
| `src/components/tools/tool-bios-keys.tsx` | Example — public tool (`isPublic={true}`) |

---

## Do NOT

- Create a custom `<header>`, `<h1>`, pill badge, or hero div inside a tool component
- Skip `ToolWrapper` even for simple tools
- Forget to add dictionary entries in both `en.json` and `id.json`
- Use hardcoded title/description strings — always pull from `dictionary.tools.tool_list.{key}`
