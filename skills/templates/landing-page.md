# Landing Page Template

## Stack
- Next.js 16 (Static/SSG where possible; see `wiki/web-dev/stack.md` for current pins)
- Motion + GSAP + Lenis + View Transitions
- shadcn/ui + Aceternity UI / Magic UI
- Tailwind CSS v4

## File Structure
```
src/
  app/page.tsx, layout.tsx
  components/
    sections/Hero.tsx, Features.tsx, Pricing.tsx, CTA.tsx, Footer.tsx
    ui/ (shadcn)
    animations/ (shared spring configs, scroll triggers)
  lib/fonts.ts, metadata.ts
```

## Design Checklist
- [ ] Spring animations on all interactive elements
- [ ] Scroll-triggered reveals (GSAP ScrollTrigger)
- [ ] Smooth scroll (Lenis)
- [ ] Skeleton loading states
- [ ] Mobile-first responsive
- [ ] Dark mode support
- [ ] Lighthouse 95+

## Skills to Load
**impeccable** (SK-102 — the web build entry point; loads frontend-design SK-005), plus the motion stack as needed: SK-047 (motion), SK-042/SK-044 (GSAP), SK-048 (Lenis). (Former SK-083/SK-054/SK-084 routing is archived.)
