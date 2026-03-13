---
description: Synchronization procedure when switching IDEs or starting a new session
---

1. Run `git fetch origin` to refresh remote refs.
2. Run `git branch --show-current` to identify the active branch.
3. Run `git status --short --branch` to confirm whether the working tree is clean and whether the branch is ahead, behind, or diverged from its upstream.
4. If the working tree is not clean, stop and tell the user that local changes must be reviewed before any pull is attempted.
5. If the branch is behind its upstream and the working tree is clean, run `git pull origin [current-branch]`.
6. Inspect `package.json` and lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, etc.) to see whether dependencies changed after the pull.
7. If dependencies changed, install them with the matching package manager:
   - `pnpm install` if `pnpm-lock.yaml` is present
   - `npm install` if `package-lock.json` is present
   - `yarn install` if `yarn.lock` is present
8. Confirm completion to the user with a short summary of:
   - the active branch
   - whether a pull was performed
   - whether dependencies were installed
   - whether any manual follow-up is still needed
