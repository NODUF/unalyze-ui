/**
 * Stage B — semantic layer → CSS custom properties, DTCG, and the public token contract.
 *
 * Runs after `figma-to-ts.ts`, as a separate process on purpose: stage A *writes* the modules
 * that `src/semantic.ts` imports, so a single process would capture a stale (or missing) copy.
 *
 * Three artefacts, three audiences:
 *   generated/tokens.css            → the consuming application
 *   generated/theme.css             → our own Tailwind build (never shipped as a public entry)
 *   generated/tokens.dtcg.json      → design tooling, and the reviewable record of provenance
 *   generated/tokens.contract.json  → CI gate G2
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { provenance } from '../generated/figma-semantic'
import {
  contrastPairs,
  globalTokens,
  textLeading,
  themes,
  tokenOrigin,
  type ThemeName,
} from '../src/semantic'
import { byName } from './lib/order'

const OUT_DIR = resolve(import.meta.dirname, '../generated')

const sorted = (record: Record<string, string>) =>
  Object.entries(record).sort(([a], [b]) => byName(a, b))

const declarations = (record: Record<string, string>, indent: string) =>
  sorted(record)
    .map(([name, value]) => `${indent}--un-${name}: ${value};`)
    .join('\n')

const BANNER = `/**
 * GENERATED FILE — do not edit.
 *
 * Source: figma/exports/*.json → packages/tokens/src/semantic.ts
 * Regenerate: pnpm tokens
 */`

/* ------------------------------------------------------------------ *
 * tokens.css — what the consuming application imports
 * ------------------------------------------------------------------ */

/**
 * Everything sits in `@layer unalyze-base`, and that layer is declared before any other.
 *
 * Cascade layers rank below unlayered CSS, so the consuming app can override any token from
 * their ordinary stylesheet without `!important` and without knowing our selector specificity.
 * That is the whole override story for a package dropped into a codebase we do not control.
 *
 * `:root` carries the dark theme, so tokens resolve on first paint — before any theme script runs
 * — and an app that sets no attribute at all gets the presentation the product was designed in.
 * `prefers-color-scheme` is deliberately NOT wired up: there is one theme, and even once there
 * are two the consuming application decides which applies, not the user's OS.
 */
const tokensCss = `${BANNER}

@layer unalyze-base, unalyze-components;

@layer unalyze-base {
  :root {
${declarations(globalTokens, '    ')}
  }

  /*
   * Dark, and only dark. The attribute selector is emitted alongside :root so an app that sets
   * data-un-theme="dark" explicitly still resolves, and so adding a second theme later is one
   * more block rather than a change of shape.
   */
  :root,
  [data-un-theme='dark'] {
${declarations(themes.dark, '    ')}
    color-scheme: dark;
  }
}
`

/* ------------------------------------------------------------------ *
 * theme.css — internal Tailwind v4 bridge
 * ------------------------------------------------------------------ */

/**
 * `@theme inline` is what makes `un:bg-primary` compile to `var(--un-primary)` rather than to a
 * snapshot of the value. Without `inline`, switching `data-un-theme` would change the variables
 * but not the utilities that were built from them.
 *
 * Shadows are excluded from the colour namespace: registering one as a colour would generate
 * `bg-elevation-raised` as `background-color: 0 1px 2px …`, which is invalid CSS that silently
 * paints nothing. `overlay-scrim` is a real colour and stays in.
 *
 * Only themed tokens are scanned here, and the only non-colours among them are the shadows.
 */
const NON_COLOUR = /^elevation-/

// Any theme will do — every theme defines the same keys. Naming one explicitly is what breaks
// when that theme is dropped, so the first is taken positionally instead.
const [referenceTheme] = Object.values(themes)

const colorEntries = Object.keys(referenceTheme ?? {})
  .filter((k) => !NON_COLOUR.test(k))
  .sort()
  .map((k) => `  --color-${k}: var(--un-${k});`)
  .join('\n')

const themeCss = `${BANNER}

/*
 * \`inline\` makes utilities resolve to \`var(--un-…)\` rather than to a snapshot of the value, so a
 * \`data-un-theme\` swap re-colours live. \`reference\` stops Tailwind emitting theme variables of
 * its own — nothing but our namespaced tokens reaches the consumer's page.
 */
