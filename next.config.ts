import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy directives.
 *
 * Domains are grouped by purpose:
 * - Google Analytics / Tag Manager
 * - Firebase (Firestore, Auth, Storage)
 * - Fonts & static assets
 *
 * References:
 * - https://developers.google.com/tag-platform/security/guides/csp
 */
const scriptSrcDirectives = [
  `'self'`,
  `'unsafe-inline'`,
  ...(isProduction ? [] : [`'unsafe-eval'`]), // needed only for Next.js dev/HMR
  `https://www.googletagmanager.com`, // GTM
  `https://www.google-analytics.com`, // GA4
  `https://ssl.google-analytics.com`, // GA4 (legacy)
  `https://static.monetag.com`, // Monetag
  `https://cdn.monetag.com`, // Monetag CDN
  `https://apis.google.com`, // Firebase Auth popup
  `https://*.firebaseapp.com`, // Firebase Auth handler
  `https://giscus.app`, // Giscus comments
  `https://www.youtube.com`, // YouTubeEmbed player script
  `https://www.youtube-nocookie.com`, // YouTubeEmbed privacy-enhanced player
].join(" ");

const cspDirectives = [
  // Only allow same-origin framing
  `default-src 'self'`,

  // Scripts: self + inline (Next.js needs 'unsafe-inline' for hydration)
  // Tag Manager, Analytics, Monetag
  [`script-src`, scriptSrcDirectives].join(" "),

  // Styles: self + inline (Tailwind/CSS-in-JS needs unsafe-inline)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,

  // Images: self + data URIs + all HTTPS
  [
    `img-src`,
    `'self'`,
    `data:`,
    `blob:`,
    `https:`,                                            // allows all HTTPS image sources
  ].join(" "),

  // iframes: YouTube embeds
  [
    `frame-src`,
    `'self'`,
    `https://www.google.com`,                           // reCAPTCHA
    `https://www.youtube.com`,                          // YouTube embeds
    `https://www.youtube-nocookie.com`,                 // YouTube privacy-enhanced
    `https://accounts.google.com`,                     // Firebase Auth
    `https://*.firebaseapp.com`,                       // Firebase Auth handler
    `https://giscus.app`,                               // Giscus comments
  ].join(" "),

  // Connections: Firebase, Analytics, Monetag, YouTube
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
    `wss://*.firebaseio.com`,                          // Firebase realtime (websocket)
    `https://static.monetag.com`,                      // Monetag
    `https://giscus.app`,                               // Giscus comments
    `https://*.googlevideo.com`,                       // YouTube video segment CDN
    `https://*.ytimg.com`,                             // YouTube thumbnails & static assets
  ].join(" "),

  // Media (audio/video): self + blob + YouTube CDN (needed for Firefox)
  `media-src 'self' blob: https://*.googlevideo.com https://*.ytimg.com`,

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
    // Configured for Firebase, Analytics, and YouTube.
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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Long-cache immutable Next.js build assets (hashed filenames).
        // These are content-hashed so they can be cached forever.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Next.js image optimizer output — safe to cache long at the CDN.
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache pre-rendered HTML pages at CDN level for 1 hour.
        // Exclude:
        //  - /api/*            (routes set their own Cache-Control)
        //  - /_next/*          (build assets use the long-cache rule above)
        //  - any file with an extension (fonts, images, manifests, etc.)
        // This prevents accidentally shortening Cache-Control on immutable assets.
        source: "/((?!api/|_next/|.*\\..*).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
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
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [64, 128, 256, 384, 512],
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
