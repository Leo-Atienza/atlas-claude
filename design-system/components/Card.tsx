import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Variant = 'elevated' | 'bordered' | 'editorial';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  // Elevated — floats off the page. Use for interactive content.
  elevated:
    'bg-surface shadow-md hover:shadow-lg transition-shadow duration-250 ease-standard rounded-lg',

  // Bordered — grounded. Use for static content, forms, settings blocks.
  bordered:
    'bg-surface border border-border rounded-md',

  // Editorial — no chrome. Use for long-form content where the type does the work.
  editorial:
    'bg-transparent border-t border-border pt-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'elevated', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(variants[variant], variant !== 'editorial' && 'p-6', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-display text-2xl tracking-tight text-ink', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-ink-muted', className)} {...rest}>
      {children}
    </p>
  );
}
