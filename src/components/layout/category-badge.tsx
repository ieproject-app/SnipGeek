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
  { bg: 'bg-sky-500/10 dark:bg-sky-500/12', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20 dark:border-sky-500/25', dot: 'bg-sky-500 dark:bg-sky-400' },
  { bg: 'bg-green-500/10 dark:bg-green-500/12', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20 dark:border-green-500/25', dot: 'bg-green-500 dark:bg-green-400' },
  { bg: 'bg-orange-500/10 dark:bg-orange-500/12', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20 dark:border-orange-500/25', dot: 'bg-orange-500 dark:bg-orange-400' },
  { bg: 'bg-violet-500/10 dark:bg-violet-500/12', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20 dark:border-violet-500/25', dot: 'bg-violet-500 dark:bg-violet-400' },
  { bg: 'bg-pink-500/10 dark:bg-pink-500/12', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20 dark:border-pink-500/25', dot: 'bg-pink-500 dark:bg-pink-400' },
  { bg: 'bg-indigo-500/10 dark:bg-indigo-500/12', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20 dark:border-indigo-500/25', dot: 'bg-indigo-500 dark:bg-indigo-400' },
  { bg: 'bg-cyan-500/10 dark:bg-cyan-500/12', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20 dark:border-cyan-500/25', dot: 'bg-cyan-500 dark:bg-cyan-400' },
  { bg: 'bg-teal-500/10 dark:bg-teal-500/12', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20 dark:border-teal-500/25', dot: 'bg-teal-500 dark:bg-teal-400' },
  { bg: 'bg-yellow-500/10 dark:bg-yellow-500/12', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/20 dark:border-yellow-500/25', dot: 'bg-yellow-600 dark:bg-yellow-400' },
  { bg: 'bg-amber-500/10 dark:bg-amber-500/12', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20 dark:border-amber-500/25', dot: 'bg-amber-600 dark:bg-amber-400' },
  { bg: 'bg-rose-500/10 dark:bg-rose-500/12', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20 dark:border-rose-500/25', dot: 'bg-rose-500 dark:bg-rose-400' },
  { bg: 'bg-blue-500/10 dark:bg-blue-500/12', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20 dark:border-blue-500/25', dot: 'bg-blue-500 dark:bg-blue-400' },
  { bg: 'bg-zinc-500/12 dark:bg-zinc-500/15', text: 'text-zinc-500 dark:text-zinc-300', border: 'border-zinc-500/20 dark:border-zinc-500/25', dot: 'bg-zinc-500 dark:bg-zinc-300' },
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
  'Note': { bg: 'bg-amber-400/10 dark:bg-amber-400/12', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-400/20 dark:border-amber-400/25', dot: 'bg-amber-600 dark:bg-amber-400' },
  'Update': BADGE_PALETTE[6],
};

const defaultBadgeStyle: BadgeStyle = {
  bg: 'bg-muted/60', text: 'text-muted-foreground',
  border: 'border-border', dot: 'bg-muted-foreground',
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
