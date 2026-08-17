/**
 * The glass control material — one definition, every control that wears it.
 *
 * The design uses a single treatment for every raised control: the active nav tab, the year
 * select, the round Expand and nav buttons. All of them are the neutral veil at 10 % with the
 * gradient rim over it. They are not similar-looking controls that happen to agree — they are the
 * same material, and the moment it is written down three times it starts drifting three ways.
 *
 * Consumed by `Button`'s `glass` variant, `IconButton` through it, `SelectTrigger`, and
 * `TabsTrigger` when active. Anything else that needs to read as a raised control imports from
 * here rather than reaching for the fill and the rim separately.
 *
 * ### Why the variants are spelled out rather than composed
 *
 * Tailwind scans source text. A class assembled at runtime — `` `${prefix}:${cls}` ``, or a
 * `.split(' ').map()` over this string — is never seen by the scanner, so the rule is never
 * generated and the styling silently does nothing. Every string below is therefore a literal,
 * and the duplication between them is the price of that. Edit them together.
 *
 * ### What is deliberately NOT in here
 *
 * Shape and size. A tab is a 42 px pill, a menu trigger is field-height, an icon button is square
 * — the material is identical across all three and the geometry is not. Folding a height in would
 * make this un-reusable for the next control that needs the surface at another size.
 */

/**
 * Fill, rim, and how both respond to a pointer.
 *
 * The fill and the rim lift together on hover; lifting only one reads as a glitch rather than as
 * a response. `edge-stops-strong` is 10 % — bright enough to register, below the point where the
 * rim starts reading as a drawn outline.
 */
export const glassControl = [
  'u:glass-edge u:bg-control',
  'u:hover:bg-control-hover',
  'u:hover:[--un-edge-stops:var(--un-edge-stops-strong)]',
].join(' ')

/**
 * The same material, applied only while `data-state="active"`.
 *
 * For a control that is a SELECTION rather than a permanent surface — a nav tab is bare text
 * until it is the current destination. The hover lift is kept, so an active tab answers a pointer
 * exactly like a `glass` Button does.
 */
export const glassControlActive = [
  'u:data-[state=active]:glass-edge',
  'u:data-[state=active]:bg-control',
  'u:data-[state=active]:hover:bg-control-hover',
  'u:data-[state=active]:hover:[--un-edge-stops:var(--un-edge-stops-strong)]',
].join(' ')
