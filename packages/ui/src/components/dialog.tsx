import * as RadixDialog from '@radix-ui/react-dialog'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { overlayMotion, overlayScrim } from '../lib/overlay'
import { useUnalyze } from '../provider'
import { IconButton } from './icon-button'
import { CloseIcon } from '../lib/icons'
import { Text } from './text'

/**
 * Dialog.
 *
 * `@derived` visual — the design's `MODAL POPUP` is a shell with placeholder copy, so the header
 * geometry and the body treatment are open. The **behaviour** is settled regardless, and it is
 * the reason this wraps Radix rather than a `<div>`: focus moves into the dialog on open and
 * returns to the trigger on close, Tab is trapped inside, Escape closes, the page behind is
 * inert, and scroll is locked without the layout shifting. Writing that by hand is a week of
 * work and it is never finished.
 *
 * `DialogTitle` is REQUIRED by Radix — without one the dialog has no accessible name and Radix
 * warns in development. Use `VisuallyHidden` around it if the design has no visible heading.
 */
export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close
export const DialogPortal = RadixDialog.Portal

export const DialogOverlay = forwardRef<
  ElementRef<typeof RadixDialog.Overlay>,
  ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <RadixDialog.Overlay
      ref={ref}
      data-un-component="dialogoverlay"
      className={cn('un-dialog-overlay', overlayScrim, 'u:z-(--un-z-overlay)', className)}
      {...props}
    />
  )
})
DialogOverlay.displayName = 'DialogOverlay'

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Hides the built-in close button, for a dialog that must be resolved by its own actions. */
  hideClose?: boolean
  closeLabel?: string
}

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(function DialogContent({ className, children, hideClose, closeLabel, ...props }, ref) {
  const { strings } = useUnalyze()

  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        ref={ref}
        data-un-component="dialogcontent"
        className={cn(
          'un-dialog u:fixed u:left-1/2 u:top-1/2 u:z-(--un-z-modal)',
          'u:-translate-x-1/2 u:-translate-y-1/2',
          'u:w-full u:max-w-[calc(100vw-2rem)] u:sm:max-w-lg',
          // The dialog can outgrow the viewport on a phone; it scrolls inside itself rather than
          // pushing the locked page.
          'u:max-h-[calc(100dvh-2rem)] u:overflow-y-auto',
          // The same glass as a card, with the black backing that keeps it readable over content.
          'un-glass-floating u:glass-edge',
          'u:rounded-lg u:p-6',
          overlayMotion,
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose ? (
          /*
            `asChild` so the close is the real IconButton rather than a second, nearly-identical
            button living here. Radix keeps the dismiss behaviour; the component keeps the
            variants, the sizes and the required accessible name.
          */
          <RadixDialog.Close asChild>
            <IconButton
              variant="ghost"
              size="sm"
              label={closeLabel ?? strings.close}
              icon={<CloseIcon />}
              className="u:absolute u:right-4 u:top-4"
            />
          </RadixDialog.Close>
        ) : null}
      </RadixDialog.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = 'DialogContent'

export function DialogHeader({ className, ...props }: { className?: string; children?: ReactNode }) {
  return <div className={cn('u:mb-4 u:flex u:flex-col u:gap-1.5 u:pr-8', className)} {...props} />
}

export function DialogFooter({ className, ...props }: { className?: string; children?: ReactNode }) {
  return (
    <div
      className={cn(
        // Reversed on mobile so the confirming action sits under the thumb, and the destructive
        // one is not the first thing a stretched thumb lands on.
        'u:mt-6 u:flex u:flex-col-reverse u:gap-2 u:sm:flex-row u:sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

export const DialogTitle = forwardRef<
  ElementRef<typeof RadixDialog.Title>,
  ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <RadixDialog.Title ref={ref} asChild>
      <Text as="h2" variant="title" className={cn('un-dialog-title', className)} {...props} />
    </RadixDialog.Title>
  )
})
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<
  ElementRef<typeof RadixDialog.Description>,
  ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <RadixDialog.Description ref={ref} asChild>
      <Text variant="body" tone="muted" className={cn('un-dialog-description', className)} {...props} />
    </RadixDialog.Description>
  )
})
DialogDescription.displayName = 'DialogDescription'
