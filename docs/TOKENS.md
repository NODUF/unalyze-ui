# Design tokens

How a colour gets from a Figma variable into a rendered pixel, and who is allowed to change it
at each step.

## The chain

```text
Figma Variables                     figma/exports/*.json          designer edits here
  ↓ figma-to-ts.ts                  packages/tokens/generated/primitives.ts
  ↓                                 packages/tokens/generated/figma-semantic.ts
semantic layer (hand-authored)      packages/tokens/src/semantic.ts        engineer edits here
  ↓ emit.ts                         packages/tokens/generated/tokens.css   ships to the consumer
  ↓                                 packages/tokens/generated/theme.css    our Tailwind build only
component                           un:bg-primary → var(--un-primary)
```

Two authoring surfaces, and only two. **Figma** for anything Figma can express, **`semantic.ts`**
for anything it cannot. Everything between them is generated and committed, so a design change
arrives as a reviewable diff rather than as a rebuild nobody saw.

## Who owns what

| Layer | Owner | Examples | Changed by |
|---|---|---|---|
| Brand palette | Figma | `unalyze_brand` — `Green/500`, `Loss/500`, `Canvas/black`… 18 values | editing Figma, re-exporting |
| Tailwind palette | Figma | `slate-100`, `green-700` — 244 stock values the light theme still leans on | editing Figma, re-exporting |
| Scales | Figma | spacing, container widths, type ramp | editing Figma, re-exporting |
| Contract | Figma | `--un-radius` and its two derived steps, `opacity-hover` | editing Figma, re-exporting |
| Semantic roles | Figma | `background`, `primary`, `muted-foreground`, `destructive` | editing Figma, re-exporting |
| Data grammar | **code** | `positive`, `negative`, `neutral-value`, `warning`, `info` | `semantic.ts` |
| Chart ramp | **code** | `chart-1…6`, `chart-grid`, `chart-axis`, `chart-zero-line` | `semantic.ts` |
| Material | **code** | `edge-stops`, `emphasis-wash`, `chart-area-from` | `semantic.ts` |
| Elevation | **code** | `elevation-flat/raised/overlay`, `overlay-scrim` | `semantic.ts` |
| Motion | **code** | `duration-*`, `ease-*` | `semantic.ts` |
| Stacking | **code** | `z-sticky` … `z-tooltip` | `semantic.ts` |
| Interaction | **code** | focus ring, touch target, icon sizes | `semantic.ts` |

The code-owned rows exist because Figma Variables has no type for a shadow, a gradient, a
cubic-bezier or a duration, and no vocabulary at all for "this number is a loss".

## Dark is the primary theme

`:root` resolves to dark, and `[data-un-theme='light']` is the opt-in. That is not a stylistic
preference — the Figma design is dark-only, so dark is the only theme with values that were
*designed* rather than derived. An app that sets no attribute gets the presentation the product
was actually drawn in.

Every light-theme block in `semantic.ts` that had no design behind it is commented as **DERIVED**.
They are structurally complete and pass the contrast gate, but they are a starting point for a
light design, not a record of one.

## Where the dark values came from

Read off the fill and stroke values of all 1 378 layers in `Dashboard - Main`, not sampled from a
screenshot. The full extraction is in `figma/reference/palette-extracted.md`. Highlights:

| Token | Value | Note |
|---|---|---|
| `background` | `#000000` | Pure black, no page gradient |
| `primary` | `#5BFD8B` | The brand green, with **black** text on it (15.9:1) |
| `positive` | `#5BFD8B` | Same hex as `primary`, deliberately a separate token |
| `negative` | `#D9534B` | |
| `card` | `#AEAEAE @0.05` | A translucent veil over black, never an opaque grey |
| `border` | `#FFFFFF @0.12` | |
| `muted-foreground` | `#FAF8F8 @0.6` | The most-used text colour in the design |
| `edge-stops` | white @5 % → transparent | The glass rim — 57 layers use it |
| `--un-radius` | `32px` | Panel radius. Controls are pills, not this |

**`primary` and `positive` resolve to the same green and stay separate tokens.** The moment they
merge, a CVD-safe palette and a light theme have no way to tell a losing trade apart from a
dangerous button.

## Naming

Every custom property is `--un-<role>`. The namespace is not decoration: the package lands in an
application that already defines `--background`, `--primary` and `--radius`, and an unnamespaced
collision is silent and untraceable.

## Rules that are enforced, not just documented

