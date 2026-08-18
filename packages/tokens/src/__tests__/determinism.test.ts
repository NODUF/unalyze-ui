/**
 * Gate G1 has a precondition nobody states: generation has to produce the same bytes on every
 * machine. It did not.
 *
 * Everything feeding a generated file was sorted with `localeCompare`, which orders by the HOST's
 * collation. macOS and Linux disagreed, so the committed files were correct for the laptop that
 * wrote them and wrong for CI — and G1, whose whole job is to fail on a diff, failed on every run
 * with a message about drift that no amount of regenerating locally could fix.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SCRIPTS = resolve(import.meta.dirname, '../../scripts')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.ts') ? [path] : []
  })

describe('generation is machine-independent', () => {
  it('sorts by code point, never by locale', () => {
    const offenders = walk(SCRIPTS)
      .map((path) => [path, readFileSync(path, 'utf8')] as const)
      // `lib/order.ts` explains the ban in prose and necessarily names it.
      .filter(([path]) => !path.endsWith('lib/order.ts'))
      .filter(([, source]) => source.includes('localeCompare'))
      .map(([path]) => path.slice(SCRIPTS.length + 1))

    expect(
      offenders,
      `these sort by host collation, so CI will disagree with a laptop:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  it('bans a comparator that genuinely disagrees, not a hypothetical one', () => {
    /**
     * The point of the ban, demonstrated rather than asserted.
     *
     * `localeCompare` treats `/` as punctuation to skip at the primary strength, so it orders
     * `Chart/Magenta 400` against `Green 500` by the letters alone. A code-point sort compares the
     * `/` itself. That single difference is what moved four chart tokens in `primitives.ts` and
     * made the committed files disagree with CI.
     */
    const sample = ['Chart/Magenta 400', 'Green 500', 'chart/violet-400', 'Iso', 'ısı']
    const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

    const codePointOrder = [...sample].sort(byCodePoint)
    const disagreeing = ['en-US', 'cs-CZ', 'de-DE', 'tr-TR', 'sv-SE'].filter((locale) => {
      const localeOrder = [...sample].sort((a, b) => a.localeCompare(b, locale))
      return JSON.stringify(localeOrder) !== JSON.stringify(codePointOrder)
    })

    // If this ever comes back empty, the sample stopped exercising the difference and the test
    // above is guarding nothing.
    expect(
      disagreeing.length,
      'no locale disagrees with the code-point order — this sample no longer proves anything',
    ).toBeGreaterThan(0)
  })
})
