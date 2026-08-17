#!/usr/bin/env node
/**
 * Prepends `'use client'` to the built bundles.
 *
 * Why this is not done by tsup's `banner`: the bundler treats a module-level directive as a
 * directive rather than as text, warns "Module level directives cause errors when bundled", and
 * drops it. The build then looks completely successful and produces a package that throws
 * "You're importing a component that needs useContext" the first time a React Server Component
 * imports it — in someone else's repo, not ours.
 *
 * `verify-package.test.ts` asserts the directive is present, so if a future tsup version starts
 * handling this itself and this script becomes a no-op, nothing silently regresses.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIRECTIVE = "'use client';\n"
const dist = resolve(import.meta.dirname, '../dist')
const targets = ['index.js', 'index.cjs']

for (const file of targets) {
  const path = resolve(dist, file)
  const source = readFileSync(path, 'utf8')

  if (/^['"]use client['"]/.test(source)) continue

  // CJS starts with 'use strict'; the client directive must come first to be recognised.
  writeFileSync(path, DIRECTIVE + source, 'utf8')
}

console.log(`use client → dist/{${targets.join(',')}}`)
