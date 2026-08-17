/**
 * The semantic layer — HAND AUTHORED.
 *
 * Figma owns the primitives and the shadcn/ui role vocabulary. This file owns everything Figma
 * Variables structurally cannot hold: shadows, easing curves, durations, stacking order, and the
 * financial-data colour grammar. It is the one place where the two halves meet.
 *
 * Rules for editing this file:
 *
 * - Colour values come from `palette`, never from a literal hex. A literal here is a colour that
 *   no longer exists in Figma, and nobody will notice until it looks wrong.
 * - Every addition needs a comment saying why Figma cannot express it. If Figma *can* express it,
 *   it belongs in Figma.
 */

import { figmaSemantic } from '../generated/figma-semantic'
import { brand, contract, cssScales, palette } from '../generated/primitives'

export type ThemeName = keyof typeof figmaSemantic

/* ------------------------------------------------------------------ *
 * Financial-data grammar
 *
 * Not in Figma because these are not UI chrome — they are the meaning of a number, and the
 * shadcn/ui collection has no vocabulary for it. `destructive` is a *button* that deletes
 * something; `negative` is a loss. Conflating them is how a delete button ends up the same red
 * as a losing trade.
 *
 * Colour is never the only channel: `<ProfitLossValue>` (phase 5) always pairs these with a sign
 * and a glyph, so the values survive greyscale and colour-vision deficiency.
 * ------------------------------------------------------------------ */

const dataColors: Record<ThemeName, Record<string, string>> = {
  dark: {
    // Straight from the design. `positive` resolves to the same hex as `primary` today and stays
    // a separate token anyway: the moment they merge, the CVD-safe palette and the light theme
    // lose any way to diverge a losing trade from a dangerous button.
    positive: brand['green-500'],
    negative: brand['loss-500'],
    'neutral-value': brand['content-muted'],
    warning: brand['warning-500'],
    info: brand['info-500'],
    /**
     * Notification red — an unread count, never a monetary value.
     *
     * A distinct token from `negative` and from `destructive` even though all three are red: one
     * means "there is something unread", one means "you lost money", one means "this button
     * deletes". A badge that borrows the loss colour turns an unread count into a financial
     * warning at a glance.
     */
    alert: brand['alert-500'],
  },
}

/* ------------------------------------------------------------------ *
 * Categorical chart ramp
 *
 * Deliberately contains NO green and NO red. Those two hues are reserved for profit and loss
 * throughout the product; a categorical series painted green would read as "this series is
 * winning". Six hues is the practical ceiling before adjacent series stop being separable.
 * ------------------------------------------------------------------ */

const chartRamp: Record<ThemeName, Record<string, string>> = {
  dark: {
    // The first four are the design's own chart hues: blue carries equity/balance, violet and
    // magenta are the two halves of the daily P&L bars. The last two extend the ramp for series
    // the design has not needed yet, chosen to stay separable from the first four.
    'chart-1': brand['info-500'],
    'chart-2': brand['chart-violet-600'],
    'chart-3': brand['chart-magenta-400'],
    'chart-4': brand['chart-violet-400'],
    'chart-5': palette['cyan-400'],
    'chart-6': palette['amber-400'],
  },
}

const chartChrome: Record<ThemeName, Record<string, string>> = {
  dark: {
    // The design's chart grid is a faint wash of the foreground white, not a grey — which is
    // what keeps it reading as "behind the data" on pure black.
    'chart-grid': 'rgb(250 248 248 / 0.08)',
    'chart-axis': brand['content-subtle'],
    // The zero crossing is the most important pixel on a cumulative-P&L chart. It gets its own
    // token so it can never be rendered as just another grid line.
    'chart-zero-line': 'rgb(250 248 248 / 0.22)',
  },
}

/* ------------------------------------------------------------------ *
 * Elevation and scrim
 *
 * Figma Variables cannot hold a shadow — Figma models shadows as effect styles, which the
 * variables export does not carry. Composite values therefore have to live here.
 * ------------------------------------------------------------------ */

