/**
 * Gate G5 — the conformance suite.
 *
 * Every exported component runs through this. It is not a substitute for a component's own
 * behavioural tests; it is the floor beneath them.
 *
 * The reason it exists: thirty-five components written over several weeks drift. One forgets to
 * forward its ref, another drops `className`, a third loses its `displayName` and turns every
 * React DevTools tree into a wall of `Anonymous`. Each is trivial in isolation and invisible in
 * review, and together they are what makes a library feel unreliable to the team consuming it.
 *
 * What it deliberately does NOT check: anything that needs real layout or a real cascade. jsdom
 * does not resolve custom properties, apply cascade layers or compute contrast. Visual truth is
 * gate G6 (Playwright) and the preview app; this file checks contracts.
 */

import { createRef, type ComponentType } from 'react'
import { render } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { UnalyzeProvider, type UnalyzeTheme } from '../provider'

// One theme today. Kept as a list so adding another needs no change here.
const THEMES: UnalyzeTheme[] = ['dark']

export interface ConformanceOptions<P> {
  /** Display name, and the expected value of `data-un-component`. */
  name: string
  Component: ComponentType<P>
  /** Minimum props needed to render. */
  requiredProps: P
  /**
   * Variant props to exercise, as `{ propName: [values] }`. Each value is rendered on its own —
   * one axis at a time, not the full cartesian product, which for Button alone would be 90
   * renders to catch bugs that a single axis already catches.
   */
  variants?: Record<string, readonly unknown[]>
  /**
   * Set when the rendered root is not the element the ref points at, or when the component
   * renders no DOM root of its own.
   */
  skipRefTest?: boolean
  /**
   * Selector for the element that unknown props land on, when it is not the root.
   *
   * A control that draws its own visuals wraps a real input in a label: the label is the root and
   * carries the styling, but `name`, `onChange` and every aria attribute belong on the input, or
   * the control cannot participate in a form. Both are correct, and the suite has to be told
   * which is which rather than assuming.
   */
  propsTarget?: string
}

export function describeConformance<P extends Record<string, unknown>>({
  name,
  Component,
  requiredProps,
  variants = {},
  skipRefTest = false,
  propsTarget,
}: ConformanceOptions<P>) {
  describe(`${name} — conformance`, () => {
    it('has a displayName', () => {
      // Without this every DevTools tree and every error boundary stack says "Anonymous".
      expect(Component.displayName ?? Component.name).toBe(name)
    })

    it('marks its root with data-un-component', () => {
      // The attribute is the library's own hook for focus styling and for the consuming team's
      // overrides. A component missing it is invisible to both.
      const { container } = render(<Component {...requiredProps} />)
      const root = container.querySelector(`[data-un-component="${name.toLowerCase()}"]`)
      expect(root, `no element with data-un-component="${name.toLowerCase()}"`).not.toBeNull()
    })

    it.skipIf(skipRefTest)('forwards its ref to a DOM element', () => {
      const ref = createRef<HTMLElement>()
      render(<Component {...requiredProps} ref={ref} />)
      expect(ref.current).toBeInstanceOf(Element)
    })

    it('keeps a caller className and its own base class', () => {
      // Both halves matter. Replacing our class breaks the documented override hook; dropping
      // theirs breaks every layout the consuming team writes around our components.
      const { container } = render(<Component {...requiredProps} className="caller-class" />)
      const root = container.firstElementChild as HTMLElement
      expect(root.className).toContain('caller-class')
      expect(root.className).toContain(`un-${name.toLowerCase()}`)
    })

    it('spreads unknown DOM props', () => {
      const { container } = render(
        <Component {...requiredProps} data-testid="spread" aria-label="spread" />,
      )
      const target = (
        propsTarget ? container.querySelector(propsTarget) : container.firstElementChild
      ) as HTMLElement
      expect(target, `nothing matched ${propsTarget ?? 'the root'}`).not.toBeNull()
      expect(target.getAttribute('data-testid')).toBe('spread')
      expect(target.getAttribute('aria-label')).toBe('spread')
    })

    for (const [prop, values] of Object.entries(variants)) {
      it(`renders every "${prop}" value`, () => {
        for (const value of values) {
          const { container, unmount } = render(
            <Component {...requiredProps} {...{ [prop]: value }} />,
          )
          expect(container.firstElementChild, `${prop}=${String(value)} rendered nothing`).not.toBeNull()
          unmount()
        }
      })
    }

    for (const theme of THEMES) {
      it(`renders inside a ${theme}-theme provider`, () => {
        // jsdom cannot resolve custom properties, so this asserts wiring, not colour: the
        // component renders, and the theme attribute reaches its subtree. Colour is G6/G7.
        const { container } = render(
          <UnalyzeProvider theme={theme} applyThemeToDocument={false}>
            <Component {...requiredProps} />
          </UnalyzeProvider>,
        )
        expect(container.querySelector(`[data-un-theme="${theme}"]`)).not.toBeNull()
        expect(container.querySelector('[data-un-component]')).not.toBeNull()
      })
    }

    it('has no axe violations', async () => {
      const { container } = render(<Component {...requiredProps} />)

      const results = await axe.run(container, {
        rules: {
          // Needs real layout and a real cascade, neither of which jsdom has. Contrast is
          // asserted for real against the token values in @noduf/unalyze-tokens (gate G7).
          'color-contrast': { enabled: false },
          // The fragment under test is not a document.
          region: { enabled: false },
        },
      })

      const summary = results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')
      expect(results.violations, summary).toHaveLength(0)
    })
  })
}
