# figma/reference/

Screenshots of the UNALYZE PROJECT Figma file, committed so the design intent is versioned
alongside the code and readable without a Figma seat.

Source file: `sPhUUdRZESDiMDKzD1GO4L`, page **APP** (`667:107`)
Captured: 2026-08-17

| File | Node | Frame |
|---|---|---|
| `dashboard-main.png` | `667:108` | Dashboard - Main (1440 × 1812) |
| `achievements.png` | `755:5785` | Dashboard - Achievements (1440 × 543) |
| `modal-popup.png` | `809:1633` | MODAL POPUP (1440 × 1812) |

`809:215` is a second copy of Dashboard - Main and is not captured separately — its variable
bindings are byte-identical to `667:108`.

## Read this before harvesting tokens from the file

**The frames on this page are HTML→Figma imports, not hand-built Figma components.** The variables
they bind to are machine-generated, one per literal value found in the imported markup:

```
fontSize/10_5          lineHeight/15_75      letterSpacing/0_21
fontSize/9_5           lineHeight/14_25      color/White/Hint of Red 2
HTML to Figma/Montserrat-10.5/Regular        var(--foreground)
```

Two tells: the `HTML to Figma/` prefix, and `var(--foreground)` — a CSS custom property name that
ended up as a Figma variable name. The fractional sizes (10.5, 9.5, 12.5 px) and their line heights
are import artefacts from a non-100 % capture scale, not a designed type ramp.

So this file is a reliable **visual** source of truth and an unreliable **token** source. The token
pipeline in `packages/tokens` cannot harvest from it as-is; see `docs/TOKENS.md` for where the
values actually come from.

## What the design establishes

- **Dark-first.** Near-black canvas, no light variant present in this file.
- **Montserrat**, not the `Geist` recorded in the committed `Typography` collection.
- **Green for profit, red for loss**, and green also carries brand emphasis (the Unalyze Score
  card has a green radial wash and a green rim).
- Blue for the equity/balance chart, violet–magenta for the daily P&L bars — neither hue collides
  with the P&L pair.
- Czech UI copy throughout.
- Gamification is already designed: the **Úspěchy** nav destination, **DAY STREAK**, and the
  **Unalyze Score** radar with its `42 un` figure.
