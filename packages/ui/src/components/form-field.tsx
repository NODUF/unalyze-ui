import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Label } from './label'
import { Text } from './text'

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode
  /**
   * Receives the ids and state the control must carry. Taking a function rather than plain
   * children is the whole point of this component: the wiring cannot be forgotten, because the
   * control cannot be rendered without receiving it.
   */
  children: (field: {
    id: string
    'aria-describedby': string | undefined
    'aria-invalid': boolean | undefined
    required: boolean | undefined
    disabled: boolean | undefined
  }) => ReactNode
  /** Guidance shown under the control. Hidden while an error is showing. */
  hint?: ReactNode
  /**
   * The error message. Its presence is what marks the control invalid — there is no separate
   * `invalid` flag to fall out of sync with it.
   */
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  requiredLabel?: string
}

/**
 * FormField.
 *
 * `@derived` — the design has no form. The accessibility wiring below is settled regardless; only
 * the spacing and the error presentation are open.
 *
 * Label, control, hint and error as one unit, with the accessibility wiring done once here
 * instead of by hand at every call site.
 *
 * That wiring is the reason this exists. A label needs `htmlFor` matching the control's `id`; a
 * hint and an error need their own ids collected into `aria-describedby`; an invalid control needs
 * `aria-invalid`. Each is easy, and each is skipped under deadline — and when it is skipped the
 * field looks perfect and is unusable with a screen reader.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { label, children, hint, error, required, disabled, requiredLabel, className, ...props },
  ref,
) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  // The hint is replaced by the error rather than stacked under it: two messages competing for
  // the same slot is how a user ends up reading the wrong one.
  const showHint = Boolean(hint) && !error
  const describedBy = [error ? errorId : null, showHint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div
      ref={ref}
      data-un-component="formfield"
      data-invalid={error ? true : undefined}
      className={cn('un-formfield u:flex u:flex-col u:gap-1.5', className)}
      {...props}
    >
      <Label htmlFor={id} required={required} requiredLabel={requiredLabel}>
        {label}
      </Label>

      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        required: required || undefined,
        disabled: disabled || undefined,
      })}

      {showHint ? (
        <Text id={hintId} variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}

      {error ? (
        /*
          `role="alert"` so the message is announced when it appears, not only when the control is
          next focused — a form that fails validation on submit is exactly the case where nobody
          returns focus to the field.
        */
        <Text id={errorId} role="alert" variant="caption" tone="negative">
          {error}
        </Text>
      ) : null}
    </div>
  )
})

FormField.displayName = 'FormField'
