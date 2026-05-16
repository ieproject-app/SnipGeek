import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const isProduction = process.env.NODE_ENV === "production";
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
  `https://pagead2.googlesyndication.com`, // Google AdSense
  `https://*.googlesyndication.com`, // Google AdSense
  `https://static.monetag.com`, // Monetag
  `https://cdn.monetag.com`, // Monetag CDN
  `https://apis.google.com`, // Firebase Auth popup
  `https://*.firebaseapp.com`, // Firebase Auth handler
  `https://giscus.app`, // Giscus comments
  `https://www.youtube.com`, // YouTubeEmbed player script
  `https://*.youtube.com`,
  `https://www.youtube-nocookie.com`, // YouTubeEmbed privacy-enhanced player
  `https://*.youtube-nocookie.com`,
  `https://s.ytimg.com`, // YouTube static assets
  `https://*.google.com`, // Google scripts
  `https://*.gstatic.com`, // Google static assets
].join(" ");

const cspDirectives = [
  // Only allow same-origin framing
  `default-src 'self'`,

  // Scripts: self + inline (Next.js needs 'unsafe-inline' for hydration)
  // Tag Manager, Analytics, Monetag
  [`script-src`, scriptSrcDirectives].join(" "),

  // Styles: self + inline (Tailwind/CSS-in-JS needs unsafe-inline)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.youtube.com https://*.youtube-nocookie.com`,

  // Fonts
  `font-src 'self' data: https://fonts.gstatic.com https://*.gstatic.com https://*.youtube.com https://*.youtube-nocookie.com`,

  // Images: self + data URIs + blob (canvas/image-crop) + whitelisted CDN hostnames.
  // Explicit whitelist instead of broad 'https:' to prevent arbitrary image injection.
  [
    `img-src`,
    `'self'`,
    `data:`,                                             // inline images, SVG data URIs, favicons
    `blob:`,                                             // canvas exports, image-crop tool output
    `https://firebasestorage.googleapis.com`,            // Firebase Storage (heroImages, uploads)
    `https://res.cloudinary.com`,                        // Cloudinary CDN (snipgeek namespace)
    `https://placehold.co`,                              // placeholder images (dev/fallback)
    `https://picsum.photos`,                             // picsum placeholder images (dev)
    `https://*.ytimg.com`,                               // YouTube video thumbnails
    `https://*.googleusercontent.com`,                   // Google user avatars (Firebase Auth)
    `https://www.google-analytics.com`,                  // GA4 measurement pixel
    `https://www.googletagmanager.com`,                  // GTM preview mode sprites
    `https://pagead2.googlesyndication.com`,             // Google AdSense
    `https://*.googlesyndication.com`,                   // Google AdSense
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
    `https://googleads.g.doubleclick.net`,              // Google AdSense
    `https://tpc.googlesyndication.com`,                // Google AdSense
    `https://*.googlesyndication.com`,                  // Google AdSense
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
    `https://pagead2.googlesyndication.com`,           // Google AdSense
    `https://*.googlesyndication.com`,                 // Google AdSense
    `https://googleads.g.doubleclick.net`,             // Google AdSense
    `wss://*.firebaseio.com`,                          // Firebase realtime (websocket)
    `https://static.monetag.com`,                      // Monetag
    `https://giscus.app`,                               // Giscus comments
    `https://*.googlevideo.com`,                       // YouTube video segment CDN
    `https://*.ytimg.com`,                             // YouTube thumbnails & static assets
    `https://*.youtube.com`,
    `https://*.youtube-nocookie.com`,
    `https://*.google.com`,
  ].join(" "),

  // Media (audio/video): self + blob + YouTube CDN (needed for Firefox)
  `media-src 'self' blob: https://*.googlevideo.com https://*.ytimg.com https://*.youtube.com https://*.youtube-nocookie.com`,

  // Workers (Next.js service worker, if any) + YouTube workers for Firefox
  `worker-src 'self' blob: https://*.youtube.com https://*.youtube-nocookie.com`,

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
    // Send full referrer for same-origin, but still provide enough info for cross-origin
    key: "Referrer-Policy",
    value: "no-referrer-when-downgrade",
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
        // Cache pre-rendered HTML pages at CDN level for 1 hour.
        // Exclude:
        //  - /api/*            (routes set their own Cache-Control)
        //  - /_next/*          (managed by Next.js)
        //  - any file with an extension (fonts, images, manifests, etc.)
        // This prevents accidentally overriding immutable asset caching.
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
      // /en canonicalization is handled by proxy.ts (308 redirect).
      // Only content-specific redirects below.
      {
        source: "/tags/web%20development",
        destination: "/tags/web-development",
        permanent: true,
      },
      {
        source: "/id/tags/web%20development",
        destination: "/id/tags/web-development",
        permanent: true,
      },
      {
        source: "/tags/windows%2011",
        destination: "/tags/windows-11",
        permanent: true,
      },
      {
        source: "/id/tags/windows%2011",
        destination: "/id/tags/windows-11",
        permanent: true,
      },
      {
        source: "/kontak",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/id/kontak",
        destination: "/id/contact",
        permanent: true,
      },
      {
        source: "/jurnal",
        destination: "/notes",
        permanent: true,
      },
      {
        source: "/id/jurnal",
        destination: "/id/notes",
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
      // ── Orphaned Indonesian slugs (pre-i18n migration) ─────────────
      // These URLs exist in GSC / external links without the /id/ prefix.
      // Content lives at /id/blog/[slug]. 301 → correct locale URL.
      {
        source: "/blog/instalasi-sap-gui-java-manjaro-linux",
        destination: "/id/blog/instalasi-sap-gui-java-manjaro-linux",
        permanent: true,
      },
      {
        source: "/blog/ubuntu-26-04-lts-aplikasi-default-baru",
        destination: "/id/blog/ubuntu-26-04-lts-aplikasi-default-baru",
        permanent: true,
      },
      {
        source: "/blog/ram-16gb-sudah-pas-pasan-kenapa-32gb-jadi-standar-baru",
        destination: "/id/blog/ram-16gb-sudah-pas-pasan-kenapa-32gb-jadi-standar-baru",
        permanent: true,
      },
      {
        source: "/blog/waspada-bug-windows-11-kb5063878-ssd-phison",
        destination: "/id/blog/waspada-bug-windows-11-kb5063878-ssd-phison",
        permanent: true,
      },
      {
        source: "/blog/perbedaan-workbook-dan-worksheet-google-sheets",
        destination: "/id/blog/perbedaan-workbook-dan-worksheet-google-sheets",
        permanent: true,
      },
      {
        source: "/blog/blog-baru-sulit-ranking-google-sandbox",
        destination: "/id/blog/blog-baru-sulit-ranking-google-sandbox",
        permanent: true,
      },
      {
        source: "/blog/langkah-penting-setelah-instal-windows-11",
        destination: "/id/blog/langkah-penting-setelah-instal-windows-11",
        permanent: true,
      },
      {
        source: "/blog/satu-bulan-bersama-ai-di-next-js",
        destination: "/id/blog/satu-bulan-bersama-ai-di-next-js",
        permanent: true,
      },
      {
        source: "/blog/instalasi-windows-11-panduan-lengkap",
        destination: "/id/blog/instalasi-windows-11-panduan-lengkap",
        permanent: true,
      },
      {
        source: "/blog/cara-aman-melihat-draf-artikel-nextjs",
        destination: "/id/blog/cara-aman-melihat-draf-artikel-nextjs",
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
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/snipgeek/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
