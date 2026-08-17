import { forwardRef, type LabelHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Label.
 *
 * `@derived` — the design has no form label, so this borrows the uppercase eyebrow treatment it
 * uses above every KPI figure.
 *
 * A real `<label>`, always — never a styled `<span>`. The element is what gives a control its
 * accessible name and what makes clicking the text focus the field, and neither of those is
 * something a component can bolt on afterwards.
 */
export const labelVariants = cva(
  [
    'u:inline-flex u:items-center u:gap-1.5',
    'u:font-sans u:text-xs u:font-semibold u:uppercase u:tracking-[0.06em]',
    'u:text-muted-foreground',
    // Clicking a label focuses its control, so the cursor has to say so.
    'u:cursor-default',
    // Follows the control it labels: a disabled field's label must not read as available.
    'u:peer-disabled:opacity-(--un-opacity-disabled)',
  ],
  {
    variants: {
      size: {
        sm: 'u:text-[length:var(--un-text-10)]',
        md: 'u:text-xs',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type LabelVariantProps = VariantProps<typeof labelVariants>

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement>, LabelVariantProps {
  /**
   * Marks the field as required.
   *
   * Renders a glyph AND the word, because an asterisk alone is a convention rather than
   * information — screen readers announce it as "star" or skip it entirely. The control still
   * needs its own `required` attribute; this is the visible half.
   */
  required?: boolean
  /** The word announced beside the glyph. Comes from the caller so it can be localised. */
  requiredLabel?: string
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { size, required, requiredLabel = 'required', className, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      data-un-component="label"
      className={cn('un-label', labelVariants({ size }), className)}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className="u:text-negative">
            *
          </span>
          <span className="u:sr-only">{requiredLabel}</span>
        </>
      ) : null}
    </label>
  )
})

Label.displayName = 'Label'
