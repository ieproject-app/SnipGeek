# SEO & Google Search Console Setup Instructions

## Current SEO Configuration Status

### ✅ Already Configured:
1. **Sitemap**: `/sitemap.xml` - Automatically generated for all pages, blog posts, and notes
2. **Robots.txt**: `/robots.txt` - Properly configured to allow crawling except API routes
3. **Meta Tags**: 
   - Title templates and descriptions
   - Open Graph tags for social sharing
   - Twitter Card markup
   - Canonical URLs
   - Alternate language links (hreflang)
4. **Structured Data**: Basic metadata is included
5. **Indexing Rules**: Proper robots meta tags configured

### 🔧 Need Your Action:

#### 1. Google Search Console Verification
Anda sudah menjadi pemilik terverifikasi di Google Search Console, jadi tidak ada tindakan lebih lanjut yang diperlukan untuk verifikasi. Pastikan properti `https://snipgeek.com` terdaftar dan terverifikasi di akun Anda.

#### 2. Mengelola Indeksasi Halaman Tools
Jika ada halaman tools yang tidak ingin diindeks, Anda memiliki beberapa opsi:

**Opsi A: Kecualikan dari Sitemap**
Edit `src/app/sitemap.ts` dan hapus tools yang tidak ingin diindeks dari array `toolRoutes`:

```typescript
const toolRoutes = [
  "laptop-service-estimator",  // Ini diindeks
  "bios-keys-boot-menu",       // Ini diindeks
  // "compress-pdf",           // Tidak diindeks (dikomentari)
  // "employee-history",       // Tidak diindeks
];
```

**Opsi B: Gunakan Meta Noindex pada Halaman Tertentu**
Tambahkan metadata di halaman tools yang tidak ingin diindeks:

```typescript
// Di page.tsx tools tertentu
export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};
```

**Opsi C: Blokir di robots.txt**
Tambahkan di `src/app/robots.ts`:

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/tools/compress-pdf', '/tools/employee-history'],
      },
    ],
    sitemap: 'https://snipgeek.com/sitemap.xml',
  };
}
```

#### 3. Indexing Issues for Articles

**Check these items:**
1. **Content Quality**: Ensure articles have substantial, unique content (300+ words recommended)
2. **Meta Descriptions**: Each article should have a unique meta description
3. **Internal Linking**: Articles should be linked from other pages
4. **Crawl Budget**: Check if Google is crawling your site regularly

**Solutions:**
1. **Request Indexing Manually**:
   - Go to Google Search Console
   - URL Inspection tool
   - Enter the article URL
   - Click "Request Indexing"

2. **Improve Content Signals**:
   ```markdown
   - Add more comprehensive content (minimum 300 words)
   - Include relevant keywords naturally
   - Add internal links to related articles
   - Update publication dates regularly
   ```

3. **Check for Indexing Blocks**:
   - Ensure no `noindex` meta tags
   - Check robots.txt isn't blocking URLs
   - Verify canonical URLs are correct

## Additional SEO Recommendations

### 1. Enhance Structured Data
Add JSON-LD structured data for:
- Articles (BlogPosting)
- Breadcrumbs
- Organization info
- Website schema

### 2. Performance Optimization
- Core Web Vitals are already good based on your setup
- Consider adding lazy loading for images
- Implement caching headers

### 3. Content Strategy
- Maintain consistent publishing schedule
- Use descriptive, keyword-rich titles
- Create topic clusters around main themes
- Update old content regularly

### 4. Technical SEO
- Monitor crawl errors in GSC
- Submit sitemap to GSC if not auto-detected
- Set up email forwarding for GSC alerts
- Monitor Core Web Vitals report

## Monitoring Checklist
- [ ] Verify Google Search Console ownership
- [ ] Submit sitemap to GSC
- [ ] Monitor indexing status weekly
- [ ] Check for manual actions
- [ ] Review performance reports
- [ ] Set up email alerts

## Next Steps
1. Complete verification process
2. Submit sitemap in GSC: `https://snipgeek.com/sitemap.xml`
3. Request indexing for important pages
4. Monitor performance for 2-3 weeks
5. Adjust strategy based on GSC insights
