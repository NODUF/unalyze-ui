/**
 * Shared styling for everything that floats above the page.
 *
 * Dialog, Popover, Tooltip, Select and DropdownMenu are five different behaviours wearing one
 * material. Keeping the class strings here rather than repeating them per component is what stops
 * a dropdown and a popover slowly diverging into two slightly different panels.
 *
 * ### A floating panel is the same glass as a card
 *
 * This was wrong at first, and the reasoning is worth keeping. Overlays were made OPAQUE on the
 * grounds that a translucent menu shows the chart behind it through the text you are reading —
 * which is true, and would matter if the panel had no `backdrop-filter`. It does. Blur is exactly
 * the thing that turns whatever is behind into an unreadable wash while the panel stays glass.
 *
 * The design settles it: the MODAL POPUP panel is `#000000 @0.7` and `#AEAEAE @0.05` as two
 * stacked fills, the gradient rim, `BACKGROUND_BLUR 20`, and the same paired inner shadows a card
 * carries. Readability comes from the black backing under the veil, not from giving up the glass.
 */

/** The floating panel itself. */
export const overlaySurface = [
  // `un-glass-floating` is the card material plus that black backing; see styles.css.
  'un-glass-floating u:glass-edge',
  // `rounded-md` (12px), NOT `rounded-lg`. `rounded-lg` is the 32px PANEL radius the design uses
  // on cards and the KPI strip; on a 180px-wide dropdown it reads as a speech bubble.
  'u:rounded-md',
  // Radix measures the trigger and publishes these; without them a long menu overflows the
  // viewport instead of scrolling inside itself.
  'u:max-h-(--radix-popper-available-height) u:overflow-y-auto',
].join(' ')

/**
 * Enter and exit animation, driven by Radix's own `data-state` and `data-side` attributes.
 *
 * A plain class rather than utilities: the usual `animate-in` / `zoom-in-95` set comes from
 * `tailwindcss-animate`, and adding a dependency to a package that lands in someone else's
 * bundle — for four keyframes — is not a trade worth making. The rules live in `styles.css`.
 *
 * Transform and opacity only. Animating `top` or `height` relayouts the page every frame, and an
 * overlay that animates during a scroll is the most expensive thing on the screen.
 */
export const overlayMotion = 'un-overlay-anim'

/** A row inside a menu or a select. */
export const overlayItem = [
  'u:relative u:flex u:cursor-default u:select-none u:items-center u:gap-2',
  // `rounded-sm` is 8px — 4px inside the panel's 12px, which keeps a highlighted row concentric
  // with the panel around it rather than cutting across its corner.
  'u:rounded-sm u:px-2.5 u:py-1.5 u:outline-none',
  'u:font-display u:text-sm u:text-foreground',
  /*
   * The highlight is NEUTRAL, not the brand green.
   *
   * `accent` is a green wash, and green in this product means profit. A menu row that turns green
   * under the cursor is claiming something about the row. The highlight has one job — say where
   * you are — so it uses the same white veil every other raised surface uses.
   *
   * `data-highlighted` rather than `:hover` because Radix sets it for the keyboard too; a hover
   * rule alone leaves a keyboard user with no visible position in the list.
   */
  'u:data-[highlighted]:bg-secondary',
  'u:data-[disabled]:pointer-events-none u:data-[disabled]:opacity-(--un-opacity-disabled)',
  'u:transition-colors u:duration-(--un-duration-instant)',
].join(' ')

/** A non-interactive heading inside a menu. */
export const overlayLabel =
  'u:px-2.5 u:pb-1 u:pt-1.5 u:font-display u:text-[length:var(--un-text-10)] u:font-semibold u:uppercase u:tracking-[0.06em] u:text-muted-foreground'

/** A rule between groups of items. */
export const overlaySeparator = 'u:-mx-1 u:my-1 u:h-px u:bg-border'

/** The scrim behind a modal surface. */
export const overlayScrim = 'un-scrim u:fixed u:inset-0 u:bg-overlay-scrim'
