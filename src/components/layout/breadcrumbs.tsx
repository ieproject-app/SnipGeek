'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

/**
 * Breadcrumbs - A minimalist navigation component for SnipGeek.
 * Shows hierarchy up to category/tag level.
 */
export function Breadcrumbs({ segments, className }: BreadcrumbsProps) {
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
        
        return (
          <div key={index} className="flex items-center gap-2">
            {segment.href && !isLast ? (
              <Link 
                href={segment.href} 
                className="hover:text-primary transition-all duration-300"
              >
                {segment.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "opacity-60" : "")}>
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
