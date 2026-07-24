import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Width = 'prose' | 'narrow' | 'content' | 'wide' | 'ultra';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: Width;
}

const widths: Record<Width, string> = {
  prose:   'max-w-prose',
  narrow:  'max-w-[40rem]',
  content: 'max-w-[72rem]',
  wide:    'max-w-[88rem]',
  ultra:   'max-w-[104rem]',
};

export function Container({ width = 'content', className, children, ...rest }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-6 md:px-8 lg:px-12', widths[width], className)} {...rest}>
      {children}
    </div>
  );
}
