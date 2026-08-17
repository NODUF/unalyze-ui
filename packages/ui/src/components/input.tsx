import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

/**
 * Shared field surface.
 *
 * `@derived` — the design contains no input, textarea or select. This is built from the card
 * material so a field reads as the same substance as the panel around it; revisit it the moment
 * fields are drawn.
 *
 * An input in this design is the same material as a card, one step brighter: the translucent veil
 * plus the glass rim. That is why it is not a bordered box — a flat stroke here would be the only
 * drawn outline on the screen.
 */
export const fieldVariants = cva(
  [
    'u:relative u:w-full u:glass-edge',
    'u:bg-secondary u:text-foreground',
    'u:font-sans u:text-sm',
    'u:placeholder:text-muted-foreground',
    'u:transition-[background-color,box-shadow,opacity]',
    'u:duration-(--un-duration-fast) u:ease-(--un-ease-standard)',
    'u:hover:[--un-edge-stops:var(--un-edge-stops-strong)]',
    // Focus brightens the rim and adds the ring; it does not recolour the rim. The green belongs
    // to the focus ring, which is a system-wide indicator, not to the field's own material.
    // Never a removed outline (WCAG 2.4.7 / 2.4.11).
    'u:focus-visible:[--un-edge-stops:var(--un-edge-stops-strong)]',
    'u:focus-visible:outline-2 u:focus-visible:outline-ring u:focus-visible:outline-offset-2',
    'u:disabled:pointer-events-none u:disabled:opacity-(--un-opacity-disabled)',
    // `aria-invalid` drives the error look, so the visual and the announced state cannot disagree.
    'u:aria-invalid:[--un-edge-stops:var(--un-edge-stops-error)]',
  ],
  {
    variants: {
      size: {
        // Heights match Button so a field and a button sit level in a toolbar.
        sm: 'u:h-8 u:px-3 u:rounded-full',
        md: 'u:h-10 u:px-4 u:rounded-full',
        lg: 'u:h-12 u:px-5 u:rounded-full u:text-base',
      },
      /** Set when an icon or affix occupies one end, so the text does not run under it. */
      inset: {
        none: '',
        start: 'u:pl-10',
        end: 'u:pr-10',
        both: 'u:pl-10 u:pr-10',
      },
    },
    defaultVariants: { size: 'md', inset: 'none' },
  },
)

export type FieldVariantProps = VariantProps<typeof fieldVariants>

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    FieldVariantProps {
  /** Rendered ELEMENTS, not component references — a reference cannot cross the RSC boundary. */
  icon?: ReactNode
  iconTrailing?: ReactNode
  /**
   * Fixed-width digits, for a field holding a monetary amount.
   *
   * Worth setting on any numeric input: without it the caret jumps sideways as the user types,
   * because the glyphs have different widths.
   */
  numeric?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, inset, icon, iconTrailing, numeric, className, type = 'text', ...props },
  ref,
) {
  const resolvedInset = inset ?? (icon && iconTrailing ? 'both' : icon ? 'start' : iconTrailing ? 'end' : 'none')

  const field = (
    <input
      ref={ref}
      type={type}
      data-un-component="input"
      data-size={size ?? 'md'}
      className={cn(
        'un-input',
        fieldVariants({ size, inset: resolvedInset }),
        numeric && 'un-numeric',
        className,
      )}
      {...props}
    />
  )

  if (!icon && !iconTrailing) return field

  return (
    <span className="u:relative u:block u:w-full">
      {field}
      {icon ? <Affix side="start">{icon}</Affix> : null}
      {iconTrailing ? <Affix side="end">{iconTrailing}</Affix> : null}
    </span>
  )
})

Input.displayName = 'Input'

/**
 * A decorative icon pinned inside the field.
 *
 * `pointer-events-none` matters: without it the icon swallows clicks that should land on the
 * input, and the field stops focusing when a user aims at its left edge.
 */
function Affix({ side, children }: { side: 'start' | 'end'; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'u:pointer-events-none u:absolute u:top-1/2 u:-translate-y-1/2',
        'u:text-muted-foreground',
        side === 'start' ? 'u:left-4' : 'u:right-4',
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Textarea
 * ------------------------------------------------------------------ */

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Pick<FieldVariantProps, 'size'> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size, className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      data-un-component="textarea"
      className={cn(
        'un-textarea',
        fieldVariants({ size }),
        // A textarea is multi-line, so the pill shape and the fixed height from `size` are both
        // wrong for it. Panel radius and vertical padding instead.
        'u:h-auto u:rounded-lg u:py-3',
        // Horizontal resize breaks every layout it is dropped into; vertical is safe.
        'u:resize-y u:min-h-20',
        className,
      )}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'
