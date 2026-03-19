---
description: Enhanced synchronization procedure when switching IDEs with shared folder (assuming clean commit/push from previous IDE)
---

1. Run `git fetch origin` to refresh remote refs.
2. Run `git branch --show-current` to identify the active branch.
3. Run `git status --short --branch` to confirm the working tree is clean and check branch status.
4. If the working tree is not clean:
   - Ask user to commit or stash changes first
   - Do not proceed until working tree is clean
5. Check if branch is ahead/behind/diverged from upstream:
   - If behind: run `git pull origin [current-branch]`
   - If ahead: consider `git push origin [current-branch]` to sync
   - If diverged: ask user to resolve conflicts first
6. Check for IDE-specific conflicts:
   - Look for running processes that might conflict (ports, file locks)
   - Verify IDE-specific files (.vscode/, .idea/) won't cause issues
7. Inspect `package.json` and lock files to see if dependencies changed after pull.
8. If dependencies changed, install them with the matching package manager:
   - `pnpm install` if `pnpm-lock.yaml` is present
   - `npm install` if `package-lock.json` is present
   - `yarn install` if `yarn.lock` is present
9. Verify `node_modules` existence and compatibility if present.
10. Confirm completion to the user with a short summary of:
    - the active branch
    - whether a pull/push was performed
    - whether dependencies were installed
    - any potential conflicts detected
    - ready status for IDE switch
