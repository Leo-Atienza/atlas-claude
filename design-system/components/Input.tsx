import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, leadingIcon, trailingIcon, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-sm border bg-background px-3 text-base text-ink placeholder:text-ink-subtle',
            'shadow-inset transition-[border-color,box-shadow] duration-150 ease-standard',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent',
            'disabled:opacity-50 disabled:pointer-events-none',
            error ? 'border-danger' : 'border-border',
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            className,
          )}
          {...rest}
        />

        {trailingIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            {trailingIcon}
          </span>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={`${inputId}-helper`} className="text-xs text-ink-subtle">
          {helper}
        </p>
      ) : null}
    </div>
  );
});
