# SnipGeek Project Structure Guide

This document defines the **canonical structure** of the SnipGeek repository.

It is written for:

- human contributors
- future AI contributors
- anyone reviewing, refactoring, or extending the project

If there is a conflict between convenience and consistency, prefer **consistency with this document**.

---

## 1. Core Principles

SnipGeek is organized around a few clear boundaries:

1. **`src/` is for runtime application code**
2. **`docs/` is for internal project documentation**
3. **`_posts/`, `_notes/`, and `_pages/` are content sources for the public site**
4. **Static text-heavy pages should source their content from `_pages/`**
5. **Interactive pages should remain in `src/app/[locale]/...`**
6. **Temporary files, logs, exports, and experiments must not be placed in `src/`**
7. **New top-level folders should only be added intentionally**

These rules exist to keep the project predictable, scalable, and AI-friendly.

---

## 2. Top-Level Folder Map

## `src/`
Contains all runtime application code.

Examples:
- routes
- components
- hooks
- feature logic
- data loaders used at runtime
- Firebase integration
- utility functions used by the app

Do not place:
- temporary exports
- downloaded logs
- scratch files
- internal documentation
- one-off experiment data

---

## `public/`
Contains public static assets served directly by the app.

Examples:
- images
- icons
- downloadable static files
- logo assets

---

## `_posts/`
Content source for published blog posts.

Structure:
- `_posts/en/...`
- `_posts/id/...`

Each file is an MDX article with frontmatter.

---

## `_notes/`
Content source for notes.

Structure:
- `_notes/en/...`
- `_notes/id/...`

Use this for note-style content, dev notes, technical observations, or shorter structured entries.

---

## `_pages/`
Content source for static public pages.

Structure pattern:
- `_pages/<slug>/en.mdx`
- `_pages/<slug>/id.mdx`

Examples:
- `_pages/about/en.mdx`
- `_pages/contact/id.mdx`
- `_pages/privacy/en.mdx`
- `_pages/terms/id.mdx`
- `_pages/disclaimer/en.mdx`

This folder exists so static page content is not hardcoded into route files.

---

## `docs/`
Internal documentation for the repository.

Examples:
- contributor guides
- architecture notes
- project structure rules
- AI contribution rules
- migration plans
- internal references

`docs/` is **not** a source of public site pages.

Do not place:
- public blog content
- public notes
- public static page content
- runtime config masquerading as docs unless clearly intentional

---

## `scripts/`
One-off or reusable project scripts.

Examples:
- content preparation
- batch data injection
- internal automation
- migration helpers

Scripts may read project files, but they are not part of the runtime app.

---

## `.idx/`
Workspace/editor environment support for IDX/Firebase Studio.

Keep this folder if that environment is still relevant to the project workflow.

This folder is **not runtime application code**.

---

## `.agent/`
Tool-specific AI/editor support files.

This folder may exist for workflow compatibility, but it should not become the canonical source of project rules.

The canonical documentation should live in `docs/`.

---

## 3. Runtime App Structure

The runtime application lives under `src/`.

A simplified view:

- `src/app/` → route structure
- `src/components/` → reusable UI and layout components
- `src/lib/` → shared runtime helpers and utilities
- `src/hooks/` → React hooks
- `src/firebase/` → Firebase integration
- `src/dictionaries/` → localized UI dictionaries
- `src/github/` → should not be recreated for temporary data or logs

### Important rule
If a file does not directly support the running app, it probably does **not** belong in `src/`.

---

## 4. Route Rules

SnipGeek uses localized routes under:

- `src/app/[locale]/...`

This folder is for route definitions and page shells.

### Public content pages
Examples:
- `blog/[slug]`
- `notes/[slug]`
- `about`
- `privacy`
- `terms`
- `disclaimer`
- `contact`

### Interactive/internal pages
Examples:
- `tools/*`
- `login`
- dynamic utility flows
- authenticated internal features