const elevation: Record<ThemeName, Record<string, string>> = {
  dark: {
    // On a dark canvas a drop shadow is nearly invisible, so depth is carried by a 1px inset
    // top highlight — light catching the upper lip of the surface — with only a token shadow
    // underneath to seat it.
    'elevation-flat': '0 1px 2px 0 rgb(0 0 0 / 0.40)',
    'elevation-raised':
      'inset 0 1px 0 0 rgb(255 255 255 / 0.06), 0 2px 6px -1px rgb(0 0 0 / 0.50)',
    'elevation-overlay':
      'inset 0 1px 0 0 rgb(255 255 255 / 0.08), 0 12px 28px -6px rgb(0 0 0 / 0.60)',
    /**
     * The card's inner light, read exactly off the design: TWO inner shadows on opposing
     * diagonals, white at 2 %, 8 px offset, 20 px blur.
     *
     * Two and not one is the whole point — a single inset shadow lights one corner and reads as
     * a dent. A matched pair lights both, which reads as a pane thick enough to catch light
     * along its inside faces. At 2 % it is almost subliminal, and that is deliberate: it is felt
     * as thickness rather than seen as a shadow.
     */
    'elevation-inset':
      'inset 8px 8px 20px rgb(255 255 255 / 0.02), inset -8px -8px 20px rgb(255 255 255 / 0.02)',
    'overlay-scrim': 'rgb(0 0 0 / 0.68)',
  },
}

/* ------------------------------------------------------------------ *
 * Material
 *
 * The design's panels are not boxes — they are a translucent veil over black with a light rim
 * raking across the top edge. `#FFFFFF → transparent` is the second most-used value in the whole
 * file (57 layers), which makes the rim a system-level material rather than a card decoration.
 *
 * Figma cannot hold a gradient in a variable, so these live here by necessity, not by preference.
 * ------------------------------------------------------------------ */

