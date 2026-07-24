import { Button } from '../components/Button';
import { Container } from '../components/Container';

/**
 * Thin editorial nav. Hairline border at the bottom, no giant logo,
 * no shouting CTAs. Scales from a single row on mobile.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container width="wide">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-3 font-display text-xl tracking-tight text-ink">
            <LogoMark />
            <span>Atelier</span>
          </a>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-sm text-ink-muted">
            <a className="hover:text-ink transition-colors" href="/work">Work</a>
            <a className="hover:text-ink transition-colors" href="/writing">Writing</a>
            <a className="hover:text-ink transition-colors" href="/about">About</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Sign in</Button>
            <Button variant="primary" size="sm">Start</Button>
          </div>
        </div>
      </Container>
    </header>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="h-7 w-7">
      <rect x="4" y="4" width="56" height="56" rx="10" className="fill-ink" />
      <path
        d="M18 42 C 28 20, 36 20, 46 42"
        className="stroke-accent"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="30" r="2.25" className="fill-background" />
    </svg>
  );
}
