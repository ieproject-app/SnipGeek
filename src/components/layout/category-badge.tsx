'use client';

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
 * The master color map for SnipGeek categories.
 */
export const categoryColorMap: Record<string, BadgeStyle> = {
  'Windows':  { bg: 'bg-sky-500/12',    text: 'text-sky-400',    border: 'border-sky-500/25',    dot: 'bg-sky-400' },
  'Android':  { bg: 'bg-green-500/12',  text: 'text-green-400',  border: 'border-green-500/25',  dot: 'bg-green-400' },
  'Linux':    { bg: 'bg-orange-500/12', text: 'text-orange-400', border: 'border-orange-500/25', dot: 'bg-orange-400' },
  'macOS':    { bg: 'bg-zinc-500/15',   text: 'text-zinc-300',   border: 'border-zinc-500/25',   dot: 'bg-zinc-300' },
  'iOS':      { bg: 'bg-blue-500/12',   text: 'text-blue-400',   border: 'border-blue-500/25',   dot: 'bg-blue-400' },
  'Hardware': { bg: 'bg-violet-500/12', text: 'text-violet-400', border: 'border-violet-500/25', dot: 'bg-violet-400' },
  'Gadget':   { bg: 'bg-pink-500/12',   text: 'text-pink-400',   border: 'border-pink-500/25',   dot: 'bg-pink-400' },
  'PC':       { bg: 'bg-indigo-500/12', text: 'text-indigo-400', border: 'border-indigo-500/25', dot: 'bg-indigo-400' },
  'Software': { bg: 'bg-cyan-500/12',   text: 'text-cyan-400',   border: 'border-cyan-500/25',   dot: 'bg-cyan-400' },
  'Dev':      { bg: 'bg-teal-500/12',   text: 'text-teal-400',   border: 'border-teal-500/25',   dot: 'bg-teal-400' },
  'Tips':     { bg: 'bg-yellow-500/12', text: 'text-yellow-400', border: 'border-yellow-500/25', dot: 'bg-yellow-400' },
  'Tutorial': { bg: 'bg-amber-500/12',  text: 'text-amber-400',  border: 'border-amber-500/25',  dot: 'bg-amber-400' },
  'Review':   { bg: 'bg-rose-500/12',   text: 'text-rose-400',   border: 'border-rose-500/25',   dot: 'bg-rose-400' },
  'Article':  { bg: 'bg-sky-500/12',    text: 'text-sky-400',    border: 'border-sky-500/25',    dot: 'bg-sky-400' },
  'Note':     { bg: 'bg-amber-400/12',  text: 'text-amber-400',  border: 'border-amber-400/25',  dot: 'bg-amber-400' },
  'Update':   { bg: 'bg-cyan-500/12',   text: 'text-cyan-400',   border: 'border-cyan-500/25',   dot: 'bg-cyan-400' },
};

const defaultBadgeStyle: BadgeStyle = {
  bg: 'bg-muted/60', text: 'text-muted-foreground',
  border: 'border-border', dot: 'bg-muted-foreground',
};

/**
 * Helper to simplify labels to single-word versions for a minimalist look.
 */
export function simplifyCategoryLabel(label: any): string {
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
 * Helper to resolve badge style based on category name or content type.
 */
export function getBadgeStyle(category?: string, type?: 'blog' | 'note'): BadgeStyle {
  if (!category && !type) return defaultBadgeStyle;
  
  const simplified = category ? simplifyCategoryLabel(category) : undefined;
  
  if (simplified && categoryColorMap[simplified]) return categoryColorMap[simplified];
  
  const foundKey = Object.keys(categoryColorMap).find(key => key.toLowerCase() === simplified?.toLowerCase());
  if (foundKey) return categoryColorMap[foundKey];

  if (type === 'blog') return categoryColorMap['Article'];
  if (type === 'note') return categoryColorMap['Note'];
  
  return defaultBadgeStyle;
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
