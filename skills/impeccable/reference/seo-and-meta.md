# SEO & Meta

## Why This Matters

A site without proper meta, Open Graph, and structured data looks machine-generated to both audiences. Humans paste the URL into Slack or iMessage and get a gray, imageless preview — the digital equivalent of a default favicon. Crawlers and AI answer engines get an anonymous page they can't classify, cite, or rank. Meta is not plumbing; the link preview is part of the design.

## Head Conventions

Every page ships these five. No exceptions, including prototypes you intend to deploy.

```html
<title>Primary Headline — Brand</title>
<meta name="description" content="One compelling sentence-and-a-half that matches the page.">
<link rel="canonical" href="https://example.com/page">
<meta name="theme-color" content="#1a1714">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

- **Title ≤60 chars** (Google truncates ~60). Pattern: `Primary — Brand`. Primary keyword near the front, brand at the end, unique per page. Homepage may lead with the brand.
- **Meta description 150–160 chars.** Compelling, unique per page, must match the page content. Not a keyword list.
- **Canonical** is self-referencing on every page; paginated lists canonical to the root list.
- **`theme-color` matches the palette** — the hex equivalent of your surface token, so the mobile browser chrome tints to the brand instead of default white. (Use hex here; `theme-color` support for oklch() is not universal.)
- **Viewport** exactly as above. Never fixed-width, never `user-scalable=no`.

## Open Graph + Twitter Card

Copy-pasteable block — this is what Slack, iMessage, LinkedIn, and Discord render:

```html
<meta property="og:title" content="Primary Headline — Brand">
<meta property="og:description" content="Same job as the meta description; shorter and punchier is fine.">
<meta property="og:image" content="https://example.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Brand">
<meta name="twitter:card" content="summary_large_image">
```

- `og:image` is **1200×630 and designed, not screenshotted** — build it per the OG-image recipe in [imagery-and-assets.md](imagery-and-assets.md).
- `og:type`: `website` for pages, `article` for posts.
- Twitter/X falls back to OG tags for everything else — `twitter:card` set to `summary_large_image` is the only Twitter-specific tag you need.

## JSON-LD Structured Data

Schema.org blocks parse more reliably than prose — for search engines AND AI answer engines deciding whether to cite you. Pick the blocks that match the page. Validate at Google Rich Results Test (search.google.com/test/rich-results) and validator.schema.org.

### Organization

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Company",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://twitter.com/example",
    "https://linkedin.com/company/example"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service"
  }
}
</script>
```

### Article

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Choose the Right Widget",
  "description": "Complete guide to selecting widgets for your needs.",
  "image": "https://example.com/article-image.jpg",
  "author": {
    "@type": "Person",
    "name": "Jane Smith",
    "url": "https://example.com/authors/jane-smith"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-20"
}
</script>
```

### Product

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Blue Widget Pro",
  "image": "https://example.com/blue-widget.jpg",
  "description": "Premium blue widget with advanced features.",
  "brand": {
    "@type": "Brand",
    "name": "WidgetCo"
  },
  "offers": {
    "@type": "Offer",
    "price": "49.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/products/blue-widget"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1250"
  }
}
</script>
```

### FAQ

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What colors are available?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our widgets come in blue, red, and green."
      }
    },
    {
      "@type": "Question",
      "name": "What is the warranty?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All widgets include a 2-year warranty."
      }
    }
  ]
}
</script>
```

### Breadcrumbs

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://example.com/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Blue Widgets",
      "item": "https://example.com/products/blue-widgets"
    }
  ]
}
</script>
```

## Crawlability

**robots.txt** — the working pattern:

```text
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Never block resources needed for rendering
# (e.g. do NOT add: Disallow: /static/)

Sitemap: https://example.com/sitemap.xml
```

**AI crawlers (2026): make a per-bot decision, never a blanket block.** `OAI-SearchBot`, `PerplexityBot`, `GoogleOther`, `Google-Extended`, and `ClaudeBot` each obey their own robots.txt user-agent — and a Disallow removes you from that bot's citations. Blocking them all means disappearing from AI answers entirely; decide per bot what that's worth. `llms.txt` is unproven (~0.015% adoption, no vendor confirmation) — a 5-minute speculative add at most. Make first paragraphs self-contained: they are what snippets and AI summaries extract.

- **Sitemap**: max 50,000 URLs / 50MB per file (sitemap index beyond that); only canonical, indexable URLs; update `lastmod` on content change; submit to Search Console.
- **Semantic landmarks**: `<header>`, `<nav>`, `<main>`, `<footer>` — one `<main>` per page. Crawlers and screen readers both depend on them.
- **Heading hierarchy**: single `<h1>`, never skip levels (h1→h2→h3). The skipped-headings rule in [audit-rules.md](audit-rules.md) catches violations mechanically — don't ship what the audit would flag.
- **Images**: descriptive keyword filenames (`blue-widget-product-photo.webp`, never `IMG_12345.jpg`); alt text that describes content; explicit dimensions.

## Framework Mapping

**Next.js App Router**: use the Metadata API — static `export const metadata` for fixed pages, `generateMetadata` for dynamic routes (it receives params and can fetch). Never hand-roll `<head>` tags in App Router; the API dedupes, orders, and streams them correctly. Full patterns: the next-best-practices skill (SK-029).

**Static sites / plain HTML**: write the head blocks above directly. With Astro or Eleventy, put them in the base layout once and parameterize title, description, canonical, and og:image per page.

## Verify Before Shipping

Run `mcp__lighthouse__run_audit` with the SEO category. **Score ≥ 90 or fix what it flags** — it mechanically catches missing descriptions, uncrawlable links, missing alt text, and blocked resources. Don't declare meta work done on visual inspection alone.

---

Adapted from addyosmani/web-quality-skills @ 7b59d48 (MIT). Full ledger: ../NOTICE.md
