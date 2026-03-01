# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## SnipGeek Design System & Specifications

### 1. Global Layout Rules
- **Header Height**: 80px (`h-20`).
- **Main Content Offset**: `pt-20` (80px) defined in root layout.
- **Article Page Symmetry (Symmetry 40px)**:
  - Top: Header to Breadcrumbs = 40px (`pt-10`).
  - Bottom: Breadcrumbs to Hero Image = 40px (`mb-10`).
- **Standard Border Radius**: 4px (`--radius: 0.25rem`).

### 2. Component Specifications

#### Featured Posts (Gallery Grid)
- **Layout**: 4-column Staggered Grid.
- **Aspect Ratio**: 4:3.
- **Image Radius**: 4px (`rounded-lg`).
- **Typography**: Roboto Bold (`font-headline`), `text-lg`.
- **Category Badge**: Frosted Glass style, sentence case capitalization.
- **Metadata**: Single-word tags only, relative time, and read time.
- **Hover Effect**: Card lift `translateY(-10px)`, image scale `1.06`, accent bar fade-in.

#### Latest Posts (Homepage)
- **Layout**: 3-column Grid.
- **Title Size**: `text-5xl` font-black.
- **Aspect Ratio**: 16:9.
- **Typography**: Roboto Bold, `text-base`.
- **Hover Effect**: Card lift `translateY(-1px)`, image scale `1.10`, bookmark overlay fade-in.

#### Post Page (Content)
- **Max Width**: 768px (`max-w-3xl`) for optimal readability.
- **Font**: Body (Arimo), Headings (Roboto).
- **Heading 2 Style**: 3xl, bold, with 12px accent line.

### 3. Interactive Behavior
- **Bookmark System**: Floating overlay on cards (visible on hover) or inline in list widgets.
- **Theme**: System-aware (Dark/Light) with radial gradient backgrounds.
