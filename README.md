
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## SnipGeek Design System & Specifications

### 1. Global Layout Rules
- **Header Height**: 64px (`h-16`).
- **Main Content Offset**: `pt-16` defined in root layout.
- **Typography**: 
  - Headlines: Playfair Display (Serif).
  - UI & Body: DM Sans (Sans).
- **Standard Border Radius**: 4px (`--radius: 0.25rem`).

### 2. Component Specifications

#### Featured Posts (Gallery Grid)
- **Layout**: 4-column Staggered Grid.
- **Aspect Ratio**: 4:3.
- **Image Radius**: 4px (`rounded-lg`).
- **Typography**: Playfair Display Bold (`font-headline`), `text-lg`.
- **Category Badge**: Frosted Glass style, single-word only, sentence case capitalization.
- **Metadata**: Relative time only.
- **Hover Effect**: Card lift `translateY(-10px)`, image scale `1.06`, accent bar fade-in.

#### Latest Posts (Homepage)
- **Layout**: 3-column Grid inside `max-w-4xl` container.
- **Title Size**: `text-3xl` font-bold.
- **Aspect Ratio**: 4:3.
- **Typography**: Playfair Display Bold, `text-base`.
- **Hover Effect**: Card lift `translateY(-1px)`, image scale `1.10`, bookmark overlay fade-in.

#### Tutorial Slider (FeatureSlider)
- **Aspect Ratio**: 4:3.
- **Layout**: Carousel with 3 visible items on desktop.

#### Topic Section & Software Updates
- **Aspect Ratio**: 4:3 (Horizontal List).
- **Dimensions**: 120px x 90px image blocks.

#### Post Page (Content)
- **Max Width**: 768px (`max-w-3xl`) for optimal readability.
- **Font**: Body (DM Sans), Headings (Playfair Display).
- **Heading 2 Style**: 3xl, bold, with 12px accent line.

### 3. Interactive Behavior
- **Bookmark System**: Floating overlay on cards or integrated queue in Header.
- **Theme**: System-aware (Dark/Light) with radial gradient backgrounds.
- **Search**: Compact overlay with quick picks and image support.
