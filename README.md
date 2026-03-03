
# SnipGeek - Modern Minimalist Tech Blog

A high-performance tech blog and toolkit built with **Next.js 15**, **React 19**, and **Tailwind CSS**.

## Deployment & Build

This project is optimized for **Firebase App Hosting**. 

### Environment Variables
For the tools (like Number Generator) to work in production, you must set the following secrets in the Firebase Console under **App Hosting > Your App > Settings > Environment Variables**:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`

### Important Note on Build
In Next.js, variables prefixed with `NEXT_PUBLIC_` are injected into the client-side bundle during the **Build process**. If you change these variables in the dashboard, you **must trigger a new rollout** (New Deployment) for the changes to take effect.

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase Production
- **Styling**: Tailwind CSS + ShadCN UI
- **Deployment**: Automatic via GitHub + Firebase App Hosting
