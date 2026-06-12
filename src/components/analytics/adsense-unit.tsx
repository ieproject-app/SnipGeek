'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const PUBLISHER_ID = 'ca-pub-6235611333449307';

function canRenderAdsense() {
  if (process.env.NODE_ENV !== 'production') return false;
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  return !['localhost', '127.0.0.1', '::1'].includes(hostname);
}

type AdSenseSize = 'inArticle' | 'belowContent' | 'horizontal' | 'sidebar';

const sizeClassName: Record<AdSenseSize, string> = {
  // Reserve a common mobile/display ad box to reduce CLS before Google fills it.
  inArticle: 'min-h-[280px] md:min-h-[320px]',
  // Below-content units can use a slightly taller box without pushing primary content.
  belowContent: 'min-h-[280px] md:min-h-[336px]',
  // Horizontal leaderboard-style units should stay compact.
  horizontal: 'min-h-[90px] md:min-h-[120px]',
  // Desktop sidebars commonly fill with tall skyscraper creatives.
  sidebar: 'min-h-[600px]',
};

interface AdSenseUnitProps {
  /** AdSense data-ad-slot ID for this specific unit */
  slot: string;
  /** Ad format — 'auto' (default) lets Google pick the optimal size */
  format?: string;
  /** Reserved layout box size to reduce cumulative layout shift */
  size?: AdSenseSize;
  /** Extra Tailwind classes on the outer wrapper */
  className?: string;
}

/**
 * Renders a single responsive AdSense unit.
 *
 * Design notes:
 * - Calls adsbygoogle.push() once per pathname/mount.
 * - Uses Next.js pathname dependency to re-initialize during client-side routing.
 * - Reserves a predictable min-height so late ad fill does not cause major CLS.
 * - overflow-hidden prevents layout shift from unexpectedly large creatives.
 * - Never blocks render — the parent AdSenseScript loads the SDK lazily.
 */
export function AdSenseUnit({
  slot,
  format = 'auto',
  size = 'inArticle',
  className = '',
}: AdSenseUnitProps) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // Store the pathname for which we pushed to prevent duplicate pushes in StrictMode
  const pushedPath = useRef<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEnabled(canRenderAdsense());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Guard prevents double-push on same pathname (StrictMode dev double-invoke)
    if (pushedPath.current === pathname) return;

    const pushAd = () => {
      const width = wrapperRef.current?.getBoundingClientRect().width ?? 0;
      if (width <= 0 || pushedPath.current === pathname) return;

      pushedPath.current = pathname;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // AdSense may throw when a slot is not fillable yet; keep the page usable.
      }
    };

    pushAd();

    if (pushedPath.current === pathname || !wrapperRef.current) return;

    const observer = new ResizeObserver(pushAd);
    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'my-8 flex w-full items-center justify-center overflow-hidden text-center',
        sizeClassName[size],
        className,
      )}
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