| Rule | Enforced by |
|---|---|
| Generated files match the Figma export | G1 — CI regenerates and fails on any diff |
| No token disappears without a major bump | G2 — `tooling/check-contract.mjs` diffs the public surface |
| Every foreground/background pair meets WCAG | G7 — `contrastPairs` in `semantic.ts`, asserted per theme |
| Both themes define exactly the same tokens | theme-parity test |
| No token has an empty value | theme-parity test |
| No Figma variable is dropped silently | build error listing the unmapped names |
| `gap/*` and `padding/*` stay one scale | build error on conflict |

## The contrast gate has already changed the design once

`destructive-foreground` is **black**, not white. The design's red is `#D9534B`, which works as
loss *text on black* (5.3:1) but fails as a *button fill under white text* (3.75:1, below AA).
Black on that same red is 5.29:1 — and it matches the black-on-green treatment `primary` already
uses, so the fix followed the design's own logic rather than inventing a new red. The value was
corrected in Figma as well as in code, so the next export does not undo it.

The light theme's rungs look uneven for the same reason: `positive` is `green-700` while
`negative` is `red-600`. Green and amber are intrinsically high-luminance, so their 600 rung lands
at ~3.3:1 on white and fails AA for body text, while red and blue clear 4.5:1 there. Tidying these
into a uniform rung fails CI.

The chart ramp *is* uniform in light — all 600 — because that is the lightest rung at which every
hue clears the 3:1 bar for graphical objects (WCAG 1.4.11). In dark it is not uniform, because
four of the six hues are read straight from the design's own charts.

## Deliberately not emitted as CSS

The 244-colour palette, the raw Tailwind radius ramp and the opacity ramp stay in JavaScript only.
They are consumed by Tailwind utilities that are precompiled into the shipped stylesheet, so
emitting them as custom properties would add roughly 12 kB to every consumer's page in exchange
for an override nobody would ever perform. Import them from `@noduf/unalyze-tokens` when you need a
real value in JS — a chart runtime, the docs table.

## Overriding from the consuming application

All library CSS sits in `@layer unalyze-base, unalyze-components`, declared before anything else.
Cascade layers rank below unlayered CSS, so ordinary application CSS wins with no `!important`
and no specificity battle:

```css
/* in the consuming app — this wins */
:root {
  --un-radius: 4px;
  --un-font-sans: 'Inter', sans-serif;
  --un-primary: #0b7a3c;
}
```

Changing `--un-radius` reshapes every control at once, because `--un-radius-sm` and
`--un-radius-md` are `calc()` expressions derived from it — an expression that came from the
Figma variable's own `codeSyntax`, not one we invented.

## Fonts

The package bundles no font files. `--un-font-sans`, `--un-font-serif`, `--un-font-mono` and
`--un-font-display` are slots with fallback stacks; the consuming app sets them. Nohemi is
licence-restricted and must never be committed to this repository.

## The radius ladder is not a ladder

The design's entire radius vocabulary is **2 px** (the dot-matrix cells), **32 px** (every panel:
cards, the KPI strip, the calendar) and **fully round** (every control). There is no 4/6/8 ramp
anywhere in it.

Stock shadcn derives its smaller steps as `calc(var(--radius) - 2px)` and `- 4px`, which only
makes sense with a small base. At 32 px it yields 30 and 28 — two steps nobody can tell apart and
neither of which is drawn. So the chain is gone and the three values are explicit. The
`codeSyntax` expressions that carried it were cleared in Figma too, or they would keep winning
over the values.

`radius-md` (16 px) is the one **derived** entry: the design has no mid-size radius because its
controls are pills, so this is the rung waiting for inputs and menus that have not been designed.

## The glass rim

A 1 px gradient ring — `linear-gradient(180deg, white 5%, transparent)` — masked so only the ring
paints. 57 layers in the design carry it, which makes it the most-used material after the fills
themselves. It reads as light catching the top lip of a pane; a rim of even brightness all the way
round would read as a drawn outline instead.

`Surface` wears `edge="subtle"` by default and `border` defaults **off**, because a hairline
underneath the rim puts a drawn outline beneath the light. `Button`'s `glass` variant wears the
same rim, which is what makes a toolbar read as the same substance as the panels around it.

The implementation is a masked `::before`, and the alternatives were tried: `border-image` ignores
`border-radius` entirely, and the `background-clip` double-layer trick tints the whole card because
our fills are translucent. Full reasoning is in the comment above `@utility glass-edge` in
`packages/ui/src/styles.css`.

## Card tints

Each chart card in the design carries **two** fills: the neutral veil, plus its own series colour
at 5 %. Score is green, Equity blue, Daily P&L violet. `Surface`'s `tint` prop reproduces it via
`background-image` layered over `background-color` — the same stacking the design uses.

## The card is one material, not four props

`level="glass"` is the design's card, and it is the default. It carries all of this at once:

