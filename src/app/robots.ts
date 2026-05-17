
import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file for the site.
 */
export default function robots(): MetadataRoute.Robots {
  const disallowRules = [
    "/icons/",
    "/manifest.json",
    "/en/opengraph-image",
    "/id/opengraph-image",
    "/opengraph-image",
    "/api/admin/",
    "/api/dev/",
    "/api/tools/",
    "/api/numbers/",
  ];

  return {
    rules: [
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Applebot",
          "Applebot-Extended",
          "Amazonbot",
          "Bytespider",
        ],
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
