# Palette extracted from the design

Read off the **fill and stroke values** of every layer in `Dashboard - Main` (`667:108`) — not
sampled from a screenshot, so these are exact. 1 378 layers, 58 unique values.

Captured 2026-08-17 via the Figma Plugin API.

## Core

| Value | Role in the design | Uses |
|---|---|---|
| `#5BFD8B` | **Brand green.** Profit values, the `42 un` score, active nav dot, calendar gains | 92 as text |
| `#D9534B` | **Loss red.** Negative values, losing calendar days | 24 as stroke |
| `#000000` | Page canvas — pure black, no gradient | 12 |
| `#FAF8F8` | Foreground text | 81 |
| `#FFFFFF` | Brighter foreground, used on emphasised text | 55 |
| `#A5ACA9` | Muted text | 34 |
| `#8B938F` | Subtle text | 23 |
| `#061007` | Near-black with a green cast — the Score card base | 5 |
| `#E6B800` | Amber. Warning / partial-data | 3 |
| `#3288FF` | Blue — equity & balance series | 2 |

## Alpha ladders

The design leans hard on one hue at many opacities rather than on many hues. `#5BFD8B @0.2` is the
single most-used value in the file (219 uses) — it is the calendar's winning-day wash.

| Hue | Alphas in use |
|---|---|
| `#5BFD8B` | 0.04 · 0.05 · 0.1 · **0.2** · 0.25 · 0.5 · 0.7 · 0.8 |
| `#FAF8F8` | 0.08 · 0.1 · 0.16 · 0.38 · 0.4 · **0.6** |
| `#FFFFFF` | 0.08 · 0.1 · 0.12 · 0.5 |
| `#D9534B` | 0.04 · 0.8 |
| `#AEAEAE` | 0.05 · 0.1 — neutral surface fills |

## Gradients

| Gradient | Where | Uses |
|---|---|---|
| `#FFFFFF → transparent` | **The glass rim.** A light edge raking across a panel | 57 |
| `#BC74FF → #9C32FF` | Violet — profit bars, Denní realizovaný PnL | 30 |
| `#92164C → #D9558F` | Magenta — loss bars, same chart | 30 |
| `#5BFD8B → transparent` | Green area fade under a rising series | 12 |
| `#D9534B → transparent` | Red area fade | 6 |
| `#3288FF → transparent` | Blue area fade, equity chart | 2 |
| `#7CF2A6 @0.42 → #2FD36B @0.14` | The green wash on the Unalyze Score card | 1 |

## What this establishes

1. **`#5BFD8B` is byte-identical to `brand.winningGreen` in `unalyze-app`** (`rgb(91 253 139)`).
   The two were designed by the same hand in the same language; that repo's semantic layer is a
   ready-made starting point for this palette rather than a separate direction.
2. **The canvas is pure `#000000`**, with no page gradient. Depth comes from translucent fills over
   black plus a 1 px light rim — which is why the `#FFFFFF → transparent` gradient is the second
   most-used value in the file.
3. **Green carries two jobs**: brand emphasis *and* profit. Those must stay separate tokens even
   though they resolve to the same hex today, or the CVD-safe palette and the light theme cannot
   diverge them later.
4. **The chart hues avoid green and red entirely** — violet, magenta and blue — which independently
   matches the "red and green are reserved for P&L" rule.
5. **`#E6B800` and `#3288FF` appear only 3 and 2 times.** Both are real roles (warning, equity) but
   neither has been exercised much, so both are worth confirming rather than enshrining.