const material: Record<ThemeName, Record<string, string>> = {
  dark: {
    /**
     * The glass rim, read exactly off the design: a 1 px INSIDE stroke painted with
     * `linear-gradient(180deg, #FFF 0%, transparent 100%)` at 5 % paint opacity. 57 layers
     * carry it — cards, the KPI strip, and the round Expand and nav buttons.
     *
     * Top-down, and that is the whole illusion: light catches the upper lip of a pane and dies
     * before the bottom. A rim of even brightness all the way round reads as a drawn outline.
     *
     * Consumed by the `glass-edge` utility, which masks it to a 1 px ring.
     */
    'edge-stops': 'rgb(255 255 255 / 0.05), rgb(255 255 255 / 0)',
    /**
     * Hover. DERIVED — the design has no hover state anywhere.
     *
     * 16 % was tried first and reads as a drawn outline rather than as light: on a small pill the
     * rim wraps the whole shape, so any value bright enough to notice is bright enough to look
     * like a border. 10 % lifts without outlining.
     */
    'edge-stops-strong': 'rgb(255 255 255 / 0.10), rgb(255 255 255 / 0)',
    'edge-stops-accent': 'rgb(91 253 139 / 0.28), rgb(91 253 139 / 0)',
    /** An invalid field. Drives `aria-invalid` styling, so the look cannot outlive the state. */
    'edge-stops-error': 'rgb(217 83 75 / 0.55), rgb(217 83 75 / 0.06)',
    /** Angle is a property of the material, not of the theme, so both themes share it. */
    'edge-angle': '180deg',
    /**
     * The scoped emphasis wash — the green haze on the Unalyze Score card. Read from the design's
     * own gradient. Budget: at most one emphasised surface per viewport, or the emphasis stops
     * meaning anything.
     */
    'emphasis-wash':
      'radial-gradient(120% 108% at 0% 0%, rgb(124 242 166 / 0.42) 0%, rgb(47 211 107 / 0.14) 55%, rgb(47 211 107 / 0) 100%)',
    'emphasis-wash-negative':
      'radial-gradient(120% 108% at 0% 0%, rgb(217 83 75 / 0.30) 0%, rgb(217 83 75 / 0) 62%)',
    /** Area fills under a chart line. Both fade to fully transparent, never to a flat colour. */
    'chart-area-from': 'rgb(91 253 139 / 0.28)',
    'chart-area-to': 'rgb(91 253 139 / 0)',
    /**
     * Card tints — a second fill stacked over the base at 5 %.
     *
     * The design tints each chart card with the hue of the series it plots: the Unalyze Score
     * card green, Equity blue, Daily P&L violet. It ties a card to its data without colouring
     * anything the reader has to interpret as a value.
     */
    /**
     * The fill of a RAISED CONTROL — the active nav tab, the year select, the round Expand and
     * nav buttons. All four are `#AEAEAE @0.1` in the design; a card is the same grey at 5 %.
     *
     * Stored with the alpha already baked in rather than composed at the call site with
     * `color-mix`. Tailwind emits a solid-colour fallback ahead of every `color-mix` value for
     * browsers that lack it, and that fallback here is fully opaque `#AEAEAE` — a control that
     * degrades from a 10 % veil to a solid grey slab. A literal token cannot fail that way.
     */
    control: 'rgb(174 174 174 / 0.1)',
    /**
     * The same control, hovered. DERIVED — the design shows no hover state anywhere.
     *
     * Chosen so the lift is felt rather than read: much more and a hovered control looks
     * selected, which matters here because an active nav tab uses this exact fill at rest.
     */
    'control-hover': 'rgb(174 174 174 / 0.16)',
    /**
     * The fill of a FLOATING panel — a dropdown, a select menu, a dialog, a tooltip.
     *
     * Opaque, and that is a product decision rather than a reading of the design. The design's
     * modal is translucent over a backdrop blur; a menu built that way needs the blur to stay
     * readable, and a blur is the most expensive thing on a page — it forces a compositing layer,
     * repaints whenever anything behind it moves, and is a preference users and enterprise
     * policies switch off. Translucency and blur are one decision, so dropping the blur means
     * dropping the translucency with it.
     *
     * The value is not a guess: it is the design's own stack composited over the canvas — black
     * at 70 % over black, with the #AEAEAE veil at 5 % above it. A panel therefore looks
     * identical to the design over the page, and differs only in not picking up colour from
     * whatever happens to be behind it.
     *
     * Cards keep the translucent treatment. They sit on the canvas rather than over arbitrary
     * content, so they stay readable with or without the blur.
     */
    'surface-floating': '#0a0a0a',
    'tint-brand': 'rgb(91 253 139 / 0.05)',
    'tint-info': 'rgb(50 136 255 / 0.05)',
    'tint-chart': 'rgb(156 50 255 / 0.05)',
  },
}

/* ------------------------------------------------------------------ *
 * Motion
 *
 * Figma has no variable type for a duration or a cubic-bezier. Every animation in the library
 * reads these, which is what lets the whole system slow down or stop from one place.
 * ------------------------------------------------------------------ */

const motion = {
  'duration-instant': '80ms',
  'duration-fast': '140ms',
  'duration-base': '220ms',
  'duration-slow': '360ms',
  'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-decelerate': 'cubic-bezier(0, 0, 0, 1)',
  'ease-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
  'ease-emphasized': 'cubic-bezier(0.2, 0, 0, 1.2)',
} as const

/* ------------------------------------------------------------------ *
 * Stacking order
 *
 * Explicit, because the package renders portals (dialog, popover, tooltip) into the consumer's
 * DOM. Without a published scale their app has no way to know what it may safely sit above.
 * ------------------------------------------------------------------ */

const zIndex = {
  'z-base': '0',
  'z-sticky': '100',
  'z-drawer': '200',
  'z-overlay': '300',
  'z-modal': '400',
  'z-popover': '500',
  'z-toast': '600',
  'z-tooltip': '700',
} as const

