import type { SVGProps } from 'react'

/**
 * The handful of glyphs the components need for their own affordances.
 *
 * **Not an icon set, and never exported.** The library deliberately ships no icon library and
 * takes icons as `ReactNode` props, so the consuming team keeps whatever set they already use.
 * These five exist only because a close button, a tick and a chevron are parts of the controls
 * themselves — a caller cannot be asked to supply the tick inside a checkbox.
 *
 * They were duplicated across five files before this: two copies of the spinner and two of the
 * tick, already drifting in stroke width. One definition each is the point.
 *
 * All of them:
 * - inherit `currentColor`, so a glyph follows the variant it sits in
 * - are `aria-hidden`, because the control around them carries the accessible name
 * - size from the class the caller passes, never from a hardcoded width
 */

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  'aria-hidden': true,
  focusable: false,
} as const

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" {...base} {...props}>
      <path d="M2.5 6.2 4.8 8.5 9.5 3.8" {...stroke} />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} {...props}>
      <path d="M4.5 6.5 8 10l3.5-3.5" {...stroke} />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} {...props}>
      <path d="m4.5 4.5 7 7m0-7-7 7" {...stroke} />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} {...props}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.75 7V5.25a2.25 2.25 0 1 1 4.5 0V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The spinner glyph, with no announcement of its own.
 *
 * Whoever renders it owns the announcement: `Spinner` wraps it in `role="status"`, and `Button`
 * pairs it with `aria-busy` and its own visually hidden label. Building the announcement into the
 * glyph would make a loading button say "Loading" twice.
 *
 * `data-un-allow-motion` exempts it from the reduced-motion backstop. A frozen spinner reads as a
 * hung interface, which is worse than a moving one; WCAG 2.3.3 targets non-essential animation and
 * a loading indicator is not that.
 */
export function SpinnerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" {...base} data-un-allow-motion="" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
