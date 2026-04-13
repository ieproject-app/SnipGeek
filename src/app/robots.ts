
import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file for the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Applebot', 'Bytespider'],
        allow: ['/', '/api/posts/', '/api/notes/'],
        disallow: ['/_next/', '/api/dev/', '/api/tools/', '/api/numbers/', '/api/img'],
      },
      {
        userAgent: '*',
        allow: ['/', '/api/posts/', '/api/notes/'],
        disallow: ['/_next/', '/api/dev/', '/api/tools/', '/api/numbers/', '/api/img'],
      },
    ],
    sitemap: 'https://snipgeek.com/sitemap.xml',
    host: 'snipgeek.com',
  };
}
