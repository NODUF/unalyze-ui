/**
 * Stage A — Figma Variables export → committed TypeScript.
 *
 * Run via `pnpm tokens`. Writes `generated/`, which is COMMITTED so that a design change shows
 * up as a reviewable diff rather than as a silent rebuild.
 *
 * The one rule that matters here: **nothing is dropped quietly**. Every variable either matches a
 * rule in `figma/figma.config.json`, or is listed in `ignoredVariables`, or fails the build. A
 * design system rots when tokens disappear without anyone noticing.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  loadCollections,
  modeId,
  resolvedFor,
  soleModeId,
  splitGroup,
  tokenName,
  valueToCss,
  type FigmaCollection,
  type Unit,
} from './lib/figma'
import { byName } from './lib/order'

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

interface GroupRule {
  as: string
  unit: Unit
  strip?: string
  aliases?: Record<string, string>
  emitCss?: boolean
}

interface CollectionRule {
  layer: 'palette' | 'scale' | 'type' | 'semantic' | 'contract'
  emitCss: boolean | 'partial'
  themed?: boolean
}

interface Config {
  neutral: string
  themes: Record<string, string>
  collections: Record<string, CollectionRule>
  groups: Record<string, Record<string, GroupRule>>
  renames: Record<string, Record<string, string>>
  ignoredVariables: Record<string, string>
}

const ROOT = resolve(import.meta.dirname, '../../..')
const FIGMA_DIR = resolve(ROOT, 'figma')
const OUT_DIR = resolve(import.meta.dirname, '../generated')

const config = JSON.parse(readFileSync(resolve(FIGMA_DIR, 'figma.config.json'), 'utf8')) as Config

/** Strips the `$comment` / `$…` documentation keys the config uses for reviewer notes. */
const withoutDocs = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([k]) => !k.startsWith('$')))

const collections = loadCollections(resolve(FIGMA_DIR, 'exports'))

/* ------------------------------------------------------------------ *
 * Diagnostics
 * ------------------------------------------------------------------ */

const unmapped: { collection: string; variable: string; reason: string }[] = []
const renamed: { collection: string; from: string; to: string }[] = []

function require_(collectionName: string): FigmaCollection {
  const c = collections.get(collectionName)
  if (!c) {
    throw new Error(
      `figma.config.json expects a collection named "${collectionName}" but no export in ` +
        `figma/exports contains it. Found: ${[...collections.keys()].join(', ')}`,
    )
  }
  return c
}

// A collection that exists on disk but is not configured is a design change nobody has looked at.
for (const name of collections.keys()) {
  if (!withoutDocs(config.collections)[name]) {
    throw new Error(
      `Collection "${name}" is present in figma/exports but not in figma.config.json. ` +
        `Add a rule for it, or delete the export.`,
    )
  }
}

/* ------------------------------------------------------------------ *
 * Name resolution
 * ------------------------------------------------------------------ */

function applyRename(collection: string, figmaName: string): string {
  const table = config.renames[collection]
  const to = table?.[figmaName]
  if (!to) return figmaName

  // Themed collections walk every variable once per theme; record the rename once.
  const already = renamed.some((r) => r.collection === collection && r.from === figmaName)
  if (!already) renamed.push({ collection, from: figmaName, to })
  return to
}

/** leaf → token name, per the rule documented in figma.config.json. */
function nameFromRule(leaf: string, rule: GroupRule): string {
  let key = rule.strip && leaf.startsWith(rule.strip) ? leaf.slice(rule.strip.length) : leaf
  key = rule.aliases?.[key] ?? key
  return tokenName(key === rule.as || key === '' ? rule.as : `${rule.as}-${key}`)
}

/* ------------------------------------------------------------------ *
 * Layer: palette (JS only)
 * ------------------------------------------------------------------ */

