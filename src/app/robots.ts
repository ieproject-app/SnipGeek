
import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file for the site.
 */
export default function robots(): MetadataRoute.Robots {
  const commonDisallowRules = [
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

  // Search engines should focus on canonical HTML pages.
  // API payload routes are noindex and only intended for machine consumers.
  const searchEngineDisallowRules = [...commonDisallowRules, "/api/"];

  return {
    rules: [
      {
        userAgent: ["Googlebot", "Bingbot", "Applebot", "Amazonbot"],
        allow: ['/'],
        disallow: searchEngineDisallowRules,
      },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Applebot-Extended",
          "Bytespider",
        ],
        allow: ['/', '/api/posts/', '/api/notes/'],
        disallow: commonDisallowRules,
      },
      {
        userAgent: '*',
        allow: ['/'],
        disallow: searchEngineDisallowRules,
      },
    ],
    sitemap: 'https://snipgeek.com/sitemap.xml',
    host: 'snipgeek.com',
  };
}
