import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500',
  {
    variants: {
      variant: {
        default: 'bg-navy-900 text-white',
        secondary: 'bg-navy-100 text-navy-900',
        outline: 'text-ink border border-line',
        success: 'bg-green-bg text-green',
        warning: 'bg-amber-bg text-amber',
        danger: 'bg-red-bg text-red',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
