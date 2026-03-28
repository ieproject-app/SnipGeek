---
description: Standard pattern for building tool components in SnipGeek
---

# SnipGeek Tool Component Standard

## Rule: All tools MUST use `ToolWrapper`

Every tool component under `/src/components/tools/` **must** use `ToolWrapper` for the page header. Never build a custom header, hero section, or `<h1>` inside the tool component itself — `ToolWrapper` handles it uniformly.

---

## Patterns

### Auth-required tool (internal users only)
```tsx
import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Dictionary } from '@/lib/get-dictionary';

export function ToolXyz({ dictionary }: { dictionary: Dictionary }) {
  const toolMeta = dictionary.tools.tool_list.{key};

  return (
    <ToolWrapper
      title={toolMeta.title}
      description={toolMeta.description}
      dictionary={dictionary}
    >
      {/* tool content */}
    </ToolWrapper>
  );
}
```

### Public tool (no login wall)
```tsx
<ToolWrapper
  title={toolMeta.title}
  description={toolMeta.description}
  dictionary={dictionary}
  isPublic={true}
>
  {/* tool content */}
</ToolWrapper>
```

### `ToolWrapper` props reference
| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | required | Displayed as bold uppercase heading |
| `description` | `string` | required | Displayed italic with decorative side lines |
| `dictionary` | `Dictionary` | required | Full dictionary object |
| `isPublic` | `boolean` | `false` | Skip auth wall |
| `requiresCloud` | `boolean` | `true` | Show Firebase warning if offline |

---

## What `ToolWrapper` renders as the header

```
  TOOL TITLE IN BOLD UPPERCASE
  ——  Italic description text here  ——
```

- Title: `font-display text-4xl font-extrabold tracking-tighter text-primary uppercase`
- Description: italic, muted, flanked by `h-px w-8 bg-accent/30` decorative lines on each side

---

## Dictionary entries (required for every new tool)

Add to **both** locale files under `tools.tool_list.{key}`:

**`src/dictionaries/en.json`**
```json
"tool_list": {
  "{key}": {
    "title": "Tool Title",
    "description": "Short description of what the tool does."
  }
}
```

**`src/dictionaries/id.json`**
```json
"tool_list": {
  "{key}": {
    "title": "Judul Tool",
    "description": "Deskripsi singkat fungsi tool."
  }
}
```

---

## Reference files

| File | Role |
|---|---|
| `src/components/tools/tool-wrapper.tsx` | The standard wrapper component |
| `src/components/tools/tool-history.tsx` | Example — auth-required tool |
| `src/components/tools/tool-numbers.tsx` | Example — auth-required tool |
| `src/components/tools/tool-bios-keys.tsx` | Example — public tool (`isPublic={true}`) |
| `src/dictionaries/en.json` | English dictionary |
| `src/dictionaries/id.json` | Indonesian dictionary |

---

## What NOT to do

- Do not create a custom `<header>`, `<h1>`, pill badge, or hero div inside a tool component
- Do not skip `ToolWrapper` even for simple tools
- Do not forget to add dictionary entries in both `en.json` and `id.json`
- Do not use hardcoded title/description strings — always pull from `dictionary.tools.tool_list.{key}`