@theme inline reference {
  /* colours — every role, resolved live through its custom property */
${colorEntries}

  /* type — each size carries its paired line height, see textLeading in semantic.ts */
${Object.keys(globalTokens)
  .filter((k) => k.startsWith('text-'))
  .sort()
  .flatMap((k) => {
    const name = k.slice('text-'.length)
    const lines = [`  --text-${name}: var(--un-${k});`]
    const leading = textLeading[k]
    if (leading) lines.push(`  --text-${name}--line-height: ${leading};`)
    return lines
  })
  .join('\n')}

  /* line heights */
${Object.keys(globalTokens)
  .filter((k) => k.startsWith('leading-'))
  .sort()
  .map((k) => `  --leading-${k.slice('leading-'.length)}: var(--un-${k});`)
  .join('\n')}

  /*
   * Spacing is ONE multiplier, not a list.
   *
   * Tailwind v4 derives every numeric spacing utility as \`calc(var(--spacing) * n)\`. Emitting
   * the scale as individual \`--spacing-4\` entries would look tidier and quietly break the
   * fractional and \`px\` steps, because \`p-0.5\` and \`p-px\` have no matching key. Our scale is
   * the Tailwind scale — 1 = 4px — so a single multiplier reproduces all of it exactly.
   */
  --spacing: var(--un-space-1);

  /*
   * Radii follow the shadcn convention: \`rounded-lg\` is the base knob and the smaller steps are
   * derived from it, so a consumer setting \`--un-radius\` reshapes every control at once.
   */
  --radius-sm: var(--un-radius-sm);
  --radius-md: var(--un-radius-md);
  --radius-lg: var(--un-radius);
  --radius-xl: calc(var(--un-radius) + 4px);
  --radius-DEFAULT: var(--un-radius-md);
  --radius-full: 9999px;

  /* fonts */
  --font-sans: var(--un-font-sans);
  --font-serif: var(--un-font-serif);
  --font-mono: var(--un-font-mono);
  --font-display: var(--un-font-display);

  /* easing */
${Object.keys(globalTokens)
  .filter((k) => k.startsWith('ease-'))
  .sort()
  .map((k) => `  --ease-${k.slice('ease-'.length)}: var(--un-${k});`)
  .join('\n')}
}
`

/* ------------------------------------------------------------------ *
 * tokens.dtcg.json — the reviewable record
 * ------------------------------------------------------------------ */

interface DtcgToken {
  $type: string
  $value: string | Record<string, string>
  $description?: string
  $extensions?: Record<string, unknown>
}

const dtcgType = (name: string, value: string): string => {
  if (/^#|^rgba?\(/.test(value)) return 'color'
  if (name.startsWith('duration-')) return 'duration'
  if (name.startsWith('ease-')) return 'cubicBezier'
  if (name.startsWith('elevation-')) return 'shadow'
  if (name.startsWith('font-')) return 'fontFamily'
  if (name.startsWith('weight-')) return 'fontWeight'
  if (/px$/.test(value) || /^calc\(/.test(value)) return 'dimension'
  return 'other'
}

const dtcg: Record<string, DtcgToken> = {}

for (const [name, value] of sorted(globalTokens)) {
  dtcg[name] = {
    $type: dtcgType(name, value),
    $value: value,
    $extensions: { 'com.unalyze.origin': tokenOrigin[name] ?? 'code' },
  }
}

for (const [name] of sorted(referenceTheme ?? {})) {
  const perTheme = Object.fromEntries(
    (Object.keys(themes) as ThemeName[]).map((t) => [t, themes[t][name] as string]),
  )
  dtcg[name] = {
    $type: dtcgType(name, Object.values(perTheme)[0] as string),
    $value: perTheme,
    $extensions: {
      'com.unalyze.origin': tokenOrigin[name] ?? 'code',
      // Which Figma primitive the role resolves through. This is what turns a colour diff from
      // "#0f172a → #1e293b" into "primary: slate/900 → slate/800".
      'com.unalyze.via': {
        ...Object.fromEntries(
          Object.entries(provenance).map(([theme, table]) => [
            theme,
            (table as Record<string, string>)[name] ?? '',
          ]),
        ),
      },
    },
  }
}

/* ------------------------------------------------------------------ *
 * tokens.contract.json — gate G2
 * ------------------------------------------------------------------ */

/**
 * The public surface: every custom property a consumer may reference. Removing or renaming one
 * is a breaking change for their stylesheet, so this file is diffed in CI and the diff decides
 * whether the release is a minor or a major.
 */
const contract = {
  $comment:
    'Public token surface. A removed or renamed entry is a BREAKING change — bump major. ' +
    'Generated by scripts/emit.ts; diffed by CI gate G2.',
  themes: Object.keys(themes) as ThemeName[],
  global: Object.keys(globalTokens).sort().map((k) => `--un-${k}`),
  themed: Object.keys(referenceTheme ?? {}).sort().map((k) => `--un-${k}`),
  contrastPairs: contrastPairs.map((p) => `${p.fg} on ${p.bg} ≥ ${p.minRatio}`),
}

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'tokens.css'), tokensCss, 'utf8')
writeFileSync(resolve(OUT_DIR, 'theme.css'), themeCss, 'utf8')
writeFileSync(resolve(OUT_DIR, 'tokens.dtcg.json'), JSON.stringify(dtcg, null, 2) + '\n', 'utf8')
writeFileSync(
  resolve(OUT_DIR, 'tokens.contract.json'),
  JSON.stringify(contract, null, 2) + '\n',
  'utf8',
)

console.log(
  `tokens → generated/tokens.css  (${contract.global.length} global · ` +
    `${contract.themed.length} themed × ${contract.themes.length} themes)`,
)
