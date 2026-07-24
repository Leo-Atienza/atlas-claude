// next.config.security.ts — ATLAS v9 C6 (Wave 5). Security headers for Next 16.
// Merge `securityHeaders` into your next.config's headers(). CSP guidance below.
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

// CSP — pick ONE model:
//  · Dynamic apps: nonce-based CSP via proxy.ts (Next 16's renamed middleware).
//    Nonces force dynamic rendering (trade-off — note it in stack.md).
//  · Static / PPR-heavy: hash- or SRI-based CSP (keeps static rendering).
// Do NOT ship 'unsafe-inline' script-src in production.

const config: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
export default config;

// Verify after deploy:  curl -I https://your-app  (expect HSTS, nosniff, Referrer-Policy)
// Supply-chain (CI, C6): gitleaks (MIT, free personal) pre-commit; OSV-Scanner
// (Apache-2.0, no tier) + Renovate (free app) in web-quality.yml / the resources shelf.
