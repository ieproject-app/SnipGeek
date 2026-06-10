'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const PUBLISHER_ID = 'ca-pub-6235611333449307';

interface AdSenseUnitProps {
  /** AdSense data-ad-slot ID for this specific unit */
  slot: string;
  /** Ad format — 'auto' (default) lets Google pick the optimal size */
  format?: string;
  /** Extra Tailwind classes on the outer wrapper */
  className?: string;
}

/**
 * Renders a single responsive AdSense unit.
 *
 * Design notes:
 * - Calls adsbygoogle.push() once per pathname/mount.
 * - Uses Next.js pathname dependency to re-initialize during client-side routing.
 * - Force-remounts the element using a pathname-scoped key.
 * - overflow-hidden prevents layout shift from unexpectedly large creatives.
 * - Never blocks render — the parent AdSenseScript loads the SDK lazily.
 */
export function AdSenseUnit({ slot, format = 'auto', className = '' }: AdSenseUnitProps) {
  const pathname = usePathname();
  // Store the pathname for which we pushed to prevent duplicate pushes in StrictMode
  const pushedPath = useRef<string | null>(null);

  useEffect(() => {
    // Guard prevents double-push on same pathname (StrictMode dev double-invoke)
    if (pushedPath.current === pathname) return;
    pushedPath.current = pathname;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // SDK not yet ready — Google will fill the slot once the script loads
    }
  }, [pathname]);

  return (
    <div
      key={`${pathname}-${slot}`}
      className={cn("my-8 w-full overflow-hidden text-center", className)}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
