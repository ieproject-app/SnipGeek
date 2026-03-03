
# SnipGeek - Modern Minimalist Tech Blog

A high-performance tech blog and toolkit built with **Next.js 15**, **React 19**, and **Tailwind CSS**.

## Deployment to Firebase App Hosting

### 1. Push Code to GitHub
If your GitHub repository is empty, run these commands in your project folder:

```bash
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/ieproject-app/SnipGeek.git
git push -u origin main
```

### 2. Environment Variables
Set these secrets in the Firebase Console under **App Hosting > Your App > Settings > Environment Variables**:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`

### 3. Trigger a Build
After setting variables, go to the **Rollouts** tab and click **Start Rollout**. Next.js needs this process to inject `NEXT_PUBLIC_` variables into the browser code.

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase Production
- **Styling**: Tailwind CSS + ShadCN UI
- **Deployment**: Automatic via GitHub + Firebase App Hosting