/* ------------------------------------------------------------------ *
 * Interaction and sizing constants
 * ------------------------------------------------------------------ */

const interaction = {
  /**
   * Backdrop blur on a glass surface. 20 px, straight from the design.
   *
   * It earns its keep here specifically because the design floats large, heavily blurred coloured
   * ellipses behind the cards — that ambient light is what the blur samples. On a flat black
   * canvas with nothing behind it, `backdrop-filter` would sample black, change nothing visible,
   * and still cost a compositing layer. Do not apply it to surfaces with no ambient behind them.
   */
  'glass-blur': '20px',
  /**
   * The scrim's own blur. Weaker than a panel's, and read from the design: the modal's backdrop
   * carries `BACKGROUND_BLUR 8` as well as its 70 % black, so the page behind softens rather than
   * merely darkening.
   */
  'glass-blur-scrim': '8px',
  'focus-ring-width': '2px',
  'focus-ring-offset': '2px',
  // WCAG 2.5.8 / 2.5.5. Enforced by the token rather than remembered per component.
  'touch-target-min': '44px',
  'icon-sm': '16px',
  'icon-md': '20px',
  'icon-lg': '24px',
} as const

/* ------------------------------------------------------------------ *
 * Typeface slots
 *
 * The package bundles NO font files. Nohemi is licence-restricted and must never be committed,
 * and shipping any face would force it on a consumer who has their own. These are slots: the
 * consuming app sets `--un-font-display` / `--un-font-sans` and everything follows.
 * ------------------------------------------------------------------ */

const fontStacks = {
  // Nohemi, everywhere. The product is single-face.
  //
  // The imported frames still show Montserrat in about 54 text runs, but those are leftovers from
  // the application the design was captured out of, not design intent — which is also why the
  // restyled parts (186 runs) are all Nohemi.
  'font-sans': `${cssScales['font-sans']}, ui-sans-serif, system-ui, -apple-system, sans-serif`,
  'font-serif': `${cssScales['font-serif']}, ui-serif, Georgia, serif`,
  'font-mono': `${cssScales['font-mono']}, ui-monospace, SFMono-Regular, Menlo, monospace`,
  // A separate slot from `font-sans` even though both resolve to Nohemi today, so a second face
  // can arrive later without touching every component. Nohemi is licence-restricted and is NEVER
  // bundled; this names a face, it does not ship one.
  'font-display': `${cssScales['font-display']}, var(--un-font-sans)`,
} as const

/* ------------------------------------------------------------------ *
 * Type pairing
 *
 * Figma stores font sizes and line heights as two unrelated lists; there is no variable type
 * that says "14px text defaults to 20px leading". Without this table `text-sm` sets a size and
 * inherits whatever line height happens to be in scope, which is how a paragraph ends up with
 * heading leading.
 *
 * Above 4xl the ratio stops working — display type wants to be tight — so those collapse to 1.
 * ------------------------------------------------------------------ */

export const textLeading: Record<string, string> = {
  'text-10': 'var(--un-leading-15)',
  'text-11': 'var(--un-leading-4)',
  'text-xs': 'var(--un-leading-4)',
  'text-13': 'var(--un-leading-5)',
  'text-sm': 'var(--un-leading-5)',
  'text-15': 'var(--un-leading-22)',
  'text-base': 'var(--un-leading-6)',
  'text-lg': 'var(--un-leading-7)',
  'text-xl': 'var(--un-leading-7)',
  'text-21': 'var(--un-leading-8)',
  'text-2xl': 'var(--un-leading-8)',
  'text-28': 'var(--un-leading-9)',
  'text-3xl': 'var(--un-leading-9)',
  'text-4xl': 'var(--un-leading-10)',
  'text-5xl': '1',
  'text-6xl': '1',
  'text-7xl': '1',
  'text-8xl': '1',
  'text-9xl': '1',
}

