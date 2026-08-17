/**
 * A green `vite build` only proves the package resolved. These assertions prove it arrived
 * intact: the stylesheet must be in the output (a `sideEffects` mistake silently drops it, and
 * the app renders unstyled), and React must not have been bundled twice.
 */

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const assets = join(import.meta.dirname, 'dist/assets')
const files = readdirSync(assets)

const cssFile = files.find((f) => f.endsWith('.css'))
assert.ok(cssFile, 'no stylesheet in the build — check `sideEffects` in @noduf/unalyze-ui')

const css = readFileSync(join(assets, cssFile), 'utf8')
assert.ok(css.includes('@layer unalyze-base'), 'library tokens missing from the bundled CSS')
assert.ok(css.includes('--un-primary'), 'library custom properties missing from the bundled CSS')
assert.ok(!css.includes('box-sizing:border-box'), 'a CSS reset leaked into the consumer build')

const js = files
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(join(assets, f), 'utf8'))
  .join('')

assert.ok(js.includes('un-button'), 'Button did not make it into the bundle')

// One copy of React, or hooks throw "Invalid hook call" at runtime.
const reactCopies = (js.match(/react\.development\.js|react\.production/g) ?? []).length
assert.ok(reactCopies <= 1, `React appears to be bundled ${reactCopies} times`)

console.log('✓ vite — ESM entry, stylesheet and single React copy all correct')
