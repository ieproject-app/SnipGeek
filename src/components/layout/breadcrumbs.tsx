
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

  // Helper to normalize path by removing trailing slash (except for root '/')
  const normalizePath = (path: string) => {
    if (!path) return '';
    const normalized = path.replace(/\/$/, '');
    return normalized === '' ? '/' : normalized;
  };

  const normalizedPathname = normalizePath(pathname);

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
        
        const normalizedHref = segment.href ? normalizePath(segment.href) : null;
        
        // Non-interactive if:
        // 1. No href provided
        // 2. It's the last segment (current page)
        // 3. The href matches the current normalized pathname (prevents links to current page)
        const isInteractive = normalizedHref && !isLast && normalizedHref !== normalizedPathname;
        
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
