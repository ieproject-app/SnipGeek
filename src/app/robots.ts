
import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file for the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: 'https://snipgeek.com/sitemap.xml',
  };
}
