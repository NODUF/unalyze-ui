import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import * as RadixSelect from '@radix-ui/react-select'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '../lib/cn'
import {
  overlayItem,
  overlayLabel,
  overlayMotion,
  overlaySeparator,
  overlaySurface,
} from '../lib/overlay'
import { CheckIcon, ChevronDownIcon } from '../lib/icons'
import { glassControl } from '../lib/material'
import { fieldVariants, type FieldVariantProps } from './input'

/* ------------------------------------------------------------------ *
 * DropdownMenu
 * ------------------------------------------------------------------ */

/**
 * DropdownMenu.
 *
 * `@derived` visual — the design has no open menu anywhere, only the closed `2026 ⌄` control in
 * the Trading Report. The behaviour is Radix's, and it is why this is not a list of buttons:
 * arrow keys move between items, typing jumps to a matching one, Escape closes and returns focus,
 * and the menu flips or shifts to stay inside the viewport.
 *
 * A menu is for **actions**. A control that picks a value is a `Select` — they look alike and
 * are announced completely differently.
 */
export const DropdownMenu = RadixMenu.Root
export const DropdownMenuTrigger = RadixMenu.Trigger
export const DropdownMenuGroup = RadixMenu.Group

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof RadixMenu.Content>,
  ComponentPropsWithoutRef<typeof RadixMenu.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        ref={ref}
        sideOffset={sideOffset}
        data-un-component="dropdownmenucontent"
        className={cn(
          'un-menu u:z-(--un-z-popover) u:min-w-44 u:p-1.5',
          overlaySurface,
          overlayMotion,
          className,
        )}
        {...props}
      />
    </RadixMenu.Portal>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof RadixMenu.Item>,
  ComponentPropsWithoutRef<typeof RadixMenu.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <RadixMenu.Item
      ref={ref}
      data-un-component="dropdownmenuitem"
      className={cn(
        overlayItem,
        // Tints the row with the loss red rather than filling it: a solid red row inside a menu
        // reads as already-destroyed rather than as a destructive option. `destructive-20-hover`
        // is the shadcn collection's own token for this — and unlike a `color-mix` it cannot
        // degrade to an opaque red on a browser without color-mix support.
        destructive &&
          'u:text-destructive u:data-[highlighted]:bg-destructive-20-hover u:data-[highlighted]:text-destructive',
        className,
      )}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof RadixMenu.Label>,
  ComponentPropsWithoutRef<typeof RadixMenu.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return <RadixMenu.Label ref={ref} className={cn(overlayLabel, className)} {...props} />
})
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof RadixMenu.Separator>,
  ComponentPropsWithoutRef<typeof RadixMenu.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <RadixMenu.Separator ref={ref} className={cn(overlaySeparator, className)} {...props} />
})
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

/* ------------------------------------------------------------------ *
 * Select
 * ------------------------------------------------------------------ */

/**
 * Select.
 *
 * `@derived` visual — only the closed `2026 ⌄` control exists in the design.
 *
 * Radix rather than a native `<select>`: a native one cannot be styled to match this material on
 * any browser, and its dropdown is drawn by the operating system. What Radix gives back is the
 * behaviour a native select has for free — typeahead, arrow keys, the value announced as a
 * listbox — which is precisely what hand-rolled selects lose.
 */
export const Select = RadixSelect.Root
export const SelectGroup = RadixSelect.Group
export const SelectValue = RadixSelect.Value

export interface SelectTriggerProps
  extends ComponentPropsWithoutRef<typeof RadixSelect.Trigger>,
    Pick<FieldVariantProps, 'size'> {}

export const SelectTrigger = forwardRef<
  ElementRef<typeof RadixSelect.Trigger>,
  SelectTriggerProps
>(function SelectTrigger({ className, size, children, ...props }, ref) {
  return (
    <RadixSelect.Trigger
      ref={ref}
      data-un-component="selecttrigger"
      className={cn(
        'un-select',
        // Geometry from the field scale so a select lines up with an input beside it; MATERIAL
        // from the shared glass control, because in the design the year select and the active nav
        // tab are the same surface. A select is a control you press, not a box you type in.
        fieldVariants({ size }),
        glassControl,
        'u:inline-flex u:items-center u:justify-between u:gap-2',
        // Radix marks the trigger while its own placeholder is showing, which is the only way to
        // grey a placeholder without inspecting the value in React.
        'u:data-[placeholder]:text-muted-foreground',
        // Open holds the hovered look, so the trigger does not appear to drop back to rest the
        // moment the pointer moves onto the menu it just opened.
        'u:data-[state=open]:bg-control-hover',
        'u:data-[state=open]:[--un-edge-stops:var(--un-edge-stops-strong)]',
        className,
      )}
      {...props}
    >
      {children}
      <RadixSelect.Icon asChild>
        <ChevronDownIcon className="u:size-4 u:shrink-0 u:opacity-60" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = forwardRef<
  ElementRef<typeof RadixSelect.Content>,
  ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(function SelectContent({ className, position = 'popper', children, ...props }, ref) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        ref={ref}
        position={position}
        sideOffset={6}
        data-un-component="selectcontent"
        className={cn(
          'un-select-content u:z-(--un-z-popover) u:min-w-(--radix-select-trigger-width) u:p-1.5',
          overlaySurface,
          overlayMotion,
          className,
        )}
        {...props}
      >
        {/* `children` is destructured out above on purpose: leaving it in the spread would set it
            twice — once through the spread and once as JSX children — and which one survives is a
            React implementation detail rather than something to rely on. */}
        <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
})
SelectContent.displayName = 'SelectContent'

export const SelectItem = forwardRef<
  ElementRef<typeof RadixSelect.Item>,
  ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <RadixSelect.Item
      ref={ref}
      data-un-component="selectitem"
      className={cn(overlayItem, 'u:pr-8', className)}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <span className="u:absolute u:right-2.5 u:grid u:place-items-center">
        <RadixSelect.ItemIndicator>
          <CheckIcon className="u:size-3 u:text-accent-foreground" />
        </RadixSelect.ItemIndicator>
      </span>
    </RadixSelect.Item>
  )
})
SelectItem.displayName = 'SelectItem'

export const SelectLabel = forwardRef<
  ElementRef<typeof RadixSelect.Label>,
  ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return <RadixSelect.Label ref={ref} className={cn(overlayLabel, className)} {...props} />
})
SelectLabel.displayName = 'SelectLabel'

export const SelectSeparator = forwardRef<
  ElementRef<typeof RadixSelect.Separator>,
  ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return <RadixSelect.Separator ref={ref} className={cn(overlaySeparator, className)} {...props} />
})
SelectSeparator.displayName = 'SelectSeparator'


