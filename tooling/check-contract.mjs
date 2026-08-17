#!/usr/bin/env node
/**
 * Gate G2 — token contract diff.
 *
 * Usage: node tooling/check-contract.mjs <base.json> <head.json>
 *
 * A consuming application writes `color: var(--un-muted-foreground)` in its own stylesheet. When
 * we rename or delete that property their page breaks, and nothing in a TypeScript build will
 * catch it — CSS has no type system. This script is that type system: removals fail the build
 * unless the release is explicitly marked major.
 *
 * Additions are reported but never fail. A new token is a minor.
 *
 * Deliberately dependency-free so it runs in CI before `pnpm install` if it has to.
 */

import { readFileSync } from 'node:fs'

const [, , basePath, headPath] = process.argv

if (!basePath || !headPath) {
  console.error('usage: check-contract.mjs <base.json> <head.json>')
  process.exit(2)
}

const read = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    // A missing base is the normal case on the very first commit and on a new branch that adds
    // the file. Treat it as "nothing existed before", not as a failure.
    if (error.code === 'ENOENT') return null
    throw error
  }
}

const base = read(basePath)
const head = read(headPath)

if (!head) {
  console.error(`✗ ${headPath} does not exist. Run \`pnpm tokens\` and commit the result.`)
  process.exit(1)
}

if (!base) {
  console.log('· no base contract to compare against — treating every token as new')
  process.exit(0)
}

const surfaceOf = (contract) =>
  new Set([...(contract.global ?? []), ...(contract.themed ?? [])])

const before = surfaceOf(base)
const after = surfaceOf(head)

const removed = [...before].filter((token) => !after.has(token)).sort()
const added = [...after].filter((token) => !before.has(token)).sort()

// A theme is part of the contract too: dropping `dark` breaks every consumer that sets
// data-un-theme="dark", even though no individual token disappeared.
const themesBefore = new Set(base.themes ?? [])
const themesAfter = new Set(head.themes ?? [])
const themesRemoved = [...themesBefore].filter((t) => !themesAfter.has(t))

if (added.length) {
  console.log(`+ ${added.length} new token(s) — minor release:`)
  for (const token of added) console.log(`    ${token}`)
}

if (!removed.length && !themesRemoved.length) {
  console.log(`✓ token contract intact (${after.size} public properties)`)
  process.exit(0)
}

console.error('')
console.error('✗ BREAKING: the public token contract lost entries.')
console.error('')
for (const token of removed) console.error(`    removed  ${token}`)
for (const theme of themesRemoved) console.error(`    removed  theme "${theme}"`)
console.error('')
console.error('  A consumer may be referencing these from their own stylesheet, where nothing')
console.error('  will fail at build time. Either:')
console.error('')
console.error('    · keep the old name as an alias in packages/tokens/src/semantic.ts, or')
console.error('    · ship it as a MAJOR release: `pnpm changeset` → major, and record the')
console.error('      rename in docs/MIGRATION.md so their team can find-and-replace.')
console.error('')
process.exit(1)
