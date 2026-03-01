
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
- **Category Badge**: Frosted Glass style, single-word only, sentence case capitalization.
- **Metadata**: Relative time only (Tags and read time removed for minimalist look).
- **Hover Effect**: Card lift `translateY(-10px)`, image scale `1.06`, accent bar fade-in.

#### Latest Posts (Homepage)
- **Layout**: 3-column Grid inside `max-w-4xl` container.
- **Title Size**: `text-3xl` font-bold.
- **Aspect Ratio**: 4:3 (Standardized with Featured Posts).
- **Typography**: Roboto Bold, `text-base`.
- **Category Badge**: Inline label above title, uppercase.
- **Hover Effect**: Card lift `translateY(-1px)`, image scale `1.10`, bookmark overlay fade-in.

#### Tutorial Slider (FeatureSlider)
- **Aspect Ratio**: 4:3.
- **Layout**: Carousel with 3 visible items on desktop.

#### Post Page (Content)
- **Max Width**: 768px (`max-w-3xl`) for optimal readability.
- **Font**: Body (Arimo), Headings (Roboto).
- **Heading 2 Style**: 3xl, bold, with 12px accent line.

### 3. Interactive Behavior
- **Bookmark System**: Floating overlay on cards (visible on hover) or inline in list widgets.
- **Theme**: System-aware (Dark/Light) with radial gradient backgrounds.
