import Script from 'next/script';

const PUBLISHER_ID = 'ca-pub-6235611333449307';

/**
 * Loads the Google AdSense script once per page via next/script.
 * Place this in [locale]/layout.tsx, after GoogleAnalyticsTag.
 * Individual ad units are rendered separately via <AdSenseUnit />.
 *
 * Uses strategy="afterInteractive" so it never blocks page render or LCP.
 */
export function AdSenseScript() {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
