import { forwardRef, type ElementType, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Text.
 *
 * The only sanctioned way to put words on screen. Its job is to stop `text-sm` and
 * `text-slate-500` appearing by hand in product code, because that is how a type scale quietly
 * becomes forty sizes.
 *
 * `variant` is the primary axis and it names a JOB, not a size: `value` is a number a trader reads,
 * `label` is the uppercase eyebrow above it. The design uses 23 distinct text styles; these
 * eleven variants are what those styles were doing. Reach for `variant` first, and fall back to a
 * bare `size` only when composing something they do not cover.
 */
export const textVariants = cva('', {
  variants: {
    /**
     * Which job this text does. Read off the Dashboard design.
     *
     * Named `variant` and not `role`: `role` is a reserved ARIA attribute, and a prop of that
     * name would shadow it — `<Text role="status">` would silently stop announcing.
     *
     * Nohemi throughout — the product is single-face. The variants differ by size, weight and
     * tracking only, which is why they are named for the job rather than for a typeface.
     */
    variant: {
      /** The Unalyze Score figure. One per screen. */
      display: 'u:font-display u:text-4xl u:font-normal u:tracking-[0.01em]',
      /** Monthly and yearly totals. */
      'value-xl': 'u:font-display u:text-[length:var(--un-text-28)] u:font-semibold',
      /** The KPI strip figures. */
      'value-lg':
        'u:font-display u:text-[length:var(--un-text-21)] u:font-normal u:tracking-[0.01em]',
      /** A calendar day's realised P&L. */
      value: 'u:font-display u:text-lg u:font-semibold',
      /** Trade counts, currency suffixes, win rates. */
      'value-sm': 'u:font-display u:text-sm u:font-medium',
      /** Card titles. */
      title: 'u:font-display u:text-[length:var(--un-text-15)] u:font-medium u:tracking-[0.01em]',
      /** Calendar weekday headers. */
      'title-sm': 'u:font-display u:text-[length:var(--un-text-13)] u:font-normal',
      /** Running text: legends, sub-captions, navigation. */
      body: 'u:font-display u:text-xs u:font-normal',
      /**
       * The uppercase eyebrow above a KPI. This one device is a large part of what stops a card
       * reading as default shadcn.
       */
      label: 'u:font-display u:text-xs u:font-semibold u:uppercase u:tracking-[0.06em]',
      /** Smaller eyebrow, for a dense row. */
      'label-sm':
        'u:font-display u:text-[length:var(--un-text-10)] u:font-semibold u:uppercase u:tracking-[0.06em]',
      /** Micro text: axis ticks, scale numbers, secondary counts. */
      caption: 'u:font-display u:text-[length:var(--un-text-10)] u:font-normal',
    },
    /**
     * A bare size, for composition the variants do not cover. Set alongside `variant` it
     * overrides that variant's size and keeps its face, weight and tracking.
     */
    size: {
      '10': 'u:text-[length:var(--un-text-10)]',
      xs: 'u:text-xs',
      '13': 'u:text-[length:var(--un-text-13)]',
      sm: 'u:text-sm',
      '15': 'u:text-[length:var(--un-text-15)]',
      base: 'u:text-base',
      lg: 'u:text-lg',
      xl: 'u:text-xl',
      '21': 'u:text-[length:var(--un-text-21)]',
      '2xl': 'u:text-2xl',
      '28': 'u:text-[length:var(--un-text-28)]',
      '3xl': 'u:text-3xl',
      '4xl': 'u:text-4xl',
    },
    /**
     * Tone names a ROLE, never a hue. `negative` is a loss; `destructive` is a delete button.
     * They are different concepts that happen to both be red, and keeping them apart is what
     * lets the loss colour change for colour-vision deficiency without recolouring every
     * dangerous action in the product.
     */
    tone: {
      default: 'u:text-foreground',
      muted: 'u:text-muted-foreground',
      subtle: 'u:text-muted-foreground u:opacity-80',
      positive: 'u:text-positive',
      negative: 'u:text-negative',
      neutral: 'u:text-neutral-value',
      warning: 'u:text-warning',
      info: 'u:text-info',
      destructive: 'u:text-destructive',
      inherit: '',
    },
    weight: {
      normal: 'u:font-normal',
      medium: 'u:font-medium',
      semibold: 'u:font-semibold',
      bold: 'u:font-bold',
    },
    family: {
      sans: 'u:font-sans',
      display: 'u:font-display',
      mono: 'u:font-mono',
    },
    /**
     * Asks for fixed-width digits.
     *
     * Set it on any column of numbers whose digits change. `font-variant-numeric: tabular-nums`
     * is a no-op on a face without the feature, so this costs nothing and starts working the
     * moment the font supports it — worth confirming against the real Nohemi files, because a
     * column of live P&L values will otherwise shift width on every update.
     */
    numeric: {
      true: 'un-numeric',
      false: '',
    },
    truncate: {
      true: 'u:truncate',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
    numeric: false,
    truncate: false,
  },
})

export type TextVariantProps = VariantProps<typeof textVariants>

export interface TextProps extends HTMLAttributes<HTMLElement>, TextVariantProps {
  /**
   * Which element to render. Size and semantics are separate on purpose: a visually small
   * heading is still an `h2`, and a big number is still a `p`.
   */
  as?: ElementType
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as, variant, size, tone, weight, family, numeric, truncate, className, ...props },
  ref,
) {
  const Component = (as ?? 'p') as ElementType

  return (
    <Component
      ref={ref}
      data-un-component="text"
      data-variant={variant ?? 'body'}
      data-tone={tone ?? 'default'}
      className={cn(
        'un-text',
        textVariants({ variant, size, tone, weight, family, numeric, truncate }),
        className,
      )}
      {...props}
    />
  )
})

Text.displayName = 'Text'

/**
 * Heading.
 *
 * A separate export rather than a `Text` variant so the required `level` cannot be forgotten. An
 * `h1` that renders as a `div` is invisible to a screen reader's landmark navigation.
 */
export interface HeadingProps extends Omit<TextProps, 'as'> {
  level: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Level → variant. The design has no six-step heading ramp because a dashboard has almost no prose;
 * what it has is a ladder of value sizes, so that is what the levels map onto.
 */
const HEADING_VARIANT: Record<HeadingProps['level'], NonNullable<TextVariantProps['variant']>> = {
  1: 'display',
  2: 'value-xl',
  3: 'value-lg',
  4: 'title',
  5: 'title-sm',
  6: 'label',
}

export const Heading = forwardRef<HTMLElement, HeadingProps>(function Heading(
  { level, variant, className, ...props },
  ref,
) {
  return (
    <Text
      ref={ref}
      as={`h${level}`}
      variant={variant ?? HEADING_VARIANT[level]}
      className={cn('un-heading', className)}
      {...props}
    />
  )
})

Heading.displayName = 'Heading'
