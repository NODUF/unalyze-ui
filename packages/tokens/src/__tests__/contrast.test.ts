/**
 * Gate G7 — contrast.
 *
 * This is the gate that makes the Figma → code link safe to leave unattended. A designer can
 * lighten `muted-foreground` in Figma, the sync job will open a PR, and this test is what
 * refuses the merge if the change pushes body text below WCAG AA. Without it, a token pipeline
 * is just a faster way to ship an inaccessible palette.
 */

import { describe, expect, it } from 'vitest'
import { contrastRatio, luminance, parseColor } from '../contrast'
import { contrastPairs, themes, type ThemeName } from '../semantic'

const THEMES = Object.keys(themes) as ThemeName[]

describe('parseColor', () => {
  it('reads the two formats the generator emits', () => {
    expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseColor('#0f172a')).toEqual({ r: 15, g: 23, b: 42, a: 1 })
    expect(parseColor('rgb(2 6 23 / 0.4)')).toEqual({ r: 2, g: 6, b: 23, a: 0.4 })
  })

  it('throws rather than guessing', () => {
    // A silent fallback would let a malformed token pass the contrast gate.
    expect(() => parseColor('oklch(0.7 0.1 150)')).toThrow(/Cannot parse colour/)
    expect(() => parseColor('')).toThrow()
  })
})

describe('contrastRatio', () => {
  it('matches the WCAG reference extremes', () => {
    expect(contrastRatio('#000000', '#ffffff', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('flattens a translucent foreground onto its background before measuring', () => {
    const opaque = contrastRatio('#000000', '#ffffff', '#ffffff')
    const faint = contrastRatio('rgb(0 0 0 / 0.1)', '#ffffff', '#ffffff')
    expect(faint).toBeLessThan(opaque)
    expect(faint).toBeGreaterThan(1)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#16a34a', '#ffffff', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#16a34a', '#ffffff'),
      5,
    )
  })
})

describe('luminance', () => {
  it('orders the neutral ramp monotonically', () => {
    const black = luminance(parseColor('#000000'))
    const mid = luminance(parseColor('#808080'))
    const white = luminance(parseColor('#ffffff'))
    expect(black).toBeLessThan(mid)
    expect(mid).toBeLessThan(white)
  })
})

describe.each(THEMES)('theme "%s"', (theme) => {
  const tokens = themes[theme]
  const page = tokens['background'] as string

  it('defines every token the other theme defines', () => {
    const other = THEMES.find((t) => t !== theme)
    if (!other) return
    expect(Object.keys(tokens).sort()).toEqual(Object.keys(themes[other]).sort())
  })

  it('has no empty or undefined token values', () => {
    const empty = Object.entries(tokens).filter(([, v]) => !v || v.trim() === '')
    expect(empty).toEqual([])
  })

  it.each(contrastPairs)('$fg on $bg ≥ $minRatio — $note', ({ fg, bg, minRatio }) => {
    const fgValue = tokens[fg]
    const bgValue = tokens[bg]

    // A pair naming a token that no longer exists is a broken gate pretending to pass.
    expect(fgValue, `token "${fg}" is missing from the ${theme} theme`).toBeDefined()
    expect(bgValue, `token "${bg}" is missing from the ${theme} theme`).toBeDefined()

    const ratio = contrastRatio(fgValue as string, bgValue as string, page)
    expect(
      Number(ratio.toFixed(2)),
      `${fg} (${fgValue}) on ${bg} (${bgValue}) in ${theme}`,
    ).toBeGreaterThanOrEqual(minRatio)
  })
})
