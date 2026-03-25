import type { NextConfig } from "next";

/**
 * Content Security Policy directives.
 *
 * Domains are grouped by purpose:
 * - Google AdSense / Ad Manager
 * - Google Analytics / Tag Manager
 * - Firebase (Firestore, Auth, Storage)
 * - Fonts & static assets
 *
 * References:
 * - https://support.google.com/adsense/answer/10046348
 * - https://developers.google.com/tag-platform/security/guides/csp
 */
const cspDirectives = [
  // Only allow same-origin framing (AdSense iframes are handled via frame-src below)
  `default-src 'self'`,

  // Scripts: self + inline (Next.js needs 'unsafe-inline' for hydration)
  // AdSense, Tag Manager, Analytics, Monetag
  [
    `script-src`,
    `'self'`,
    `'unsafe-inline'`,
    `'unsafe-eval'`,                                    // required by Next.js dev
    `https://pagead2.googlesyndication.com`,             // AdSense main script
    `https://partner.googleadservices.com`,              // AdSense partner
    `https://adservice.google.com`,                     // Ad service
    `https://www.googletagmanager.com`,                 // GTM
    `https://www.google-analytics.com`,                 // GA4
    `https://ssl.google-analytics.com`,                 // GA4 (legacy)
    `https://www.googletagservices.com`,                // legacy ads
    `https://tpc.googlesyndication.com`,                // AdSense (some formats)
    `https://static.monetag.com`,                       // Monetag
    `https://cdn.monetag.com`,                          // Monetag CDN
    `https://apis.google.com`,                         // Firebase Auth popup
    `https://*.firebaseapp.com`,                        // Firebase Auth handler
  ].join(" "),

  // Styles: self + inline (Tailwind/CSS-in-JS needs unsafe-inline)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,

  // Images: self + data URIs + all HTTPS (AdSense serves tracking pixels)
  [
    `img-src`,
    `'self'`,
    `data:`,
    `blob:`,
    `https:`,                                            // allows all HTTPS image sources
  ].join(" "),

  // iframes: AdSense ad units, YouTube embeds
  [
    `frame-src`,
    `'self'`,
    `https://googleads.g.doubleclick.net`,              // AdSense ad frames
    `https://tpc.googlesyndication.com`,                // AdSense (safeframe)
    `https://www.google.com`,                           // reCAPTCHA
    `https://www.youtube.com`,                          // YouTube embeds
    `https://www.youtube-nocookie.com`,                 // YouTube privacy-enhanced
    `https://accounts.google.com`,                     // Firebase Auth
    `https://*.firebaseapp.com`,                       // Firebase Auth handler
  ].join(" "),

  // Connections: Firebase, Analytics, AdSense beacons, Monetag
  [
    `connect-src`,
    `'self'`,
    `https://*.googleapis.com`,                         // Firebase Firestore / Auth / Storage
    `https://*.firebaseio.com`,                        // Firebase Realtime DB
    `https://*.firebaseapp.com`,                       // Firebase Auth handler
    `https://*.cloudfunctions.net`,                    // Firebase Functions
    `https://firebasestorage.googleapis.com`,          // Firebase Storage
    `https://www.google-analytics.com`,                // GA4
    `https://region1.google-analytics.com`,            // GA4 regional
    `https://pagead2.googlesyndication.com`,           // AdSense
    `https://adservice.google.com`,                    // AdSense service
    `wss://*.firebaseio.com`,                          // Firebase realtime (websocket)
    `https://static.monetag.com`,                      // Monetag
  ].join(" "),

  // Media (audio/video): self + blob
  `media-src 'self' blob:`,

  // Workers (Next.js service worker, if any)
  `worker-src 'self' blob:`,

  // Object embeds: none
  `object-src 'none'`,

  // Upgrade insecure requests
  `upgrade-insecure-requests`,
];

const contentSecurityPolicy = cspDirectives.join("; ");

const securityHeaders = [
  {
    // Prevent MIME-type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Disallow embedding in iframes from other origins
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    // Send full referrer for same-origin, origin-only for cross-origin
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict access to sensitive browser features
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Enforce HTTPS for 1 year (only applied in production)
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Content Security Policy — controls which resources can be loaded.
    // Configured to allow Google AdSense, Firebase, Analytics, and YouTube.
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    // Required for Firebase/Google Auth popups to communicate back to the opener
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/blog/hapus-folder-onedrive-duplikat-explorer",
        destination: "/blog/remove-duplicate-onedrive-windows-11",
        permanent: true,
      },
      {
        source: "/id/blog/hapus-folder-onedrive-duplikat-explorer",
        destination: "/id/blog/remove-duplicate-onedrive-windows-11",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
