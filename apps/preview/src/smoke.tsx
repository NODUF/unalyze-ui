/**
 * Smoke test for the review page itself.
 *
 * The preview is the surface a design decision gets approved on, so a blank preview is worse than
 * no preview: the build is green, the file is the right size, and the page shows nothing.
 *
 * It cannot be checked by loading the built HTML in jsdom — Vite emits `<script type="module">`
 * and jsdom does not execute ES modules, so it reports a clean run and an empty DOM. So this
 * renders the same component tree server-side instead. Bundling is covered by the vite fixture;
 * this covers the tree.
 *
 * Run: pnpm --filter @noduf/unalyze-preview verify
 */

import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { Preview } from './preview'

const html = renderToString(createElement(Preview))
const count = (re: RegExp) => (html.match(re) ?? []).length

/**
 * Floors, not targets — set just under what a correct render produces, so the check fails on a
 * section disappearing rather than on a section growing. Recalibrated when the page went to a
 * single theme pane; every count roughly halved, which is expected and not a regression.
 */
const checks: { label: string; found: number; min: number }[] = [
  // 18 (3 sizes × 6 variants) + 6 states + 1 block + 3 override = 28.
  { label: 'buttons', found: count(/data-un-component="button"/g), min: 26 },
  { label: 'surfaces', found: count(/data-un-component="surface"/g), min: 20 },
  { label: 'text runs', found: count(/data-un-component="text"/g), min: 200 },
  { label: 'theme pane', found: count(/data-un-theme="/g), min: 1 },
  // Every swatch paints a literal colour. Zero means the token import resolved to nothing.
  { label: 'colour swatches', found: count(/background:\s*(#|rgb)/g), min: 40 },
  // Asserted on the attribute, not on the rendered text: React splits interpolated text into
  // separate nodes and SSR puts `<!-- -->` markers between them, so a text-based match reports
  // zero on a page that is rendering perfectly well.
  { label: 'contrast figures', found: count(/data-contrast="\d/g), min: 36 },
  // Default locale is English; the Czech copy is behind the interactive toggle.
  { label: 'english labels', found: count(/Continue/g), min: 15 },
  // The form controls hide a real input behind their visuals. If one ever renders as a bare div
  // it disappears from the tab order and from the form, and nothing else here would notice.
  { label: 'real inputs', found: count(/<input/g), min: 12 },
  { label: 'labels bound to a control', found: count(/<label[^>]*for="/g), min: 4 },
]

let failed = false
for (const { label, found, min } of checks) {
  const ok = found >= min
  if (!ok) failed = true
  console.log(`${ok ? '✓' : '✗'} ${label}: ${found}${min ? ` (min ${min})` : ''}`)
}

if (failed) {
  console.error('\nThe preview renders less than it should. A published review page would be wrong.')
  process.exit(1)
}
console.log('\n✓ preview renders')
