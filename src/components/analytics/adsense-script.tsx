'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { isAdSenseEnabled } from '@/lib/adsense';

const PUBLISHER_ID = 'ca-pub-6235611333449307';

/**
 * Loads the Google AdSense script once per page via next/script.
 * Place this in [locale]/layout.tsx, after GoogleAnalyticsTag.
 * Individual ad units are rendered separately via <AdSenseUnit />.
 *
 * Uses strategy="afterInteractive" so it never blocks page render or LCP.
 */
export function AdSenseScript() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEnabled(isAdSenseEnabled());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!enabled) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
