import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Browser APIs jsdom does not implement, which Radix's positioned overlays rely on.
 *
 * These are stubs, not simulations — they exist so a component can mount and be driven by
 * keyboard and pointer events. Anything that depends on real measurement (does the menu flip
 * above the trigger near the viewport edge?) cannot be tested here at all, and belongs to the
 * Playwright pass instead. Without them, `Select` and `DropdownMenu` throw on open and the
 * failure looks like a component bug rather than a missing environment API.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

afterEach(cleanup)
