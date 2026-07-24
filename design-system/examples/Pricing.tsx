import { Card, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Badge } from '../components/Badge';

interface Tier {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Solo',
    price: '$0',
    cadence: 'forever',
    description: 'For one person, one project.',
    features: ['All components', 'Local-only license', 'Community support'],
    cta: 'Start free',
  },
  {
    name: 'Studio',
    price: '$24',
    cadence: 'per month',
    description: 'For small teams shipping real product.',
    features: ['Everything in Solo', 'Figma library', 'Priority support', 'Custom tokens'],
    cta: 'Start trial',
    featured: true,
  },
  {
    name: 'Workshop',
    price: 'Custom',
    cadence: '',
    description: 'For agencies and larger orgs.',
    features: ['Everything in Studio', 'White-label', 'Onboarding workshop', 'SLA'],
    cta: 'Talk to us',
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-background">
      <Container width="content">
        <div className="flex flex-col items-center gap-4 text-center mb-16">
          <Badge variant="neutral">Pricing</Badge>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-ink max-w-2xl">
            Pay for what you ship. Never for seats you won't fill.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              variant={tier.featured ? 'elevated' : 'bordered'}
              className={tier.featured ? 'ring-1 ring-accent/40' : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tier.name}</CardTitle>
                  {tier.featured && <Badge variant="accent">Popular</Badge>}
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <div className="flex items-baseline gap-1 pt-2">
                <span className="font-display text-4xl text-ink">{tier.price}</span>
                {tier.cadence && <span className="text-sm text-ink-subtle">/ {tier.cadence}</span>}
              </div>

              <ul className="mt-6 flex flex-col gap-2 text-sm text-ink-muted">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1 h-1 w-1 rounded-full bg-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.featured ? 'primary' : 'secondary'}
                className="mt-8 w-full"
              >
                {tier.cta}
              </Button>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
