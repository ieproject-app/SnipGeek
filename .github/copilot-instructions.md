# SnipGeek Copilot Instructions

## Lighthouse Priority

For homepage and UX changes, prioritize Lighthouse outcomes using evidence from JSON reports.

### Primary goals
- Keep Accessibility green (90+).
- Improve mobile Performance with stable, measurable gains.
- Avoid regressions in Best Practices and SEO.

### Required workflow
1. Read the latest Lighthouse JSON report in repository root.
2. Identify top bottleneck by numeric impact (LCP, TBT, Interactive, opportunity savings).
3. Apply smallest high-impact change first.
4. Validate with build and summarize expected score effect.
5. If score remains low, iterate on the next largest bottleneck instead of broad rewrites.

### Optimization order
1. Reduce unused JavaScript and main-thread work.
2. Improve above-the-fold render and LCP path.
3. Reduce payload/hydration cost for initial route.
4. Tune secondary opportunities.

### Safety constraints
- Do not trade away accessibility to raise performance.
- Avoid speculative refactors without report-backed evidence.
- Keep user-visible behavior stable unless explicitly requested.

### Practical expectation
For content-heavy, client-interactive sites, mobile Performance in the 70-80 range can be realistic. Keep pushing meaningful gains, but communicate diminishing returns clearly.

## Proxy CDN Safety (CRITICAL)

**NEVER add cookie-based or header-based redirects in `src/proxy.ts`** without also setting `Cache-Control: private` or adding a `Vary` header.

In April 2026, a cookie-based locale redirect was cached by the CDN without `Vary: Cookie`, poisoning all visitors (including Googlebot) with a 307 redirect to `/id/`. Google indexing dropped to zero.

### Rules for proxy.ts
- Locale-less URLs always rewrite to `/en/...` — no cookie reads, no conditional redirects.
- Locale switching is client-side only (`LanguageSwitcher`, `LocaleSuggestionBanner` use `router.push()`).
- If you must vary by cookie/header: set `Cache-Control: private, no-store` on the response.
- After any proxy.ts edit: run `npx vitest run src/proxy.test.ts` and `node scripts/pre-deploy-check.mjs`.
- Full rule details: `.windsurf/rules/proxy-cdn-safety.md`
