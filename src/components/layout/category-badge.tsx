import { cn } from "@/lib/utils";

/**
 * Defines the visual tokens for each category type.
 */
export type BadgeStyle = {
  bg: string;
  text: string;
  border: string;
  dot: string;
};

/**
 * Reusable palette of badge styles. Any tag/category name can be mapped to a
 * deterministic color via hashCategoryToIndex(). Add or reorder here to change
 * the set of colors used for auto-colored badges.
 */
export const BADGE_PALETTE: BadgeStyle[] = [
  { bg: 'bg-sky-100/80 dark:bg-sky-900/35', text: 'text-sky-800 dark:text-sky-200', border: 'border-sky-300/70 dark:border-sky-700/50', dot: 'bg-sky-700 dark:bg-sky-300' },
  { bg: 'bg-green-100/80 dark:bg-green-900/35', text: 'text-green-800 dark:text-green-200', border: 'border-green-300/70 dark:border-green-700/50', dot: 'bg-green-700 dark:bg-green-300' },
  { bg: 'bg-orange-100/80 dark:bg-orange-900/35', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300/70 dark:border-orange-700/50', dot: 'bg-orange-700 dark:bg-orange-300' },
  { bg: 'bg-violet-100/80 dark:bg-violet-900/35', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300/70 dark:border-violet-700/50', dot: 'bg-violet-700 dark:bg-violet-300' },
  { bg: 'bg-pink-100/80 dark:bg-pink-900/35', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300/70 dark:border-pink-700/50', dot: 'bg-pink-700 dark:bg-pink-300' },
  { bg: 'bg-indigo-100/80 dark:bg-indigo-900/35', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300/70 dark:border-indigo-700/50', dot: 'bg-indigo-700 dark:bg-indigo-300' },
  { bg: 'bg-cyan-100/80 dark:bg-cyan-900/35', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300/70 dark:border-cyan-700/50', dot: 'bg-cyan-700 dark:bg-cyan-300' },
  { bg: 'bg-teal-100/80 dark:bg-teal-900/35', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-300/70 dark:border-teal-700/50', dot: 'bg-teal-700 dark:bg-teal-300' },
  { bg: 'bg-yellow-100/80 dark:bg-yellow-900/35', text: 'text-yellow-900 dark:text-yellow-200', border: 'border-yellow-300/70 dark:border-yellow-700/50', dot: 'bg-yellow-700 dark:bg-yellow-300' },
  { bg: 'bg-amber-100/80 dark:bg-amber-900/35', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-300/70 dark:border-amber-700/50', dot: 'bg-amber-700 dark:bg-amber-300' },
  { bg: 'bg-rose-100/80 dark:bg-rose-900/35', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-300/70 dark:border-rose-700/50', dot: 'bg-rose-700 dark:bg-rose-300' },
  { bg: 'bg-blue-100/80 dark:bg-blue-900/35', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300/70 dark:border-blue-700/50', dot: 'bg-blue-700 dark:bg-blue-300' },
  { bg: 'bg-zinc-100/90 dark:bg-zinc-800/60', text: 'text-zinc-700 dark:text-zinc-200', border: 'border-zinc-300/80 dark:border-zinc-700/70', dot: 'bg-zinc-600 dark:bg-zinc-300' },
];

/**
 * Optional overrides: category names in this map always get this exact style.
 * Use for brand consistency; everything else uses the palette via hash.
 */
export const categoryColorMap: Record<string, BadgeStyle> = {
  'Windows': BADGE_PALETTE[0],
  'Android': BADGE_PALETTE[1],
  'Linux': BADGE_PALETTE[2],
  'macOS': BADGE_PALETTE[12],
  'iOS': BADGE_PALETTE[11],
  'Hardware': BADGE_PALETTE[3],
  'Gadget': BADGE_PALETTE[4],
  'PC': BADGE_PALETTE[5],
  'Software': BADGE_PALETTE[6],
  'Dev': BADGE_PALETTE[7],
  'Tips': BADGE_PALETTE[8],
  'Tutorial': BADGE_PALETTE[9],
  'Review': BADGE_PALETTE[10],
  'Article': BADGE_PALETTE[0],
  'Note': { bg: 'bg-amber-100/80 dark:bg-amber-900/35', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-300/70 dark:border-amber-700/50', dot: 'bg-amber-700 dark:bg-amber-300' },
  'Update': BADGE_PALETTE[6],
};

const defaultBadgeStyle: BadgeStyle = {
  bg: 'bg-muted/80', text: 'text-foreground/80',
  border: 'border-border', dot: 'bg-foreground/70',
};

/**
 * Hashes a string to a stable index in [0, BADGE_PALETTE.length).
 * Same string always returns the same index (e.g. any tag name gets a fixed color).
 */
export function hashCategoryToIndex(str: string): number {
  if (!str) return 0;
  let hash = 0;
  const s = String(str).toLowerCase();
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & 0x7fff_ffff;
  }
  return Math.abs(hash) % BADGE_PALETTE.length;
}

/**
 * Helper to simplify labels to single-word versions for a minimalist look.
 */
export function simplifyCategoryLabel(
  label: string | number | null | undefined,
): string {
  if (!label) return 'Article';
  const strLabel = String(label).toLowerCase();
  const map: Record<string, string> = {
    'pembaruan perangkat lunak': 'Update',
    'software update': 'Update',
    'perangkat keras': 'Hardware',
    'perangkat lunak': 'Software',
    'tips & trik': 'Tips',
    'gawai': 'Gadget',
    'ulasan': 'Review',
    'postingan': 'Article'
  };
  return map[strLabel] || String(label);
}

/**
 * Resolves badge style: uses categoryColorMap overrides when present,
 * otherwise picks a deterministic color from BADGE_PALETTE by hashing the label.
 * Any tag/category name (known or not) gets a consistent, predictable color.
 */
export function getBadgeStyle(category?: string, type?: 'blog' | 'note'): BadgeStyle {
  if (!category && !type) return defaultBadgeStyle;

  const simplified = category ? simplifyCategoryLabel(category) : undefined;

  if (simplified && categoryColorMap[simplified]) return categoryColorMap[simplified];
  const foundKey = Object.keys(categoryColorMap).find(key => key.toLowerCase() === simplified?.toLowerCase());
  if (foundKey) return categoryColorMap[foundKey];

  if (type === 'blog' && !category) return categoryColorMap['Article'];
  if (type === 'note' && !category) return categoryColorMap['Note'];

  const label = simplified || (type === 'note' ? 'Note' : 'Article');
  const index = hashCategoryToIndex(label);
  return BADGE_PALETTE[index];
}

interface CategoryBadgeProps {
  label?: string;
  category?: string;
  type?: 'blog' | 'note';
  size?: 'xs' | 'sm';
  showDot?: boolean;
  className?: string;
}

export function CategoryBadge({
  label, category, type, size = 'xs', showDot = true, className
}: CategoryBadgeProps) {
  const rawLabel = label || category || (type === 'blog' ? 'Article' : 'Note');
  const displayLabel = simplifyCategoryLabel(rawLabel);
  const style = getBadgeStyle(displayLabel, type);

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-black uppercase tracking-wider font-sans shrink-0",
      style.bg, style.text, style.border,
      size === 'xs' ? "text-[8px] px-1.5 py-0.5" : "text-[10px] px-2 py-1",
      className
    )}>
      {showDot && (
        <span className={cn("rounded-full shrink-0", style.dot,
          size === 'xs' ? "w-1 h-1" : "w-1.5 h-1.5"
        )} />
      )}
      {displayLabel}
    </span>
  );
}
