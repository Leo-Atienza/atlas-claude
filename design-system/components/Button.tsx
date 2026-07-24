import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover focus-visible:ring-accent/30 shadow-sm',
  secondary:
    'bg-surface text-ink border border-border hover:bg-paper-200 focus-visible:ring-accent/30',
  ghost:
    'bg-transparent text-ink hover:bg-surface focus-visible:ring-accent/30',
  icon:
    'bg-transparent text-ink-muted hover:bg-surface hover:text-ink p-2 focus-visible:ring-accent/30',
};

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leadingIcon, trailingIcon, className, children, ...rest },
  ref,
) {
  const isIconOnly = variant === 'icon';
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-[background-color,box-shadow,color] duration-150 ease-standard',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none',
        !isIconOnly && sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {leadingIcon && <span className="-ml-1">{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className="-mr-1">{trailingIcon}</span>}
    </button>
  );
});