function buildPalette(collectionName: string): Record<string, string> {
  const collection = require_(collectionName)
  const mode = soleModeId(collection)
  const out: Record<string, string> = {}

  for (const variable of collection.variables) {
    out[tokenName(variable.name)] = valueToCss(resolvedFor(variable, mode).resolvedValue, 'raw')
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Layer: grouped scales (Tailwind Primitives, Typography, Primitives)
 * ------------------------------------------------------------------ */

interface ScaleEntry {
  value: string
  /** Which Figma variable produced it — kept for the DTCG output and for review diffs. */
  source: string
  /** `codeSyntax.WEB`, rewritten into our namespace. Null when Figma defined no expression. */
  expr: string | null
  emitCss: boolean
}

/**
 * Rewrites a Figma `codeSyntax.WEB` expression into our namespace: `calc(var(--radius) - 2px)`
 * becomes `calc(var(--un-radius) - 2px)`.
 *
 * Two rules, both learned from the real export:
 *
 * 1. **Only CSS expressions count.** Figma's WEB code syntax is a free-text field, and in this
 *    file most of it holds Tailwind CLASS names (`text-sm`, `gap-14`, `p-0`) rather than CSS.
 *    Taking those literally silently replaced the type scale with a list of class names. So an
 *    entry is only honoured when it actually contains `var(` or `calc(`.
 * 2. **A self-reference is not an expression.** `radius/radius` declares its own syntax as
 *    `var(--radius)`, meaning "this variable IS --radius". Emitting that verbatim would produce
 *    a custom property that resolves to itself.
 */
function rewriteExpr(expr: string | undefined, ownName: string): string | null {
  if (!expr) return null
  if (!/var\(|calc\(/.test(expr)) return null

  const rewritten = expr.replace(/var\(--(?!un-)([a-z0-9-]+)\)/gi, (_m, v: string) => `var(--un-${v})`)
  if (rewritten.trim() === `var(--un-${ownName})`) return null
  return rewritten
}

function buildGrouped(collectionName: string): Record<string, ScaleEntry> {
  const collection = require_(collectionName)
  const mode = soleModeId(collection)
  const rules = withoutDocs(config.groups[collectionName] ?? {})
  const out: Record<string, ScaleEntry> = {}

  for (const variable of collection.variables) {
    const { group, leaf } = splitGroup(variable.name)
    const rule = rules[group]

    if (!rule) {
      if (config.ignoredVariables[`${collectionName}/${variable.name}`]) continue
      unmapped.push({
        collection: collectionName,
        variable: variable.name,
        reason: group ? `no rule for group "${group}"` : 'variable is not inside a group',
      })
      continue
    }

    const name = nameFromRule(leaf, rule)
    const value = valueToCss(resolvedFor(variable, mode).resolvedValue, rule.unit)
    const expr = rewriteExpr(variable.codeSyntax.WEB, name)

    // gap/* and padding/* both feed the single spacing scale. They agree today; if a designer
    // ever desyncs them, that is a design bug and must not be resolved by last-write-wins.
    const existing = out[name]
    if (existing && existing.value !== value) {
      throw new Error(
        `Token "${name}" gets conflicting values from "${existing.source}" (${existing.value}) ` +
          `and "${variable.name}" (${value}) in collection "${collectionName}".`,
      )
    }

    out[name] = {
      value,
      source: variable.name,
      expr,
      emitCss: rule.emitCss ?? true,
    }
  }

  return out
}

/* ------------------------------------------------------------------ *
 * Layer: themed semantic (shadcn/ui)
 * ------------------------------------------------------------------ */

interface SemanticEntry {
  value: string
  /** The primitive this role resolves through, e.g. `green/400`. Empty when set as a raw value. */
  via: string
  description: string
}

function buildSemantic(collectionName: string): Record<string, Record<string, SemanticEntry>> {
  const collection = require_(collectionName)
  const out: Record<string, Record<string, SemanticEntry>> = {}

  for (const [theme, pattern] of Object.entries(withoutDocs(config.themes))) {
    const mode = modeId(collection, pattern.replace('{neutral}', config.neutral))
    const tokens: Record<string, SemanticEntry> = {}

    for (const variable of collection.variables) {
      const name = tokenName(applyRename(collectionName, variable.name))
      const resolved = resolvedFor(variable, mode)
      tokens[name] = {
        value: valueToCss(resolved.resolvedValue, 'raw'),
        via: resolved.aliasName ?? '',
        description: variable.description,
      }
    }

    out[theme] = tokens
  }

  return out
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

const palette = buildPalette('Tailwind Colors')
const brand = buildPalette('unalyze_brand')
const scales = buildGrouped('Tailwind Primitives')
const type = buildGrouped('Typography')
const contract = buildGrouped('Primitives')
const semantic = buildSemantic('shadcn/ui')

/**
 * The first configured theme, used wherever we need "the set of token NAMES" rather than any
 * particular theme's values. Indexing `light` by name here is what broke when the light theme was
 * dropped; every theme defines the same keys, so the first one is as good as any.
 */
const [referenceTheme] = Object.values(semantic)

if (unmapped.length > 0) {
  const lines = unmapped.map((u) => `  ${u.collection} / ${u.variable} — ${u.reason}`).join('\n')
  throw new Error(
    `${unmapped.length} Figma variable(s) matched no rule:\n${lines}\n\n` +
      `Either add a group rule to figma.config.json, or list them under "ignoredVariables" ` +
      `with a note saying why they are not tokens.`,
  )
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */

const BANNER = `/**
 * GENERATED FILE — do not edit.
 *
 * Source: figma/exports/*.json  ·  Rules: figma/figma.config.json
 * Regenerate: pnpm tokens
 *
 * Committed on purpose: a design change must arrive as a reviewable diff.
 */
`

const sortedEntries = <T>(record: Record<string, T>): [string, T][] =>
  Object.entries(record).sort(([a], [b]) => byName(a, b))

/** Emits a plain `Record<string, string>` as a frozen const object. */
function tsRecord(name: string, record: Record<string, string>, doc: string): string {
  const body = sortedEntries(record)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n')
  return `${doc}\nexport const ${name} = {\n${body}\n} as const\n`
}

const scaleValues = (entries: Record<string, ScaleEntry>, filter?: (e: ScaleEntry) => boolean) =>
  Object.fromEntries(
    sortedEntries(entries)
      .filter(([, e]) => (filter ? filter(e) : true))
      .map(([k, e]) => [k, e.expr ?? e.value]),
  )

const primitivesTs = [
  BANNER,
  tsRecord(
    'palette',
    palette,
    `/**\n * The full Tailwind ramp as authored in Figma.\n *\n * JS ONLY — deliberately not emitted as CSS. All 244 colours would add roughly 12 kB of\n * custom properties to every consumer's stylesheet, and components must speak roles, not hues.\n * Use this for token authoring, docs and chart runtimes.\n */`,
  ),
  tsRecord(
    'brand',
    brand,
    `/**\n * The Unalyze brand ramp, read off the Dashboard design and stored in the \`unalyze_brand\`\n * Figma collection.\n *\n * This is the palette the product actually speaks. \`palette\` above is the stock Tailwind ramp\n * the light theme still resolves through; everything the dark theme shows comes from here.\n */`,
  ),
  tsRecord('space', scaleValues(scales, (e) => e.source.startsWith('gap/') || e.source.startsWith('padding/')),
    `/** Spacing scale. gap/* and padding/* in Figma are the same scale and are merged here. */`),
  tsRecord('radiusRamp', scaleValues(scales, (e) => e.source.startsWith('border radius/')),
    `/**\n * The raw Tailwind radius ramp. JS only — the CSS contract is the three-knob\n * \`radius\` / \`radius-sm\` / \`radius-md\` set from the Primitives collection.\n */`),
  tsRecord('opacityScale', scaleValues(scales, (e) => e.source.startsWith('opacity/')), `/** Opacity ramp, 0–1. */`),
  tsRecord('container', scaleValues(scales, (e) => e.source.startsWith('max-w/')), `/** Container max-widths. */`),
  tsRecord('type', scaleValues(type), `/** Font families, sizes, line heights and weights. */`),
  tsRecord(
    'contract',
    scaleValues(contract),
    `/**\n * The knobs Figma components actually bind to. Values that Figma declares a \`codeSyntax\`\n * for are emitted as that expression, so \`radius-md\` stays derived from \`--un-radius\`\n * instead of being frozen at 6px.\n */`,
  ),
  tsRecord(
    'cssScales',
    scaleValues({ ...scales, ...type, ...contract }, (e) => e.emitCss),
    `/**\n * The non-themed subset that becomes CSS custom properties.\n *\n * The raw radius ramp and the opacity ramp are excluded: both are consumed by Tailwind\n * utilities that are precompiled into the shipped stylesheet, so emitting them as variables\n * would add weight to the consumer's page for no override anyone would ever perform.\n */`,
  ),
].join('\n')

const semanticTs = [
  BANNER,
  `/**
 * The shadcn/ui role vocabulary, resolved per theme.
 *
 * Neutral ramp: ${config.neutral}. Change it in figma/figma.config.json and regenerate.
 */`,
  `export const figmaSemantic = {`,
  ...Object.entries(semantic).map(
    ([theme, tokens]) =>
      `  ${theme}: {\n` +
      sortedEntries(tokens)
        .map(([k, e]) => `    ${JSON.stringify(k)}: ${JSON.stringify(e.value)},`)
        .join('\n') +
      `\n  },`,
  ),
  `} as const`,
  ``,
  `/** Which primitive each role resolves through. Makes a colour diff say WHY, not just what. */`,
  `export const provenance = {`,
  ...Object.entries(semantic).map(
    ([theme, tokens]) =>
      `  ${theme}: {\n` +
      sortedEntries(tokens)
        .map(([k, e]) => `    ${JSON.stringify(k)}: ${JSON.stringify(e.via)},`)
        .join('\n') +
      `\n  },`,
  ),
  `} as const`,
  ``,
  `/** Figma variable descriptions, surfaced in the docs site. */`,
  tsRecord(
    'descriptions',
    Object.fromEntries(
      sortedEntries(referenceTheme ?? {})
        .filter(([, e]) => e.description)
        .map(([k, e]) => [k, e.description]),
    ),
    '',
  ),
  ``,
  `export type ThemeName = keyof typeof figmaSemantic`,
  // Keyed off ThemeName rather than a named theme, so dropping or adding a theme cannot break
  // this type the way hardcoding 'light' did.
  `export type FigmaSemanticToken = keyof (typeof figmaSemantic)[ThemeName]`,
  ``,
].join('\n')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'primitives.ts'), primitivesTs, 'utf8')
writeFileSync(resolve(OUT_DIR, 'figma-semantic.ts'), semanticTs, 'utf8')
writeFileSync(
  resolve(OUT_DIR, 'figma-report.json'),
  JSON.stringify(
    {
      generatedFrom: 'figma/exports',
      neutral: config.neutral,
      themes: Object.keys(semantic),
      counts: {
        palette: Object.keys(palette).length,
        brand: Object.keys(brand).length,
        scales: Object.keys(scales).length,
        type: Object.keys(type).length,
        contract: Object.keys(contract).length,
        semanticPerTheme: Object.keys(referenceTheme ?? {}).length,
      },
      renamed,
      unmapped,
    },
    null,
    2,
  ) + '\n',
  'utf8',
)

console.log(
  `figma → generated/  (${Object.keys(palette).length} palette · ${Object.keys(scales).length} scale · ` +
    `${Object.keys(type).length} type · ${Object.keys(contract).length} contract · ` +
    `${Object.keys(referenceTheme ?? {}).length} semantic × ${Object.keys(semantic).length} themes)`,
)
if (renamed.length) console.log(`  renamed: ${renamed.map((r) => `${r.from} → ${r.to}`).join(', ')}`)
