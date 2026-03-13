
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type LayoutBreadcrumbSegment = {
  label: string;
  href?: string;
};

interface LayoutBreadcrumbsProps {
  segments: LayoutBreadcrumbSegment[];
  className?: string;
}

/**
 * LayoutBreadcrumbs - A minimalist navigation component for SnipGeek.
 * Shows hierarchy up to category/tag level.
 */
export function LayoutBreadcrumbs({ segments, className }: LayoutBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent",
        className
      )}
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const isInteractive = Boolean(segment.href) && !isLast;

        return (
          <div key={index} className="flex items-center gap-2">
            {isInteractive ? (
              <Link
                href={segment.href!}
                className="hover:text-primary transition-all duration-300"
              >
                {segment.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={cn(isLast ? "opacity-60" : "opacity-80")}
              >
                {segment.label}
              </span>
            )}

            {!isLast && (
              <span className="opacity-30 select-none">›</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
