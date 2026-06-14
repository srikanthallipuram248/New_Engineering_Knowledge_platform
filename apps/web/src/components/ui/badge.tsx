import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary ring-1 ring-primary/20',
        success: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
        warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
        info: 'bg-accent/15 text-accent ring-1 ring-accent/20',
        muted: 'bg-foreground/[0.04] text-muted-foreground ring-1 ring-foreground/5',
        glass: 'glass text-foreground/80',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}
