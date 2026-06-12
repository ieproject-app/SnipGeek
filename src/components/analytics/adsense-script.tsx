'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const PUBLISHER_ID = 'ca-pub-6235611333449307';

function canLoadAdsense() {
  if (process.env.NODE_ENV !== 'production') return false;
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  return !['localhost', '127.0.0.1', '::1'].includes(hostname);
}

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
      setEnabled(canLoadAdsense());
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
