import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { buttonVariants, type ButtonVariantProps } from './button-variants'
import { useUnalyze } from '../provider'
import { SpinnerIcon } from '../lib/icons'
import { cn } from '../lib/cn'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    ButtonVariantProps {
  /**
   * Icons as rendered ELEMENTS — `icon={<IconRefresh />}`, not a component reference.
   *
   * A reference cannot cross the React Server Component boundary, so accepting one would force
   * every calling page in the consuming app to become a Client Component.
   */
  icon?: ReactNode
  iconTrailing?: ReactNode
  /**
   * Shows a spinner and blocks interaction. The label stays visible so the button does not
   * change width mid-action, which would shift every control beside it.
   */
  loading?: boolean
  /** Announced while loading. Defaults to the provider's locale string. */
  loadingLabel?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    block,
    icon,
    iconTrailing,
    loading = false,
    loadingLabel,
    className,
    children,
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
      // Never `type="submit"` by default. An unlabelled button inside a form that silently
      // submits it is one of the most common accidental-data-loss bugs in a product.
      type={type}
      disabled={blocked}
      aria-busy={loading || undefined}
      data-un-component="button"
      data-variant={variant ?? 'primary'}
      data-size={size ?? 'md'}
      data-loading={loading || undefined}
      className={cn('un-button', buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <SpinnerIcon className="un-spinner u:size-4" /> : icon ? <Slot>{icon}</Slot> : null}
      {children}
      {iconTrailing && !loading ? <Slot>{iconTrailing}</Slot> : null}
      {loading ? (
        <span className="u:sr-only">{loadingLabel ?? strings.loading}</span>
      ) : null}
    </button>
  )
})

/**
 * Wraps a decorative icon.
 *
 * `display: contents` rather than a span with layout, so the icon participates in the button's
 * flex row directly and the gap between icon and label stays the one the variant defines.
 */
function Slot({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="u:contents">
      {children}
    </span>
  )
}


// Explicit, not inferred. `forwardRef` returns an exotic component object with no `name`, so
// without this React DevTools, error boundaries and stack traces all read "Anonymous".
Button.displayName = 'Button'
