// lighthouserc.js — ATLAS v9 C2 (Wave 5). @lhci/cli config. Advisory locally,
// blocking in CI. Thresholds verified 2026-07-12: CWV p75 LCP <=2.5s / INP <=200ms
// / CLS <=0.1; Lighthouse perf >=90 mobile (median of >=3 runs), other categories >=95.
// UNITS TRAP: assertion budgets here are ms/bytes; a separate budget.json is KB.
module.exports = {
  ci: {
    collect: {
      // point at your built app; `startServerCommand` for a local run
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000/'],
      numberOfRuns: 3, // median smooths variance
      settings: { preset: 'desktop' }, // swap to mobile for the stricter perf gate
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        // Core Web Vitals (lab proxies — field data comes from Speed Insights)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }], // TBT lab-proxy for INP
      },
    },
    upload: { target: 'temporary-public-storage' }, // free; swap for LHCI server if self-hosting
  },
};
