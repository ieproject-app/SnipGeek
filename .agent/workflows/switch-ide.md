---
description: Enhanced synchronization procedure when switching IDEs (NPM standard)
---

1. Run `git fetch origin` to refresh the local view of the remote.
2. Run `git status -sb` to check if your local branch is ahead, behind, or clean.
3. If the working tree is not clean:
   - Commit your work or use `git stash` before proceeding.
4. Sync with remote:
   - If behind: Run `git pull origin main` (or your active branch).
   - If ahead: Run `git push origin main` (ensure connectivity first).
5. Inspect `package.json` and `package-lock.json`.
6. If dependencies have changed or `node_modules` is missing:
   - Run `npm install` to ensure your environment matches the project state.
7. Verify the application starts:
   - Run `npm run dev` to confirm a clean build.
8. Summary for user:
   - Current branch and sync status.
   - Any dependency updates performed.
   - Ready status for development.
