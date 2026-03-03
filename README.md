
# SnipGeek - Modern Minimalist Tech Blog (v2.5)

A high-performance tech blog and toolkit built with **Next.js 15**, **React 19**, and **Tailwind CSS**.

## Design System & Specifications

### 1. Global Layout & Aesthetic
- **Visual Style**: Clean, high-contrast typography with solid backgrounds.
- **Cinematic Centered Layout**: Articles feature centered breadcrumbs, headlines, and metadata, followed by an ultra-wide hero image aligned with the site header.
- **Theme Transition**: Smooth 500ms fading transition between Light and Dark mode.
- **Typography**: 
  - Headlines: **Bricolage Grotesque** (Bold/Black).
  - UI & Body: **Plus Jakarta Sans**.
  - Code: **JetBrains Mono** (Optimized at 13px for readability).
- **Border Radius**: 8px (`rounded-lg`) standard, 12px (`rounded-xl`) for main cards.

### 2. Component Specifications

#### Content Rendering (Blog & Notes)
- **Engine**: Local MDX files with `next-mdx-remote/rsc` (Server Side Rendering).
- **Robustness**: Automatically handles empty content directories without crashing using robust file-system checks.
- **MDX Components**: Custom interactive components including Zoomable Images, Image Grids, and Platform-specific Download Buttons.

#### Internal Tools
- **Access Control**: Protected by Google Authentication via Firebase Auth.
- **Categorization**: Clear distinction between Public (Accessible) and Internal (Authorized) tools.
- **Visuals**: Glassmorphism accents on headers and unified profile bars with hover-responsive cards.

### 3. Navigation & Search
- **Adaptive Header**: Smart visibility logic (hidden on scroll down, revealed on scroll up).
- **Universal Search**: Real-time filtering for both Blog Posts and Quick Notes with visual match highlighting.
- **Reading List**: Persistent local storage for saving articles to read later.

### 4. Technical Stack
- **Framework**: Next.js 15 (App Router).
- **Language**: TypeScript.
- **Backend**: Firebase (Auth & Firestore for Tools usage tracking).
- **Deployment**: Fully synchronized for production domain `snipgeek.com`.
