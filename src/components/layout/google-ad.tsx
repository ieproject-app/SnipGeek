'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CLIENT = 'ca-pub-6235611333449307';

type AdFormat = 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
type AdLayout = 'in-article' | 'in-feed' | '';

interface GoogleAdProps {
  /** AdSense ad slot ID from your AdSense dashboard */
  adSlot: string;
  /** Ad format — defaults to 'auto' (responsive) */
  adFormat?: AdFormat;
  /** Optional layout for fluid in-article/in-feed ads */
  adLayout?: AdLayout;
  /** Extra Tailwind classes on the wrapper */
  className?: string;
  /** Whether the ad should be full-width responsive */
  fullWidthResponsive?: boolean;
  /** Visual label shown in dev mode only */
  label?: string;
}

/**
 * GoogleAd — Reusable AdSense unit component.
 *
 * Usage:
 *   <GoogleAd adSlot="1234567890" />
 *   <GoogleAd adSlot="1234567890" adFormat="rectangle" />
 *   <GoogleAd adSlot="1234567890" adFormat="fluid" adLayout="in-article" />
 *
 * Notes:
 * - Only renders on the client (SSR-safe).
 * - In development, shows a placeholder box instead of a real ad.
 * - The parent component must be loaded AFTER the AdSense script
 *   (handled by strategy="lazyOnload" in layout.tsx).
 */
export function GoogleAd({
  adSlot,
  adFormat = 'auto',
  adLayout = '',
  className,
  fullWidthResponsive = true,
  label,
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pushed, setPushed] = useState(false);

  // Step 1: wait for client mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Step 2: push the ad unit once the DOM element is ready
  useEffect(() => {
    if (!mounted || pushed) return;

    const el = adRef.current;
    if (!el) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushed(true);
    } catch {
      // AdSense script not yet loaded — silently ignore
    }
  }, [mounted, pushed]);

  // ── Dev-mode placeholder ──────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className={cn(
          'relative w-full flex items-center justify-center',
          'border-2 border-dashed border-accent/30 rounded-lg bg-accent/5',
          'min-h-[90px] my-4',
          className,
        )}
        aria-label="Ad placeholder (dev mode)"
      >
        <div className="text-center space-y-1 py-4 px-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60">
            AdSense Unit
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/60">
            slot: {adSlot}
          </p>
          {label && (
            <p className="text-[10px] text-muted-foreground/40">{label}</p>
          )}
          <p className="text-[9px] text-muted-foreground/30 mt-1">
            format: {adFormat}
            {adLayout ? ` · layout: ${adLayout}` : ''}
          </p>
        </div>
      </div>
    );
  }

  // ── Production ad unit ────────────────────────────────────────────────────
  if (!mounted) return null;

  return (
    <div
      className={cn('overflow-hidden text-center my-4', className)}
      aria-label="Advertisement"
    >
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        {...(adLayout ? { 'data-ad-layout': adLayout } : {})}
        {...(fullWidthResponsive
          ? { 'data-full-width-responsive': 'true' }
          : {})}
      />
    </div>
  );
}

/**
 * InArticleAd — Convenience wrapper for in-article fluid ads.
 * Place between H2 sections in long-form content.
 */
export function InArticleAd({
  adSlot,
  className,
}: {
  adSlot: string;
  className?: string;
}) {
  return (
    <GoogleAd
      adSlot={adSlot}
      adFormat="fluid"
      adLayout="in-article"
      className={cn('my-8', className)}
      label="In-Article Ad"
    />
  );
}

/**
 * BannerAd — Horizontal leaderboard / banner format.
 * Suitable for top-of-page or between sections.
 */
export function BannerAd({
  adSlot,
  className,
}: {
  adSlot: string;
  className?: string;
}) {
  return (
    <GoogleAd
      adSlot={adSlot}
      adFormat="horizontal"
      className={cn('my-6', className)}
      label="Banner Ad"
    />
  );
}
