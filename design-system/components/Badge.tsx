import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Variant = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  neutral: 'bg-paper-200 text-ink',
  accent:  'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warn:    'bg-warn/10 text-warn',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-info/10 text-info',
};

export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-xs font-medium tracking-wide uppercase',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
