import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Badge } from '../components/Badge';

/**
 * Editorial hero. Serif display type does the work — no gradient background,
 * no stock photography, no "Get started today" copy. Generous top padding
 * so the eye lands on the type.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-24 md:pt-48 md:pb-32">
      <Container width="wide">
        <div className="flex flex-col items-start gap-8 max-w-3xl">
          <Badge variant="accent">New — v1.0</Badge>

          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight text-ink">
            Tools for people who care about <em className="not-italic text-accent">craft</em>.
          </h1>

          <p className="text-lg md:text-xl text-ink-muted max-w-xl leading-relaxed">
            A design system built for long, considered work. No magic dust,
            no templates — just the parts you'll actually reuse.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" size="lg">Start building</Button>
            <Button variant="ghost" size="lg">Read the manifesto</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
