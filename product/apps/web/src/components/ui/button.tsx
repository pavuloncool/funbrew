import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/src/lib/utils';

const buttonVariants = cva(
  'vs-focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all duration-220 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[1px] active:shadow-none',
  {
    variants: {
      variant: {
        default: 'border-vs-border-strong bg-vs-accent-secondary text-vs-text-primary shadow-vs-sm hover:bg-vs-accent-secondaryPressed',
        secondary: 'border-vs-border-strong bg-vs-elevated text-vs-text-primary shadow-vs-sm hover:bg-vs-surface',
        outline: 'border-vs-border-default bg-vs-elevated text-vs-text-primary hover:bg-vs-surface',
        ghost: 'border-transparent bg-transparent text-vs-text-primary hover:bg-vs-surface',
      },
      size: {
        default: 'h-12 text-base',
        sm: 'h-10 px-4 text-sm',
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
