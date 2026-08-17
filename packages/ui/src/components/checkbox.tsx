import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { CheckIcon } from '../lib/icons'
import { cn } from '../lib/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Rendered beside the box. Omit it only when an external `<Label>` already names the control. */
  children?: ReactNode
  /**
   * The third state, for a parent box whose children are partly checked.
   *
   * It is a DOM property rather than an attribute, so it cannot be set in JSX and has to be
   * written to the node — which is the reason this component keeps its own ref.
   */
  indeterminate?: boolean
}

/**
 * Checkbox.
 *
 * `@derived` — not in the design. The geometry follows the field surface; only the behaviour
 * below is settled.
 *
 * A real `<input type="checkbox">` with the native box hidden and a drawn one in its place.
 *
 * Not a `<div role="checkbox">`: the native input brings form participation, `:checked`, the
 * space-bar binding, autofill and — the part usually missed — it is the thing a browser's own
 * form validation and a password manager can see. The visual is a sibling span driven entirely by
 * `peer-*` state, so behaviour and appearance cannot drift apart.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { children, indeterminate, className, disabled, ...props },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])

  return (
    <label
      data-un-component="checkbox"
      className={cn(
        'un-checkbox u:inline-flex u:items-start u:gap-2.5',
        disabled ? 'u:opacity-(--un-opacity-disabled)' : 'u:cursor-pointer',
        className,
      )}
    >
      {/*
        `sr-only` rather than `display: none` or `opacity: 0` — a hidden-by-display input is
        removed from the tab order and from the accessibility tree entirely, which is the most
        common way a "custom checkbox" ends up unreachable by keyboard.
      */}
      <input
        ref={(node) => {
          inner.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type="checkbox"
        disabled={disabled}
        className="u:peer u:sr-only"
        {...props}
      />

      <span
        aria-hidden="true"
        className={cn(
          'u:relative u:mt-0.5 u:grid u:size-4.5 u:shrink-0 u:place-items-center',
          'u:rounded-sm u:glass-edge u:bg-secondary',
          'u:transition-[background-color,box-shadow]',
          'u:duration-(--un-duration-fast) u:ease-(--un-ease-standard)',
          'u:peer-hover:[--un-edge-stops:var(--un-edge-stops-strong)]',
          // Focus lands on the visually hidden input, so the ring has to be drawn on the box.
          'u:peer-focus-visible:outline-2 u:peer-focus-visible:outline-ring',
          'u:peer-focus-visible:outline-offset-2',
          'u:peer-checked:bg-primary u:peer-indeterminate:bg-primary',
          'u:peer-checked:[--un-edge-stops:var(--un-edge-stops-accent)]',
          /*
            The marks live INSIDE this span, so their visibility rules have to be written from
            here. `peer-*` is a general-sibling combinator — put on a nested element it compiles
            to a selector that can never match, and the box silently never shows a tick.
          */
          'u:peer-checked:[&_[data-mark=check]]:block',
          'u:peer-indeterminate:[&_[data-mark=dash]]:block',
        )}
      >
        <CheckIcon data-mark="check" className="u:hidden u:size-3 u:text-primary-foreground" />
        <span
          data-mark="dash"
          className="u:hidden u:h-0.5 u:w-2 u:rounded-full u:bg-primary-foreground"
        />
      </span>

      {children ? (
        <span className="u:font-display u:text-sm u:text-foreground">{children}</span>
      ) : null}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'

