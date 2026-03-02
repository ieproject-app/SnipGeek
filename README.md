
# SnipGeek - Modern Minimalist Tech Blog

A highly optimized tech blog built with Next.js 15, React 19, and Tailwind CSS.

## Design System & Specifications (v2.0)

### 1. Global Layout & Aesthetic
- **Background**: Solid colors (no gradients) for a clean, professional look.
- **Transisi Tema**: Smooth 500ms fading transition between Light and Dark mode.
- **Typography**: 
  - Headlines: Bricolage Grotesque (Bold/Black).
  - UI & Body: Plus Jakarta Sans.
  - Serif Accents: Lora.
  - Code: JetBrains Mono.
- **Border Radius**: 8px (`rounded-lg`) standard, 12px (`rounded-xl`) for main cards.

### 2. Component Specifications

#### Grid Lists (Blog, Notes, Tags)
- **Desktop Layout**: 3-column Grid inside `max-w-4xl` container.
- **Card Aspect Ratio**: 4:3 for all thumbnails.
- **Hover Interaction**: 
  - Image scale `1.10`.
  - Bookmark overlay appears on hover (top-right).
  - Floating pill tooltips for global buttons.

#### Internal Tools
- **Access Control**: Internal tools are protected by Google Authentication via Firebase.
- **Profile Bar**: Unified user profile header with logout capability.
- **Visuals**: Glassmorphism accents on card headers and profile bars.

### 3. Navigation & Search
- **Header**: Minimalist top navigation with hidden-on-scroll logic.
- **Search**: Compact overlay with quick picks and category filtering.
- **TOC**: Clean, non-scroll-spy table of contents for better performance.

### 4. Technical Stack
- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS + ShadCN UI.
- **Backend**: Firebase (Auth & Firestore for Tools).
- **Content**: Local MDX files with `next-mdx-remote`.
