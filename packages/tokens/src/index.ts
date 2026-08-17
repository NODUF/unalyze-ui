/**
 * @noduf/unalyze-tokens — public surface.
 *
 * Components must NOT import colours from here. Colour reaches a component through a Tailwind
 * class bound to a `--un-*` custom property, so that a theme swap re-colours everything live.
 *
 * This module exists for the three cases where a real JavaScript value is genuinely required:
 *   1. chart runtimes, which need a colour string to hand to a canvas,
 *   2. the docs site, which renders the token table,
 *   3. a future native client, which cannot read CSS at all.
 */

export { palette, space, radiusRamp, opacityScale, container, type as typeScale, contract, cssScales } from '../generated/primitives'
export { figmaSemantic, provenance, descriptions } from '../generated/figma-semantic'
export type { ThemeName as FigmaThemeName, FigmaSemanticToken } from '../generated/figma-semantic'

export { themes, globalTokens, tokenOrigin, contrastPairs, typeRoles, textLeading } from './semantic'
export type { ThemeName, TypeRole } from './semantic'

export { contrastRatio, parseColor, composite, luminance } from './contrast'
export type { Rgb } from './contrast'

import { globalTokens as global, themes as themeMap, type ThemeName } from './semantic'

/**
 * Resolves a token to its literal value, themed tokens first and non-themed as a fallback.
 *
 * Prefer a CSS class wherever one exists — a literal read here is a snapshot and will not follow
 * a theme change. This is for canvas-based charts and for the docs table.
 */
export function tokenValue(theme: ThemeName, name: string): string | undefined {
  return themeMap[theme][name] ?? global[name]
}
