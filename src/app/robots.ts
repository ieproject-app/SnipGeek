
import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file for the site.
 */
export default function robots(): MetadataRoute.Robots {
  const disallowRules = [
    "/_next/",
    "/_next/static/media/",
    "/icons/",
    "/manifest.json",
    "/en/opengraph-image",
    "/opengraph-image",
    "/api/dev/",
    "/api/tools/",
    "/api/numbers/",
    "/api/img",
  ];

  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Applebot', 'Bytespider'],
        allow: ['/', '/api/posts/', '/api/notes/'],
        disallow: disallowRules,
      },
      {
        userAgent: '*',
        allow: ['/', '/api/posts/', '/api/notes/'],
        disallow: disallowRules,
      },
    ],
    sitemap: 'https://snipgeek.com/sitemap.xml',
    host: 'snipgeek.com',
  };
}
