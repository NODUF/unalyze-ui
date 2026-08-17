import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Badge.
 *
 * Read from the design's day-streak chips and its unread count. Three shapes, three jobs:
 * an accent chip for a live streak, a neutral one for a past figure, and a solid count.
 *
 * ⚠ A badge is not a status light. Red and green here carry the same meaning they carry
 * everywhere else in the product — profit, loss, unread — and must never be repurposed for
 * "active / inactive" or for a tier. That rule is what keeps a green number trustworthy.
 */
export const badgeVariants = cva(
  [
    'u:inline-flex u:items-center u:justify-center u:gap-1.5',
    'u:rounded-full u:font-display u:text-xs u:font-normal',
    'u:whitespace-nowrap u:align-middle',
  ],
  {
    variants: {
      variant: {
        /** A live streak, or anything currently true. `#5BFD8B @0.1` on `#5BFD8B`. */
        accent: 'u:bg-accent u:text-accent-foreground',
        /** A past or secondary figure. */
        neutral: 'u:bg-secondary u:text-foreground',
        /** An unread count. Solid, because it has to survive being small and glanced at. */
        count: 'u:bg-alert u:text-white',
        /** A profit figure carried as a chip rather than as text. */
        positive: 'u:bg-accent u:text-positive',
        /** A loss figure. */
        negative: 'u:bg-[color-mix(in_srgb,var(--un-negative)_12%,transparent)] u:text-negative',
        /** Stale or partial data. */
        warning: 'u:bg-[color-mix(in_srgb,var(--un-warning)_12%,transparent)] u:text-warning',
        /** No fill — for a chip inside an already-tinted surface. */
        outline: 'u:glass-edge u:text-muted-foreground',
      },
      size: {
        /** 24 px tall with 4/8 padding — the design's own chip. */
        md: 'u:h-6 u:px-2 u:py-1',
        sm: 'u:h-5 u:px-1.5 u:text-[length:var(--un-text-10)]',
      },
      /**
       * Square-ish, for a bare number.
       *
       * A count badge with horizontal padding grows lopsided as the number gains digits, which is
       * why the design pads `9+` evenly on all four sides instead.
       */
      count: {
        true: 'u:min-w-6 u:px-1',
        false: '',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md', count: false },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, BadgeVariantProps {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant, size, count, className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-un-component="badge"
      data-variant={variant ?? 'neutral'}
      className={cn('un-badge', badgeVariants({ variant, size, count }), className)}
      {...props}
    />
  )
})

Badge.displayName = 'Badge'
