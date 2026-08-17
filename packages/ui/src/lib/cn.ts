import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `tailwind-merge` must be told about our prefix.
 *
 * Without it, `twMerge` does not recognise `u:px-4` as a padding utility, so a caller passing
 * `u:px-8` would end up with both classes on the element and the winner decided by stylesheet
 * order rather than by intent. The failure is silent — the element just has the wrong padding.
 *
 * The prefix is `u`, not `un`, and that is deliberate: see the namespace note in `styles.css`.
 */
const twMerge = extendTailwindMerge({ prefix: 'u' })

/**
 * Combines class names and resolves Tailwind conflicts.
 *
 * Only OUR prefixed utilities are deduplicated. A class the consumer passes from their own
 * Tailwind (`mt-4`, unprefixed) is left untouched and simply rides along — which is correct:
 * we have no way to know their config, and silently dropping their class would be worse than
 * letting the cascade decide.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
