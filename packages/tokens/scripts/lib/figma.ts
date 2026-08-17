/**
 * Reader for the raw Figma Variables export.
 *
 * The export we consume is produced by a Figma plugin and already carries
 * `resolvedValuesByMode`, so we never have to walk the alias graph ourselves. We DO keep
 * `aliasName` though: knowing that `primary` resolves through `green/400` rather than just
 * knowing it is `#4ade80` is what makes a token diff reviewable.
 *
 * Nothing in here is allowed to guess. A variable that does not match a configured rule is
 * reported, not silently dropped — see `figma-to-ts.ts`.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/* ------------------------------------------------------------------ *
 * Shape of the export
 * ------------------------------------------------------------------ */

export interface FigmaRgba {
  r: number
  g: number
  b: number
  a: number
}

export type FigmaScalar = FigmaRgba | number | string | boolean

export interface FigmaResolved {
  resolvedValue: FigmaScalar
  alias: string | null
  aliasName?: string
}

export type FigmaType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'

export interface FigmaVariable {
  id: string
  name: string
  description: string
  type: FigmaType
  valuesByMode: Record<string, unknown>
  resolvedValuesByMode: Record<string, FigmaResolved>
  scopes: string[]
  hiddenFromPublishing: boolean
  codeSyntax: Partial<Record<'WEB' | 'ANDROID' | 'iOS', string>>
}

export interface FigmaCollection {
  id: string
  /** Collection name as authored in Figma. This — not the filename — is the key we dispatch on. */
  name: string
  /** modeId → mode name, e.g. `"137:5" → "dark/slate"`. */
  modes: Record<string, string>
  variableIds: string[]
  variables: FigmaVariable[]
}

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

/**
 * Loads every `*.json` in `dir` and keys the result by the collection's own name.
 *
 * Keying on `collection.name` rather than the filename means a re-export with different
 * filenames (Figma plugins are inconsistent about this) cannot silently drop a collection —
 * it either still matches the config or the build fails loudly.
 */
export function loadCollections(dir: string): Map<string, FigmaCollection> {
  const out = new Map<string, FigmaCollection>()

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort() // deterministic: the generated output must not depend on directory order

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf8')
    const parsed = JSON.parse(raw) as FigmaCollection

    if (!parsed.name || !Array.isArray(parsed.variables)) {
      throw new Error(`${file}: not a Figma variable-collection export (missing name/variables)`)
    }
    if (out.has(parsed.name)) {
      throw new Error(
        `Collection "${parsed.name}" appears in two files. Delete the stale export from ${dir}.`,
      )
    }

    // Variable order in the export follows Figma's internal ordering, which shifts when a
    // designer reorders the panel. Sorting here keeps generated diffs about VALUES, not order.
    parsed.variables.sort((a, b) => a.name.localeCompare(b.name))
    out.set(parsed.name, parsed)
  }

  return out
}

/** Resolves a mode name (`"dark/slate"`) to its Figma mode id. */
export function modeId(collection: FigmaCollection, modeName: string): string {
  const found = Object.entries(collection.modes).find(([, name]) => name === modeName)
  if (!found) {
    const available = Object.values(collection.modes).join(', ')
    throw new Error(
      `Collection "${collection.name}" has no mode "${modeName}". Available: ${available}`,
    )
  }
  return found[0]
}

/** The single mode of a non-themed collection. Throws if the collection turns out to be themed. */
export function soleModeId(collection: FigmaCollection): string {
  const ids = Object.keys(collection.modes)
  if (ids.length !== 1) {
    throw new Error(
      `Collection "${collection.name}" has ${ids.length} modes; expected exactly one. ` +
        `Add it to "themes" in figma.config.json if it became themed.`,
    )
  }
  return ids[0] as string
}

export function resolvedFor(variable: FigmaVariable, mode: string): FigmaResolved {
  const value = variable.resolvedValuesByMode[mode]
  if (!value) {
    throw new Error(`Variable "${variable.name}" has no resolved value for mode ${mode}`)
  }
  return value
}

/* ------------------------------------------------------------------ *
 * Value conversion
 * ------------------------------------------------------------------ */

function isRgba(v: FigmaScalar): v is FigmaRgba {
  return typeof v === 'object' && v !== null && 'r' in v && 'g' in v && 'b' in v
}

const channel = (n: number) => Math.round(n * 255)
const hex2 = (n: number) => channel(n).toString(16).padStart(2, '0')

/**
 * Figma stores colour as floats in 0…1. Opaque colours become `#rrggbb`; translucent ones
 * become `rgb(r g b / a)`.
 *
 * Deliberately NOT oklch: the package ships precompiled CSS into a codebase we do not control,
 * and hex/rgb is the format their existing stylesheet, their devtools and their designers all
 * already read.
 */
export function colorToCss(rgba: FigmaRgba): string {
  if (rgba.a >= 1) return `#${hex2(rgba.r)}${hex2(rgba.g)}${hex2(rgba.b)}`
  const alpha = Number(rgba.a.toFixed(3))
  return `rgb(${channel(rgba.r)} ${channel(rgba.g)} ${channel(rgba.b)} / ${alpha})`
}

export type Unit = 'px' | 'percent' | 'number' | 'raw'

/** Converts a resolved Figma value into the CSS string we will emit. */
export function valueToCss(value: FigmaScalar, unit: Unit): string {
  if (isRgba(value)) return colorToCss(value)

  if (typeof value === 'number') {
    switch (unit) {
      case 'px':
        return `${value}px`
      case 'percent':
        return String(Number((value / 100).toFixed(4)))
      case 'number':
      case 'raw':
        return String(value)
    }
  }

  return String(value)
}

/* ------------------------------------------------------------------ *
 * Naming
 * ------------------------------------------------------------------ */

/**
 * Figma names → CSS-safe token names.
 *
 * `hover:` is handled as a state SUFFIX rather than a prefix (`hover:primary` → `primary-hover`)
 * so that every variant of a role sorts next to the role itself, both in the generated CSS and
 * in a review diff.
 */
export function tokenName(figmaName: string): string {
  let name = figmaName

  const hover = name.match(/^hover:(.+)$/)
  if (hover) name = `${hover[1]}-hover`

  return name
    .toLowerCase()
    .replace(/[/:]/g, '-') // sidebar/background → sidebar-background
    .replace(/,/g, '-') // gap-0,5 → gap-0-5
    .replace(/\s+/g, '-') // "border radius" → border-radius
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Splits `"border radius/rounded-lg"` into `["border radius", "rounded-lg"]`. */
export function splitGroup(figmaName: string): { group: string; leaf: string } {
  const slash = figmaName.indexOf('/')
  if (slash === -1) return { group: '', leaf: figmaName }
  return { group: figmaName.slice(0, slash), leaf: figmaName.slice(slash + 1) }
}