/* ------------------------------------------------------------------ *
 * The type roles
 *
 * Read off the Dashboard design: 23 distinct text styles, collapsed to the ten roles they
 * actually serve. Figma has no variable type that can bind a family, a size, a weight and a
 * tracking together as one thing, so the pairing lives here.
 *
 * ### One face
 *
 * Nohemi throughout — the product is single-face, and both the `sans` and `display` slots resolve
 * to it. The roles therefore differ by size, weight and tracking only.
 *
 * (Two other families appear in the imported frames: Montserrat in ~54 runs, left over from the
 * application the design was captured out of, and Inter in 13, all inside chart internals. Neither
 * is design intent and neither is represented here.)
 *
 * ⚠ **Nohemi may not carry tabular figures.** A column of P&L values whose digits change will then
 * shift width on every update. `Text`'s `numeric` prop still asks for them — the request is a
 * no-op on a face that lacks the feature, and it costs nothing to have it in place. Worth
 * confirming against the real font files before launch.
 * ------------------------------------------------------------------ */

export interface TypeRole {
  family: 'display' | 'sans'
  size: string
  weight: number
  tracking?: string
  uppercase?: boolean
  /** Where this role appears in the design, so a reader can check the mapping against the file. */
  usage: string
}

export const typeRoles: Record<string, TypeRole> = {
  /** The Unalyze Score figure. One per screen. */
  display: { family: 'display', size: 'text-4xl', weight: 400, tracking: '0.01em', usage: 'the 42 un score' },
  /** Monthly and yearly totals in the Trading Report. */
  'value-xl': { family: 'display', size: 'text-28', weight: 600, usage: '$8,097 · $312,134' },
  /** The KPI strip figures. */
  'value-lg': { family: 'display', size: 'text-21', weight: 400, tracking: '0.01em', usage: '125.33 % · 1,84' },
  /** A calendar day's realised P&L. */
  value: { family: 'display', size: 'text-lg', weight: 600, usage: '−84,35 · +446.04' },
  /** Trade counts, currency suffixes, win rates. */
  'value-sm': { family: 'display', size: 'text-sm', weight: 500, usage: '13 · 50 % · USD' },
  /** Card titles. */
  title: { family: 'display', size: 'text-15', weight: 500, tracking: '0.01em', usage: 'Unalyze Score · Equity / zůstatek' },
  /** Calendar weekday headers and other display-face chrome. */
  'title-sm': { family: 'display', size: 'text-13', weight: 400, usage: 'Po · Út · St' },
  /** Running text: legends, sub-captions, navigation. */
  body: { family: 'display', size: 'text-xs', weight: 400, usage: 'Equity · Balance · podíl ziskových obchodů' },
  /** The uppercase eyebrow above a KPI. The device that most stops a card reading as default shadcn. */
  label: { family: 'display', size: 'text-xs', weight: 600, uppercase: true, usage: 'ČISTÝ PNL · ZA OBDOBÍ' },
  /** Smaller eyebrow, for a dense row. */
  'label-sm': { family: 'display', size: 'text-10', weight: 600, uppercase: true, usage: 'POČET OBCHODŮ' },
  /** Micro text: axis ticks, scale numbers, secondary counts. */
  caption: { family: 'display', size: 'text-10', weight: 400, usage: 'Trades · Úspěšnost · 0 25 50' },
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

/** Tokens that do not change with the theme. */
export const globalTokens: Record<string, string> = {
  ...cssScales,
  ...fontStacks,
  ...contract,
  ...motion,
  ...zIndex,
  ...interaction,
}

/**
 * Tokens that change with the theme.
 *
 * There is exactly one theme, and that is a decision rather than an oversight: the design is
 * dark-only, so a light theme could only be guesswork, and guessed values that nobody has looked
 * at are worse than none — they look finished.
 *
 * The shape is still a map, so adding light later is additive: restore the `light:` half of each
 * block above, add the mode back to figma/figma.config.json, and regenerate. Nothing downstream
 * has to change, because everything already indexes by theme name.
 */
export const themes: Record<ThemeName, Record<string, string>> = {
  dark: {
    ...figmaSemantic.dark,
    ...dataColors.dark,
    ...chartRamp.dark,
    ...chartChrome.dark,
    ...elevation.dark,
    ...material.dark,
  },
}

/**
 * Which tokens came from Figma and which were authored here. The docs site shows this so a
 * designer can tell at a glance what they can change in Figma and what needs a code change.
 */
export const tokenOrigin: Record<string, 'figma' | 'code'> = {
  ...Object.fromEntries(Object.keys(figmaSemantic.dark).map((k) => [k, 'figma' as const])),
  ...Object.fromEntries(Object.keys(cssScales).map((k) => [k, 'figma' as const])),
  ...Object.fromEntries(Object.keys(contract).map((k) => [k, 'figma' as const])),
  ...Object.fromEntries(
    [
      ...Object.keys(dataColors.dark),
      ...Object.keys(chartRamp.dark),
      ...Object.keys(chartChrome.dark),
      ...Object.keys(elevation.dark),
      ...Object.keys(material.dark),
      ...Object.keys(motion),
      ...Object.keys(zIndex),
      ...Object.keys(interaction),
      ...Object.keys(fontStacks),
    ].map((k) => [k, 'code' as const]),
  ),
}

/**
 * Foreground/background pairs that must stay legible. Asserted in CI (gate G7) so a colour
 * change in Figma cannot quietly push the product below WCAG AA.
 *
 * `minRatio` is 4.5 for anything that carries body text and 3.0 for large text and for
 * non-text boundaries such as focus rings and borders (WCAG 1.4.11).
 */
export const contrastPairs: { fg: string; bg: string; minRatio: number; note: string }[] = [
  { fg: 'foreground', bg: 'background', minRatio: 4.5, note: 'body text on the page' },
  { fg: 'muted-foreground', bg: 'background', minRatio: 4.5, note: 'secondary text' },
  { fg: 'card-foreground', bg: 'card', minRatio: 4.5, note: 'text on a card' },
  { fg: 'popover-foreground', bg: 'popover', minRatio: 4.5, note: 'text in a popover' },
  { fg: 'primary-foreground', bg: 'primary', minRatio: 4.5, note: 'primary button label' },
  { fg: 'secondary-foreground', bg: 'secondary', minRatio: 4.5, note: 'secondary button label' },
  { fg: 'accent-foreground', bg: 'accent', minRatio: 4.5, note: 'accent surface label' },
  {
    fg: 'destructive-foreground',
    bg: 'destructive',
    minRatio: 4.5,
    note: 'destructive button label',
  },
  { fg: 'sidebar-foreground', bg: 'sidebar-background', minRatio: 4.5, note: 'sidebar text' },
  { fg: 'positive', bg: 'background', minRatio: 4.5, note: 'profit value' },
  { fg: 'negative', bg: 'background', minRatio: 4.5, note: 'loss value' },
  { fg: 'neutral-value', bg: 'background', minRatio: 4.5, note: 'breakeven value' },
  { fg: 'warning', bg: 'background', minRatio: 4.5, note: 'stale-data warning' },
  { fg: 'ring', bg: 'background', minRatio: 3, note: 'focus ring — WCAG 1.4.11' },
  { fg: 'border', bg: 'background', minRatio: 1.2, note: 'hairline must be visible at all' },

  // Chart series are graphical objects, so the bar is 3:1 rather than 4.5:1 (WCAG 1.4.11).
  // Every series is checked: a ramp is only as usable as its weakest hue.
  ...([1, 2, 3, 4, 5, 6] as const).map((n) => ({
    fg: `chart-${n}`,
    bg: 'background',
    minRatio: 3,
    note: `chart series ${n}`,
  })),
  { fg: 'chart-axis', bg: 'background', minRatio: 3, note: 'chart axis line' },
  { fg: 'chart-zero-line', bg: 'background', minRatio: 1.2, note: 'zero crossing must be visible' },
]
