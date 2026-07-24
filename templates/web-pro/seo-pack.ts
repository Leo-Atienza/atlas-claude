// seo-pack.ts — ATLAS v9 C5 (Wave 5). App-Router SEO built-ins (NOT next-sitemap —
// the framework owns these now). Split into the files noted; wired to starter-tokens
// brand colors. robots/sitemap/404 already scaffold via v8.17 Step 1b — don't duplicate.

// ── app/manifest.ts ──────────────────────────────────────────────────────────
import type { MetadataRoute } from 'next';
export function manifest(): MetadataRoute.Manifest {
  return {
    name: 'App Name',
    short_name: 'App',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff', // ← starter-tokens --color-bg
    theme_color: '#000000',      // ← starter-tokens --color-brand
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  };
}

// ── lib/json-ld.ts ───────────────────────────────────────────────────────────
// XSS-escape when injecting: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
// Per-archetype starters (mirror the Task Router): Person/WebSite (portfolio),
// Organization+Product (SaaS), Article (blog). Types from `schema-dts`.
export const personJsonLd = (name: string, url: string) => ({
  '@context': 'https://schema.org', '@type': 'Person', name, url,
});
export const websiteJsonLd = (name: string, url: string) => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name, url,
});
// Inject in a Server Component:
//   <script type="application/ld+json"
//     dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(...)).replace(/</g,'\\u003c') }} />

// ── app/opengraph-image.tsx ──────────────────────────────────────────────────
// import { ImageResponse } from 'next/og'  (satori — flexbox-subset CSS only, 1200x630)
// export const size = { width: 1200, height: 630 };
// export const contentType = 'image/png';
// export default function OG() {
//   return new ImageResponse(
//     (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
//       justifyContent: 'center', background: '#000', color: '#fff', fontSize: 64 }}>App Name</div>),
//     { ...size });
// }

// Verify at scaffold: fresh app passes web-preflight OG/robots/sitemap checks at 0 WARN;
// validator.schema.org accepts the JSON-LD.
