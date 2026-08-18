/**
 * One comparator for everything that feeds a generated file.
 *
 * `localeCompare` was the obvious choice and the wrong one: it sorts by the HOST's collation, so
 * the same input produced a different key order on macOS than on Linux CI. Gate G1 regenerates the
 * tokens and fails on any diff, which meant CI could never pass — the committed files were correct
 * for the machine that wrote them and for no other.
 *
 * It is not fixable by naming a locale either. ICU data ships with Node, and a collation can change
 * between Node builds; an `en` sort is stable across machines only until someone upgrades.
 *
 * Comparing code points has none of that. It is what `Array.prototype.sort` does by default, it is
 * defined by the string itself rather than by anything around it, and it gives the same answer
 * everywhere forever. The order it produces is not the one a human would pick for a phone book —
 * uppercase sorts before lowercase — but nothing here is read as a phone book.
 */
export const byName = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
