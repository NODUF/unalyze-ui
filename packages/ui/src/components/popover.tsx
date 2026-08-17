import * as RadixPopover from '@radix-ui/react-popover'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { overlayMotion, overlaySurface } from '../lib/overlay'

/* ------------------------------------------------------------------ *
 * Popover
 * ------------------------------------------------------------------ */

/**
 * Popover.
 *
 * `@derived` visual — the design has no popover. The behaviour is Radix's: it positions itself
 * against the viewport rather than trusting a fixed offset, closes on Escape and on outside
 * click, and returns focus to the trigger.
 *
 * ### Popover or Tooltip
 *
 * A popover holds **interactive** content and takes focus; a tooltip holds a short label and
 * never does. Putting a button inside a tooltip makes it unreachable by keyboard and untouchable
 * on a phone, because a tooltip has no open state either can enter.
 */
export const Popover = RadixPopover.Root
export const PopoverTrigger = RadixPopover.Trigger
export const PopoverAnchor = RadixPopover.Anchor
export const PopoverClose = RadixPopover.Close

export const PopoverContent = forwardRef<
  ElementRef<typeof RadixPopover.Content>,
  ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(function PopoverContent({ className, align = 'center', sideOffset = 8, ...props }, ref) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        data-un-component="popovercontent"
        className={cn(
          'un-popover u:z-(--un-z-popover) u:w-72 u:p-3',
          overlaySurface,
          overlayMotion,
          className,
        )}
        {...props}
      />
    </RadixPopover.Portal>
  )
})
PopoverContent.displayName = 'PopoverContent'

/* ------------------------------------------------------------------ *
 * Tooltip
 * ------------------------------------------------------------------ */

/**
 * The provider Radix requires around any tooltip.
 *
 * It owns the shared open/close timing — once one tooltip has opened, the next opens immediately
 * rather than waiting out the delay again, which is what makes scanning a toolbar feel responsive
 * instead of sticky. `UnalyzeProvider` mounts it, so most apps never touch this directly.
 */
export const TooltipProvider = RadixTooltip.Provider
export const Tooltip = RadixTooltip.Root
export const TooltipTrigger = RadixTooltip.Trigger

export interface TooltipContentProps
  extends ComponentPropsWithoutRef<typeof RadixTooltip.Content> {}

export const TooltipContent = forwardRef<
  ElementRef<typeof RadixTooltip.Content>,
  TooltipContentProps
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        ref={ref}
        sideOffset={sideOffset}
        data-un-component="tooltipcontent"
        className={cn(
          'un-tooltip u:z-(--un-z-tooltip) u:max-w-56 u:px-2.5 u:py-1.5',
          'u:font-display u:text-[length:var(--un-text-10)]',
          'un-glass-floating u:glass-edge u:rounded-md',
          overlayMotion,
          className,
        )}
        {...props}
      />
    </RadixTooltip.Portal>
  )
})
TooltipContent.displayName = 'TooltipContent'

/**
 * A tooltip in one element, for the common case.
 *
 * `asChild` on the trigger, so the tooltip attaches to whatever it wraps rather than adding a
 * wrapper element that would break a flex row.
 *
 * ⚠ The child must be **focusable**. A tooltip on a bare `<span>` or a disabled button is
 * invisible to keyboard and screen-reader users — which is the whole audience that needed the
 * explanation. Wrap a disabled control in a focusable element instead of removing the tooltip.
 */
export function TooltipTip({
  label,
  children,
  side,
  ...props
}: {
  label: ReactNode
  children: ReactNode
  side?: TooltipContentProps['side']
} & ComponentPropsWithoutRef<typeof RadixTooltip.Root>) {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