| Piece | Value | Why it is not separable |
|---|---|---|
| Veil fill | `#AEAEAE @0.05` | |
| Inner light | `inset ±8px 8px 20px white @0.02`, **a pair** | One inset lights a single corner and reads as a dent; a matched pair on opposing diagonals reads as a pane thick enough to catch light on its inside faces |
| Backdrop blur | `20px` | |
| Rim | the gradient ring | |

Every panel in the dashboard wears all four. Splitting them into separate props would let a caller
assemble three-quarters of a card, which is not a thing the design contains.

**The blur only earns its cost where there is ambient behind it.** The design floats large,
heavily blurred coloured ellipses behind the layout (`LAYER_BLUR 200` and `420`); that is what the
blur samples. Over flat black it samples flat black, changes nothing visible, and still forces a
compositing layer. The preview reproduces the ambient for exactly this reason — without it,
`glass` and `flat` look identical and neither can be reviewed.

## Type

`font-sans` is **Montserrat** and `font-display` is **Nohemi**. Neither is bundled — both are slots
the consuming app fills, and Nohemi is licence-restricted and must never be committed here.

The design's split is not the obvious one, and it is worth stating plainly because an earlier note
in this file had it backwards. Reading all 1 378 layers of the dashboard: **Nohemi carries every
number** — calendar P&L, KPI figures, the `42` score, the monthly totals — plus the card titles.
**Montserrat carries the supporting text**: uppercase eyebrows, sub-captions, chart axes, legends,
navigation. Roughly 186 runs to 54.

(A third face, Inter, appears in 13 runs, all inside chart internals. That is a charting-library
default, not a design decision, and it is not represented in the tokens.)

### The eleven type roles

Figma has no variable type that binds a family, a size, a weight and a tracking into one thing, so
the pairing lives in `typeRoles` in `semantic.ts` and reaches components as `Text`'s `variant`
prop. The design uses 23 distinct text styles; these are the eleven jobs those styles were doing.

| Variant | Face | Size | Weight | Where |
|---|---|---|---|---|
| `display` | Nohemi | 36 | 400 | the score |
| `value-xl` | Nohemi | 28 | 600 | monthly / yearly totals |
| `value-lg` | Nohemi | 21 | 400 | KPI figures |
| `value` | Nohemi | 18 | 600 | a calendar day |
| `value-sm` | Nohemi | 14 | 500 | counts, USD, win rate |
| `title` | Nohemi | 15 | 500 | card titles |
| `title-sm` | Nohemi | 13 | 400 | weekday headers |
| `body` | Montserrat | 12 | 400 | legends, sub-captions, nav |
| `label` | Montserrat | 12 | 600 caps | the KPI eyebrow |
| `label-sm` | Montserrat | 10 | 600 caps | dense row labels |
| `caption` | Montserrat | 10 | 400 | axis ticks, micro labels |

The prop is called `variant`, not `role`, because `role` is a reserved ARIA attribute — a prop of
that name would shadow it and `<Text role="status">` would silently stop announcing.

### ⚠ Nohemi has no tabular figures

The design sets its numbers in Nohemi. In a static mockup that is invisible, because the digits
never change. In a live dashboard, a column of P&L values set in Nohemi shifts width every time a
figure updates.

`Text`'s `numeric` prop therefore switches to Montserrat, which carries `tnum`. It is the one place
the library deliberately departs from the design, because a static mockup could not have surfaced
the problem. Pass `family="display"` alongside it to keep Nohemi and accept the jitter.

**This needs a decision before launch** — either accept the face switch for live numbers, or
confirm that Nohemi's figures are close enough to monospaced in practice.

### Sizes that are not on the Tailwind ladder

The design uses 10, 11, 13, 15, 21 and 28 px, none of which exist in the stock ramp. They are named
by pixel value (`text-13`, `text-21`) rather than given ladder positions, because inventing
`xs-plus` or `2xl-minus` would imply a relationship that is not there.

Its fractional sizes — 9.5, 10.5, 12.5 — are artefacts of the HTML-to-Figma capture scale rather
than decisions, and are rounded to whole pixels.

## Open items

- **`neon-green` (`#ADFA1D`).** Stock shadcn leftover. It appears nowhere in the design and was
  left untouched rather than deleted. Worth removing from the Figma collection.
- **`#E6B800` (warning) and `#3288FF` (info).** Real roles, but each appears only 3 and 2 times in
  the design. They are enshrined as tokens on thin evidence.
- **The light theme has no design.** Every value is derived. It passes the contrast gate and is
  structurally complete, but nobody has looked at it.
- **Mode naming.** The shadcn modes are called `light/slate` and `dark/slate`, but the light mode
  aliases almost entirely through **zinc** — only `secondary` goes through slate. Renaming the
  modes in Figma would remove a standing trap.
