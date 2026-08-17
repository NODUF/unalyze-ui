/**
 * WCAG contrast maths.
 *
 * Lives in the tokens package rather than in a test helper because gate G7 runs it in CI, the
 * docs site renders the same numbers next to every swatch, and both must agree. Two
 * implementations of a contrast ratio is one too many.
 */

export interface Rgb {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Parses the two colour formats this package emits: `#rrggbb` and `rgb(r g b / a)`.
 *
 * Anything else throws. A silent fallback to black would turn a malformed token into a
 * passing contrast test, which is the exact failure this gate exists to prevent.
 */
export function parseColor(value: string): Rgb {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1] as string, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
  }

  const rgb = value
    .trim()
    .match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*([\d.]+)\s*)?\)$/i)
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] === undefined ? 1 : Number(rgb[4]),
    }
  }

  throw new Error(`Cannot parse colour "${value}" — expected #rrggbb or rgb(r g b / a)`)
}

/** Flattens a translucent colour onto an opaque one. */
export function composite(fg: Rgb, bg: Rgb): Rgb {
  if (fg.a >= 1) return fg
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Contrast ratio between two token values, 1–21.
 *
 * `page` is the opaque colour that translucent inputs are flattened onto — the theme's
 * `background`. Without it, a token like `rgb(2 6 23 / 0.06)` would be measured as if it were
 * opaque and report a ratio it can never actually achieve.
 */
export function contrastRatio(fgValue: string, bgValue: string, pageValue: string): number {
  const page = parseColor(pageValue)
  const bg = composite(parseColor(bgValue), page)
  const fg = composite(parseColor(fgValue), bg)

  const a = luminance(fg)
  const b = luminance(bg)
  const [light, dark] = a > b ? [a, b] : [b, a]
  return ((light as number) + 0.05) / ((dark as number) + 0.05)
}
