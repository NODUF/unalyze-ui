import { forwardRef, type ElementType, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Surface.
 *
 * Every panel, card, sheet and popover body in the library is a Surface. Centralising it is what
 * makes depth a system rather than a habit: one place decides what "raised" means, and every
 * elevated thing in the product agrees.
 */
export const surfaceVariants = cva('u:relative', {
  variants: {
    /**
     * Depth. `level` names the surface's ROLE in the stack, not its shadow — the light theme
     * reaches for a drop shadow and the dark theme for an inset top highlight, and neither
     * choice belongs in a component.
     */
    level: {
      /**
       * The design's card, and the reason this is the default.
       *
       * Every panel in the dashboard is the same material and wears all of it at once: a
       * translucent veil, a pair of inner lights on opposing diagonals, and a backdrop blur that
       * samples the ambient glow floating behind the layout. Splitting those into three props
       * would let a caller build three-quarters of a card, which is not a thing the design has.
       *
       * `un-glass-panel` is that material, and every floating panel — menu, select, dialog —
       * wears its sibling `un-glass-floating`, which is the same thing over a black backing.
       */
      glass: ['un-glass-panel u:text-card-foreground'],
      flat: 'u:bg-card u:text-card-foreground u:shadow-[var(--un-elevation-flat)]',
      raised: 'u:bg-card u:text-card-foreground u:shadow-[var(--un-elevation-raised)]',
      overlay: 'u:bg-popover u:text-popover-foreground u:shadow-[var(--un-elevation-overlay)]',
      sunken: 'u:bg-muted u:text-foreground',
      /** No background at all — for grouping and padding without introducing a visual layer. */
      none: '',
    },
    /**
     * A flat hairline. Mutually exclusive with `edge` in practice — wearing both puts a drawn
     * outline underneath a light rim and the rim stops reading as light.
     */
    border: {
      true: 'u:border u:border-border',
      false: '',
    },
    /**
     * The glass rim: a 1 px gradient ring, brightest at the top lip, gone by the bottom.
     *
     * This is the treatment the design puts on its cards, its KPI strip and its round buttons —
     * 57 layers carry it — and it is what makes a panel read as a pane of glass rather than as a
     * box with a stroke. Off by default: the design does NOT put it on everything, and a rim on
     * every surface reads as clutter.
     */
    edge: {
      none: '',
      subtle: 'u:glass-edge',
      /** Roughly triple. For a hovered or focused surface. */
      strong: 'u:glass-edge u:[--un-edge-stops:var(--un-edge-stops-strong)]',
      /** Brand-tinted rim. Pairs with `tint="brand"` on the one emphasised surface per view. */
      accent: 'u:glass-edge u:[--un-edge-stops:var(--un-edge-stops-accent)]',
    },
    /**
     * A whisper of hue over the base fill, at 5 %.
     *
     * Straight from the design, where each chart card is tinted with the colour of the series it
     * plots: the Unalyze Score card is green, Equity is blue, Daily P&L is violet. It is what
     * ties a card to its data without colouring anything a reader has to interpret.
     *
     * Sets a custom property rather than a background: the tint is one layer of the glass
     * material's `background-image`, stacked over the veil. It therefore needs `level="glass"` —
     * on a flat or sunken surface there is no material to carry it.
     */
    tint: {
      none: '',
      brand: 'u:[--un-tint:var(--un-tint-brand)]',
      info: 'u:[--un-tint:var(--un-tint-info)]',
      chart: 'u:[--un-tint:var(--un-tint-chart)]',
    },
    radius: {
      none: 'u:rounded-none',
      sm: 'u:rounded-sm',
      md: 'u:rounded-md',
      /** The panel radius — 32 px, what every card and the KPI strip use. */
      lg: 'u:rounded-lg',
      full: 'u:rounded-full',
    },
    padding: {
      none: '',
      sm: 'u:p-3',
      md: 'u:p-4',
      lg: 'u:p-6',
    },
    /** Clips children to the radius. Off by default: it creates a new stacking context. */
    clip: {
      true: 'u:overflow-hidden',
      false: '',
    },
  },
  /**
   * The defaults are a CARD, because that is what the design's surfaces overwhelmingly are: a
   * translucent veil at the panel radius, wearing a light rim and no flat border.
   *
   * `border` defaults off for that reason — a hairline underneath the rim puts a drawn outline
   * beneath the light and the rim stops reading as light. Turn `border` on and `edge` off for a
   * surface that genuinely wants a stroke, such as a bordered table.
   */
  defaultVariants: {
    level: 'glass',
    border: false,
    edge: 'subtle',
    tint: 'none',
    radius: 'lg',
    padding: 'md',
    clip: false,
  },
})

export type SurfaceVariantProps = VariantProps<typeof surfaceVariants>

export interface SurfaceProps extends HTMLAttributes<HTMLElement>, SurfaceVariantProps {
  as?: ElementType
}

export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface(
  { as, level, border, edge, tint, radius, padding, clip, className, ...props },
  ref,
) {
  const Component = (as ?? 'div') as ElementType

  return (
    <Component
      ref={ref}
      data-un-component="surface"
      data-level={level ?? 'glass'}
      data-edge={edge ?? 'subtle'}
      className={cn(
        'un-surface',
        surfaceVariants({ level, border, edge, tint, radius, padding, clip }),
        className,
      )}
      {...props}
    />
  )
})

Surface.displayName = 'Surface'
