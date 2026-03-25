---
description: Enhanced synchronization procedure when switching IDEs (NPM standard)
---

## IDE-Agnostic Latest State Check (required)

Use this flow before starting work in any IDE (VS Code, Cursor, Windsurf, JetBrains, terminal-only).

1. Validate repository context.
   - Run: `git rev-parse --is-inside-work-tree`
2. Refresh remote references.
   - Run: `git fetch --all --prune`
3. Detect branch + divergence against upstream.
   - Run: `git status -sb`
   - Run: `git branch -vv`
4. Enforce clean working tree before sync.
   - Run: `git status --porcelain=v1 -uall`
   - If non-empty, stop and either commit or stash changes.
5. Force latest branch content.
   - Run: `current_branch=$(git rev-parse --abbrev-ref HEAD)`
   - Run: `git pull --ff-only origin "$current_branch"`
6. Verify data freshness with commit proof.
   - Run: `git log -1 --date=iso --pretty=format:'%H%n%ad%n%an%n%s'`
   - Run: `git log -1 --date=iso -- _posts _notes _pages src/lib`
7. Ensure dependency state matches lockfile.
   - If `package-lock.json` exists, run: `npm ci`
   - Else, run: `npm install`
8. Fail-fast binary check before start.
   - Run: `test -x node_modules/.bin/next && echo NEXT_OK || echo NEXT_MISSING`
   - If `NEXT_MISSING`, rerun dependency install (`npm ci` or `npm install`) and recheck.
9. Validate runnable state.
   - Run: `npm run dev`
10. Output required summary.
   - Branch name, ahead/behind status, dirty/clean status.
   - Last commit hash + date.
   - Last content commit for `_posts`, `_notes`, `_pages`, `src/lib`.
   - Dependency action executed (`npm ci` or `npm install`).
   - Next CLI check result (`NEXT_OK`/`NEXT_MISSING`).
   - Ready/not-ready status.

## Fallback if IDE tools are unavailable

If any IDE-specific tool integration fails, do not skip checks.
Run all steps above via terminal commands only and report the same summary.
