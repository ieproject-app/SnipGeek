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
