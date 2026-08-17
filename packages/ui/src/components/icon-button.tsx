import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button-variants'
import { useUnalyze } from '../provider'
import { SpinnerIcon } from '../lib/icons'
import { cn } from '../lib/cn'

/**
 * IconButton.
 *
 * A button whose whole label is an icon — the round Expand, nav-rail and notification controls in
 * the design.
 *
 * ### Why it shares `buttonVariants` rather than defining its own
 *
 * Every variant a Button has, an IconButton has, and that parity is **structural**: both read the
 * same cva definition, so a variant added to one cannot be missing from the other. A second set of
 * class strings would be identical on the day it was written and subtly different a month later.
 *
 * ### Why it exists at all, given `<Button size="icon-md">` works
 *
 * The accessible name. A button containing only an SVG has no name at all — a screen reader
 * announces "button" and nothing else — and the fix is exactly the thing that gets forgotten under
 * deadline. Here `label` is a required prop, so an unnamed icon button will not compile.
 */

type ButtonVariants = VariantProps<typeof buttonVariants>

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'children'>,
    Pick<ButtonVariants, 'variant'> {
  /**
   * The accessible name. Required, and it is the reason this component exists.
   *
   * Write what the button DOES, not what it looks like: "Refresh trades", not "Circular arrow".
   */
  label: string
  /** The glyph, as a rendered element — `icon={<IconRefresh />}`, not a component reference. */
  icon: ReactNode
  /** Square sizes only, matching Button's heights so the two sit level in a toolbar. */
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  /**
   * Shows the label beside the icon instead of only to assistive technology.
   *
   * For the rare icon button that needs to be self-explanatory to everyone — a mobile bottom-nav
   * destination, say. It stops being square, so it stops being an icon button in all but name.
   */
  showLabel?: boolean
}

/** IconButton's `sm | md | lg` onto Button's square sizes, so the two components stay in step. */
const SQUARE = { sm: 'icon-sm', md: 'icon-md', lg: 'icon-lg' } as const

/**
 * Glyph size, applied to any `svg` inside the button so it covers both a caller's icon and the
 * spinner without either needing to know its own size.
 *
 * Written as whole literal class strings, not composed at runtime: Tailwind scans source text, so
 * a class built by interpolation is never generated and the rule silently does nothing.
 */
const GLYPH = {
  sm: 'u:[&_svg]:size-4',
  md: 'u:[&_svg]:size-4',
  lg: 'u:[&_svg]:size-5',
} as const

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant,
    size = 'md',
    label,
    icon,
    loading = false,
    showLabel = false,
    className,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const { strings } = useUnalyze()
  const blocked = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={blocked}
      aria-busy={loading || undefined}
      // The name comes from `aria-label` rather than from the visually hidden span below, so it
      // survives even when the span is replaced by a visible label.
      aria-label={showLabel ? undefined : label}
      data-un-component="iconbutton"
      data-variant={variant ?? 'primary'}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(
        // `un-iconbutton`, matching the `un-<lowercased name>` convention every other component
        // follows and the conformance suite checks for.
        'un-iconbutton',
        buttonVariants({ variant, size: showLabel ? size : SQUARE[size] }),
        GLYPH[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <SpinnerIcon className="un-spinner" />
          <span className="u:sr-only">{strings.loading}</span>
        </>
      ) : (
        <span aria-hidden="true" className="u:contents">
          {icon}
        </span>
      )}
      {showLabel && !loading ? label : null}
    </button>
  )
})

IconButton.displayName = 'IconButton'
