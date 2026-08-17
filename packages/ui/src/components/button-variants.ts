import { cva, type VariantProps } from 'class-variance-authority'
import { glassControl } from '../lib/material'

/**
 * Button variant classes.
 *
 * Kept in a separate, directive-free module so they can be applied to something that is not a
 * `<button>` — a link styled as a button, a label wrapping a file input — without dragging the
 * component's client boundary along with them.
 *
 * Variants name intent, not appearance. `primary` is "the one action on this screen"; if a
 * screen needs two primaries, the screen is wrong, not the button.
 */
export const buttonVariants = cva(
  [
    // `relative` is load-bearing for `glass`: the rim is an absolutely positioned
    // pseudo-element, so on a static host it would size itself to the nearest positioned
    // ancestor instead of to the button.
    'u:relative u:inline-flex u:shrink-0 u:items-center u:justify-center u:gap-2',
    'u:whitespace-nowrap u:font-medium u:select-none',
    // Pills, not rounded rectangles. Every control in the design is fully round — the nav tabs,
    // the Expand affordances, the icon buttons — and at a 32 px panel radius a 6 px button
    // corner reads as a different design system.
    'u:rounded-full u:border u:border-transparent',
    'u:transition-[background-color,border-color,color,box-shadow,opacity]',
    'u:duration-(--un-duration-fast) u:ease-(--un-ease-standard)',
    // `disabled:` covers the real attribute; `aria-disabled` covers the case where a button must
    // stay focusable so a screen reader can still find and announce it.
    'u:disabled:pointer-events-none u:disabled:opacity-(--un-opacity-disabled)',
    'u:aria-disabled:pointer-events-none u:aria-disabled:opacity-(--un-opacity-disabled)',
  ],
  {
    variants: {
      variant: {
        primary: 'u:bg-primary u:text-primary-foreground u:hover:bg-primary-hover',
        /**
         * The glass material plus its rim — the treatment the design puts on every secondary
         * control, and what makes a toolbar read as the same substance as the panels around it.
         * The fill is one step brighter than a card, matching the design's round buttons.
         */
        /**
         * The glass control material — the same surface as an active nav tab and the year
         * select, imported rather than restated so the three cannot drift apart.
         *
         * It moved off `secondary` (#FAF8F8 at 8 %) onto the design's own control fill (#AEAEAE
         * at 10 %): slightly greyer, slightly stronger, and the value the design actually uses
         * on every raised control.
         */
        glass: [glassControl, 'u:text-foreground'],
        secondary: 'u:bg-secondary u:text-secondary-foreground u:hover:bg-secondary-hover',
        // Both hover onto the neutral veil, not onto `accent`. `accent` is a green wash, and a
        // control that greens under the cursor is claiming something — green means profit here.
        outline: 'u:border-input u:bg-transparent u:text-foreground u:hover:bg-secondary',
        ghost: 'u:bg-transparent u:text-foreground u:hover:bg-secondary',
        destructive:
          'u:bg-destructive u:text-destructive-foreground u:hover:bg-destructive-hover',
      },
      size: {
        // Heights are on the 4px grid. `sm` is 32px and `md` is 40px — both below the 44px
        // touch-target minimum, so they are for pointer-driven desktop UI. Anything reachable on
        // a phone uses `lg` (48px) or sits inside a container that pads the hit area out.
        sm: 'u:h-8 u:px-3 u:text-sm',
        md: 'u:h-10 u:px-4 u:text-sm',
        lg: 'u:h-12 u:px-6 u:text-base',
        /** Square, for an icon with no label. Same heights as above. */
        'icon-sm': 'u:h-8 u:w-8',
        'icon-md': 'u:h-10 u:w-10',
        'icon-lg': 'u:h-12 u:w-12',
      },
      block: {
        true: 'u:w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      block: false,
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