---

## 5. Static Page Rules

### Use `_pages/` for text-heavy static pages
If a page is mostly textual and not primarily interactive, its content should live in `_pages/`.

Examples:
- `about`
- `privacy`
- `terms`
- `disclaimer`
- `contact`

### Route files should act as shells
For these pages, the route file in `src/app/[locale]/.../page.tsx` should mainly handle:

- route definition
- metadata generation
- layout shell
- loading MDX content from `_pages/`
- rendering the shared/static page template

### Do not hardcode large legal/informational bodies inside route files
That makes maintenance harder and encourages AI to generate inconsistent page structures.

---

## 6. Content Model Rules

SnipGeek currently uses three public content collections:

- blog posts → `_posts/`
- notes → `_notes/`
- static pages → `_pages/`

These are all **public site content**.

They are not internal docs.

### Do not move these into `docs/`
Even if they are Markdown/MDX, they are not repository documentation. They are site content.

---

## 7. When to Use `_pages/` vs `src/app/...`

Use `_pages/` when the page is:

- mostly text
- mostly editorial/legal/informational
- expected to be maintained as content
- bilingual and content-oriented
- better authored in MDX

Use `src/app/[locale]/...` directly when the page is:

- interactive
- stateful
- tool-driven
- auth-related
- data-fetch-heavy
- layout-first rather than content-first

### Good examples for `_pages/`
- privacy
- terms
- disclaimer
- contact
- about body content

### Good examples for direct route implementation
- prompt generator
- number generator
- login
- archive logic pages
- dynamic tag pages

---

## 8. About Page Rule

The `about` page is allowed to be **hybrid**.

That means:

- structured/profile UI can live in the route/page component
- editorial narrative content should live in `_pages/about/<locale>.mdx`

This is an intentional exception and a valid pattern.

Do not treat every page as hybrid by default.

---

## 9. Documentation Rules

`docs/` is the canonical place for internal guidance.

Examples of appropriate docs:
- project structure
- AI contributor rules
- architecture decisions
- migration notes
- internal backend references
- setup guides

Examples of inappropriate docs:
- public static site pages
- blog entries
- notes intended for publication
- arbitrary config dumps without explanation

If a JSON file is stored in `docs/`, its purpose must be obvious from its path or filename.

Bad example:
- `docs/backend.json`

Better examples:
- `docs/reference/number-generator-backend.schema.json`
- `docs/architecture/firestore-collections.md`

---

## 10. Root Cleanliness Rules

The repository root should stay intentional and readable.

Allowed root items usually include:
- source folders
- content folders
- public assets
- scripts
- docs
- project config files
- essential workspace support folders

Avoid clutter such as:
- random exports
- test logs
- downloaded API responses
- scratch JSON files
- temporary editor artifacts with unclear purpose

If something is temporary, it should go into a dedicated ignored area such as:
- `artifacts/`
- `.tmp/`
- `scratch/`

These should not be mixed into `src/`.

---

## 11. AI Contributor Rules

AI contributors must follow these rules:

### Rule 1
Do not create new top-level folders unless the task clearly requires it.

### Rule 2
Do not place temporary JSON, downloaded logs, or exported data inside `src/`.

### Rule 3
Do not place public static page content into `docs/`.

### Rule 4
When creating or updating a text-heavy static page, prefer `_pages/<slug>/<locale>.mdx`.

### Rule 5
When editing a route for a static page, prefer a thin route shell plus shared rendering/template logic.

### Rule 6
Do not duplicate structure decisions that already exist in this document.

### Rule 7
If a page belongs to public content, keep it in the content layer.
If it belongs to runtime behavior, keep it in the app layer.

---

## 12. Guidance for `src/lib/`

`src/lib/` is allowed to contain shared runtime utilities, but it must not become a dumping ground.

### Good candidates for `src/lib/`
- generic utilities
- shared helpers
- formatting functions
- content loading utilities used by the app
- stable shared constants

