import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Rendered beside the track. Omit only when an external `<Label>` already names the control. */
  children?: ReactNode
}

/**
 * Switch.
 *
 * `@derived` — not in the design.
 *
 * A checkbox input wearing a track and a knob, with `role="switch"` so it is announced as "on"
 * and "off" rather than "checked" and "not checked".
 *
 * ### When to use this rather than a Checkbox
 *
 * A switch takes effect **immediately**. A checkbox states an intention that some later Save
 * confirms. Reaching for a switch inside a form with a submit button is the most common misuse —
 * the user flips it, presses Cancel, and reasonably expects nothing to have happened.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { children, className, disabled, ...props },
  ref,
) {
  return (
    <label
      data-un-component="switch"
      className={cn(
        'un-switch u:inline-flex u:items-center u:gap-2.5',
        disabled ? 'u:opacity-(--un-opacity-disabled)' : 'u:cursor-pointer',
        className,
      )}
    >
      {/*
        A real checkbox input, hidden with `sr-only` rather than `display:none` — the latter drops
        it out of the tab order and the accessibility tree. `role="switch"` changes only how it is
        announced; the space-bar behaviour and form participation stay native.
      */}
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="u:peer u:sr-only"
        {...props}
      />

      <span
        aria-hidden="true"
        className={cn(
          'u:relative u:inline-flex u:h-6 u:w-10 u:shrink-0 u:items-center',
          'u:rounded-full u:glass-edge u:bg-secondary',
          'u:transition-[background-color,box-shadow]',
          'u:duration-(--un-duration-fast) u:ease-(--un-ease-standard)',
          'u:peer-hover:[--un-edge-stops:var(--un-edge-stops-strong)]',
          // The input is visually hidden, so its focus ring has to be drawn on the track.
          'u:peer-focus-visible:outline-2 u:peer-focus-visible:outline-ring',
          'u:peer-focus-visible:outline-offset-2',
          'u:peer-checked:bg-primary',
          'u:peer-checked:[--un-edge-stops:var(--un-edge-stops-accent)]',
          // Written from the track, not from the knob: `peer-*` is a sibling combinator and
          // compiles to a selector that never matches when placed on a nested element.
          'u:peer-checked:[&>span]:translate-x-4',
          // Off state, so the knob reads against the track before it is ever switched on.
          'u:[&>span]:bg-foreground u:peer-checked:[&>span]:bg-primary-foreground',
        )}
      >
        <span
          className={cn(
            'u:ml-1 u:size-4 u:rounded-full',
            // transform only — animating `left` would relayout on every frame.
            'u:transition-transform u:duration-(--un-duration-fast) u:ease-(--un-ease-standard)',
          )}
        />
      </span>

      {children ? (
        <span className="u:font-display u:text-sm u:text-foreground">{children}</span>
      ) : null}
    </label>
  )
})

Switch.displayName = 'Switch'
