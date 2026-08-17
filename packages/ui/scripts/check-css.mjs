#!/usr/bin/env node
/**
 * A last look at the stylesheet before it is called built.
 *
 * The exit code already covers a syntax error — the CLI returns non-zero and the `&&` in the
 * build script stops here. What it does not cover is a build that SUCCEEDS and quietly produces
 * a stylesheet missing something load-bearing: a class renamed in one file and not the other, so
 * Tailwind never emits the rule and the component simply renders unstyled.
 *
 * So this asserts the output contains the handful of rules the library cannot function without.
 *
 * It deliberately does NOT compare timestamps. That was tried and gives a false failure: when the
 * input is unchanged Tailwind skips the write, which is correct behaviour and looks identical to
 * a stale file.
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'dist/styles.css')

const fail = (message) => {
  console.error(`\u2717 ${message}`)
  process.exit(1)
}

try {
  statSync(out)
} catch {
  fail('dist/styles.css does not exist — the CSS build did not run')
}

const css = readFileSync(out, 'utf8')

/**
 * Rules whose absence is silent at build time and obvious only in a browser.
 *
 * Matched with a trailing delimiter rather than by substring. A plain `includes('.un-glass-
 * floating')` is satisfied by `.un-glass-floatingXX`, so renaming a class in one file and not the
 * other slipped straight through the check meant to catch exactly that.
 */
const REQUIRED = [
  ['@layer unalyze-base', 'the token layer'],
  ['@layer unalyze-components', 'the component layer'],
  ['@layer unalyze-utilities', 'the utility layer'],
  ['button[data-un-component]', 'the user-agent control reset'],
  ['.un-glass-floating', 'the floating panel material'],
  ['.un-glass-panel', 'the card material'],
  ['.u\\:glass-edge', 'the glass rim'],
]

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const missing = REQUIRED.filter(
  // The selector must END here — followed by `{`, `,`, `:`, whitespace, or a combinator.
  ([needle]) => !new RegExp(`${escape(needle)}(?![\\w-])`).test(css),
)

if (missing.length) {
  fail(`dist/styles.css is missing:\n${missing.map(([n, why]) => `    ${why}  (${n})`).join('\n')}`)
}

console.log(`\u2713 styles.css ${(css.length / 1024).toFixed(1)} kB, all required rules present`)
