
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

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
        // Non-interactive if it's the last segment OR if it points to the current path
        const isInteractive = segment.href && !isLast && segment.href !== pathname && segment.href !== pathname + '/';
        
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
              <span className={cn(isLast ? "opacity-60" : "opacity-80")}>
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