### Bad candidates for `src/lib/`
- feature-specific logic that belongs near one feature only
- temporary migrations
- one-off experiments
- orphaned data files

### Long-term guidance
As the project grows, prefer moving domain-specific logic closer to its domain instead of endlessly expanding `src/lib/`.

---

## 13. Guidance for `src/dictionaries/`

`src/dictionaries/` stores localized UI text.

Current structure may be simple, but future contributors should keep these rules in mind:

- use dictionaries for UI strings
- do not stuff large legal/editorial documents into dictionaries
- content-heavy pages should prefer `_pages/`
- if dictionaries grow too large, they may later be split by namespace

Examples of good dictionary content:
- button labels
- navigation strings
- small UI descriptions
- form labels
- tool labels

Examples of bad dictionary content:
- full privacy policies
- full terms of service
- long disclaimer bodies
- long editorial page bodies better suited to MDX

---

## 14. Example Decision Matrix

### Example A
You need to add a new legal page like `cookie-policy`.

Correct:
- `_pages/cookie-policy/en.mdx`
- `_pages/cookie-policy/id.mdx`
- route shell in `src/app/[locale]/cookie-policy/page.tsx`

Incorrect:
- put the entire page body directly into `page.tsx`
- put the content into `docs/`
- put the full legal text into dictionaries

### Example B
You need to add a new internal tool.

Correct:
- route and components under `src/app/[locale]/tools/...`
- supporting runtime code under `src/components`, `src/lib`, or feature-local areas as appropriate

Incorrect:
- put tool config dumps into `docs/` without structure
- place generated logs in `src/`

### Example C
You want to save API debug output.

Correct:
- use a temporary ignored folder such as `artifacts/` or `.tmp/`

Incorrect:
- create `src/github/downloaded-logs-*.json`

---

## 15. Current Intentional Exceptions

The following are intentional and should not be “fixed” blindly:

### `about`
Hybrid page:
- structured UI in route/component
- editorial content in `_pages/about/...`

### `.idx`
Retained for workspace/editor environment support.

### `.agent`
May be retained for AI tooling compatibility, but canonical rules should live in `docs/`.

---

## 16. Future Evolution

This structure is intentionally conservative.

Possible future refactors may include:
- introducing a `content/` top-level folder instead of `_posts/_notes/_pages`
- splitting dictionaries by namespace
- reducing `src/lib/` sprawl
- expanding `docs/architecture/`, `docs/reference/`, and `docs/ai/`

However, until such a migration is explicitly approved, contributors should follow the current canonical structure.

---

## 17. Final Rule of Thumb

If you are unsure where something belongs, ask:

1. Is this part of the running app?
   - put it in `src/`

2. Is this public site content?
   - put it in `_posts/`, `_notes/`, or `_pages/`

3. Is this internal project documentation?
   - put it in `docs/`

4. Is this temporary/debug/scratch output?
   - put it in an ignored temporary area, not in `src/`

5. Is this a text-heavy static page?
   - source it from `_pages/`

---

## 18. Common Pitfalls (AI & Human)

### The "src/content" Hallucination
Many modern Next.js templates or documentation suggest a `src/content` folder. **SnipGeek does NOT use this.** 
If you see or feel tempted to create `src/content/_posts`, STOP. The correct path is `_posts/` at the root.

### MDX Component Usage
- Always use `className` in MDX tags.
- Use `<Steps>` for tutorials, but never put `<ImageGrid>` inside them.

---

## 19. Canonical Summary

For SnipGeek:

- `src/` = runtime code
- `docs/` = internal documentation
- `_posts/` = blog content
- `_notes/` = notes content
- `_pages/` = static page content
- `.idx/` = workspace support
- `.agent/` = tool-specific AI support
- temporary files do not belong in `src/`

This is the canonical structure unless a future documented refactor explicitly changes it.