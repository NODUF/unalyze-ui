import * as RadixTabs from '@radix-ui/react-tabs'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import { LockIcon } from '../lib/icons'
import { glassControlActive } from '../lib/material'
import { cn } from '../lib/cn'

/**
 * Tabs.
 *
 * The top navigation in the design — **Dashboard / Úspěchy / Komunita** — is this pattern: an
 * active pill, inactive labels beside it, and one destination locked.
 *
 * Radix owns the keyboard contract, which is the part that is always wrong when tabs are built
 * from buttons: arrow keys move between tabs while Tab moves *past* the whole set into the panel,
 * and only the active tab is in the tab order. A row of plain buttons makes a keyboard user press
 * Tab once per destination to get past the navigation.
 */
export const Tabs = RadixTabs.Root

export const TabsList = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <RadixTabs.List
      ref={ref}
      data-un-component="tabslist"
      className={cn('un-tabs-list u:inline-flex u:items-center u:gap-1', className)}
      {...props}
    />
  )
})
TabsList.displayName = 'TabsList'

export interface TabsTriggerProps extends ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {
  /**
   * A destination that exists but is not available yet — Komunita in the design.
   *
   * Rendered as `disabled` with an explanatory label rather than hidden, because a locked
   * destination that is visible tells a user the product has more to it. `aria-disabled` is not
   * enough on its own; Radix skips genuinely disabled tabs in arrow-key navigation, which is the
   * behaviour a locked tab wants.
   */
  locked?: boolean
  lockedLabel?: string
  icon?: ReactNode
}

export const TabsTrigger = forwardRef<ElementRef<typeof RadixTabs.Trigger>, TabsTriggerProps>(
  function TabsTrigger({ className, children, locked, lockedLabel, icon, disabled, ...props }, ref) {
    return (
      <RadixTabs.Trigger
        ref={ref}
        disabled={disabled || locked}
        data-locked={locked || undefined}
        data-un-component="tabstrigger"
        className={cn(
          'un-tab u:inline-flex u:items-center u:gap-1.5',
          // 42px tall with 22px of horizontal padding, read off the design's Dashboard tab.
          'u:h-[42px] u:rounded-full u:px-[22px]',
          'u:font-display u:text-sm u:font-medium u:whitespace-nowrap',
          'u:transition-[background-color,color,opacity] u:duration-(--un-duration-fast)',
          'u:focus-visible:outline-2 u:focus-visible:outline-ring u:focus-visible:outline-offset-2',
          /*
           * INACTIVE: pure white at 50 %, and nothing else. No fill, no rim, no border.
           *
           * The three together are what turn a clean row of labels into a row of boxes, and it is
           * the single thing that made this look wrong. `text-white`, not `text-foreground` —
           * the design uses true #FFFFFF here, not the slightly warm #FAF8F8.
           */
          'u:text-white/50 u:hover:text-white/80',
          /*
           * ACTIVE: the shared glass control material — the same surface as a `glass` Button and
           * the year select, hover included, because they are one material rather than three
           * that happen to agree.
           *
           * Applied through a variant prefix on each class, since cva composes strings rather
           * than nesting selectors.
           */
          glassControlActive,
          'u:data-[state=active]:text-white',
          /*
           * LOCKED: exactly the inactive treatment, dimmed as a whole.
           *
           * Dimming the element rather than the text takes the lock glyph with it, which is the
           * point — a bright padlock on faded text reads as an error rather than as "not yet".
           *
           * 50 %, not the 20 % tried first: the inactive label is already white at 50 %, so
           * stacking another 20 % on top left it at 10 % of white and effectively unreadable. A
           * locked destination has to stay legible — it is advertising that the product has more
           * to it.
           */
          'u:disabled:pointer-events-none u:disabled:opacity-(--un-opacity-disabled)',
          'u:data-[locked]:opacity-50',
          className,
        )}
        {...props}
      >
        {icon ? (
          <span aria-hidden="true" className="u:contents">
            {icon}
          </span>
        ) : null}
        {children}
        {locked ? (
          <>
            <LockIcon className="u:size-3.5 u:opacity-70" />
            {/* The lock is decorative; the reason has to be readable, not inferred from a glyph. */}
            {lockedLabel ? <span className="u:sr-only">{lockedLabel}</span> : null}
          </>
        ) : null}
      </RadixTabs.Trigger>
    )
  },
)
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <RadixTabs.Content
      ref={ref}
      data-un-component="tabscontent"
      className={cn(
        'un-tabs-content',
        'u:focus-visible:outline-2 u:focus-visible:outline-ring u:focus-visible:outline-offset-2',
        className,
      )}
      {...props}
    />
  )
})
TabsContent.displayName = 'TabsContent'

