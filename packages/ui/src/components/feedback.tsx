import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { SpinnerIcon } from '../lib/icons'
import { cn } from '../lib/cn'
import { Text } from './text'
import { useUnalyze } from '../provider'

/* ------------------------------------------------------------------ *
 * Divider
 * ------------------------------------------------------------------ */

export const dividerVariants = cva('u:border-0 u:bg-border', {
  variants: {
    orientation: {
      horizontal: 'u:h-px u:w-full',
      /** Needs a height from its container — a vertical rule cannot size itself. */
      vertical: 'u:w-px u:self-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export type DividerVariantProps = VariantProps<typeof dividerVariants>

export interface DividerProps extends HTMLAttributes<HTMLDivElement>, DividerVariantProps {}

/**
 * Divider.
 *
 * The vertical rules between the KPI figures in the design, and the horizontal rule everywhere
 * else.
 *
 * `role="separator"` with an explicit `aria-orientation`, because a bare `<hr>` is announced as
 * horizontal whichever way it is drawn — which is actively misleading in a row of metrics.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation ?? 'horizontal'}
      data-un-component="divider"
      className={cn('un-divider', dividerVariants({ orientation }), className)}
      {...props}
    />
  )
})

Divider.displayName = 'Divider'

/* ------------------------------------------------------------------ *
 * Spinner
 * ------------------------------------------------------------------ */

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  /** Announced to assistive technology. Falls back to the provider's locale string. */
  label?: string
}

const SPINNER_SIZE = { sm: 'u:size-4', md: 'u:size-5', lg: 'u:size-8' } as const

/**
 * Spinner.
 *
 * `@derived` — the design has no standalone loading indicator, only a donut showing a completed
 * percentage. This is built from the Button spinner so the two match.
 *
 * `data-un-allow-motion` exempts it from the reduced-motion backstop: a frozen spinner reads as a
 * hung interface, which is worse than a moving one. WCAG 2.3.3 targets non-essential animation,
 * and the announced label carries the same information for anyone who cannot see it.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label, className, ...props },
  ref,
) {
  const { strings } = useUnalyze()

  return (
    <span
      ref={ref}
      role="status"
      data-un-component="spinner"
      className={cn('un-spinner-wrap u:inline-flex', className)}
      {...props}
    >
      <SpinnerIcon className={cn('un-spinner u:text-accent-foreground', SPINNER_SIZE[size])} />
      <span className="u:sr-only">{label ?? strings.loading}</span>
    </span>
  )
})

Spinner.displayName = 'Spinner'

/* ------------------------------------------------------------------ *
 * Skeleton
 * ------------------------------------------------------------------ */

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Matches the shape of what is loading. `text` sits on the line height of body copy. */
  shape?: 'text' | 'block' | 'circle'
}

/**
 * Skeleton.
 *
 * `@derived` — the design has no loading state. Built from the card material so a loading panel
 * reads as the same substance as the one it becomes.
 *
 * `aria-hidden` with no announcement of its own: a screen reader should hear "loading" once, from
 * the region that owns the load, not once per placeholder bar. The container is responsible for
 * `aria-busy`.
 *
 * The shimmer stops under `prefers-reduced-motion` — unlike the button spinner, a still skeleton
 * communicates perfectly well, so it gets no exemption.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'text', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-un-component="skeleton"
      className={cn(
        'un-skeleton u:bg-secondary',
        shape === 'text' && 'u:h-4 u:w-full u:rounded-full',
        shape === 'block' && 'u:h-full u:w-full u:rounded-lg',
        shape === 'circle' && 'u:aspect-square u:rounded-full',
        className,
      )}
      {...props}
    />
  )
})

Skeleton.displayName = 'Skeleton'

/* ------------------------------------------------------------------ *
 * EmptyState
 * ------------------------------------------------------------------ */

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  /** An illustration or icon. Decorative — the title carries the meaning. */
  icon?: ReactNode
  /** A single next step. Two competing actions in an empty state is one too many. */
  action?: ReactNode
}

/**
 * EmptyState.
 *
 * `@derived` — the design shows an empty calendar day as a bare em dash but has no empty-state
 * composition. Built from `Text` and the existing spacing scale, no new visual rules.
 *
 * Deliberately takes ONE action: an empty state exists to give someone a single next step, and a
 * second button turns that into a decision.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, icon, action, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-un-component="emptystate"
      className={cn(
        'un-emptystate u:flex u:flex-col u:items-center u:justify-center u:text-center',
        'u:gap-2 u:px-6 u:py-10',
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="u:mb-1 u:text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <Text variant="title" tone="default">
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="muted" style={{ maxWidth: '42ch' }}>
          {description}
        </Text>
      ) : null}
      {action ? <span className="u:mt-3">{action}</span> : null}
    </div>
  )
})

EmptyState.displayName = 'EmptyState'
