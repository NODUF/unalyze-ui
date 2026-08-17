/**
 * Gate G8, first half — the shipped artefact.
 *
 * Every assertion here corresponds to a way a package can build cleanly and still be broken in
 * someone else's repository. None of them is caught by a type check or by a component test,
 * because none of them is about the source — they are about what actually goes in the tarball.
 *
 * The second half of G8 is the fixture matrix: real applications installing the packed tarball.
 * This file is the fast check that runs on every commit.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = resolve(import.meta.dirname, '../..')
const dist = (file: string) => resolve(PKG_ROOT, 'dist', file)
const pkg = JSON.parse(readFileSync(resolve(PKG_ROOT, 'package.json'), 'utf8')) as {
  exports: Record<string, string | Record<string, string>>
  peerDependencies: Record<string, string>
  dependencies: Record<string, string>
  files: string[]
  sideEffects: string[]
}

describe('shipped bundles', () => {
  it.each(['index.js', 'index.cjs'])('%s starts with the client directive', (file) => {
    // Without it, the first React Server Component that imports us throws
    // "You're importing a component that needs useContext" — at the consumer's build, not ours.
    // The bundler drops a `banner`-supplied directive with only a warning, which is why this is
    // asserted rather than trusted.
    const source = readFileSync(dist(file), 'utf8')
    expect(source.startsWith("'use client';")).toBe(true)
  })

  it('does not bundle react', () => {
    // A second copy of React in the consumer's tree produces "Invalid hook call" at runtime.
    const source = readFileSync(dist('index.js'), 'utf8')
    expect(source).toMatch(/from ['"]react['"]/)
    expect(source).not.toMatch(/ReactCurrentDispatcher|__SECRET_INTERNALS/)
  })

  it('declares react as a peer, never as a dependency', () => {
    expect(pkg.peerDependencies.react).toBeDefined()
    expect(pkg.dependencies.react).toBeUndefined()
    expect(pkg.dependencies['react-dom']).toBeUndefined()
  })

  it('resolves every path in the exports map', () => {
    const paths: string[] = []
    for (const entry of Object.values(pkg.exports)) {
      if (typeof entry === 'string') paths.push(entry)
      else paths.push(...Object.values(entry))
    }
    for (const path of paths) {
      expect(existsSync(resolve(PKG_ROOT, path)), `${path} is in exports but not on disk`).toBe(
        true,
      )
    }
  })

  it('leaves Radix external rather than inlining it', () => {
    // A consuming app that already uses Radix must be able to dedupe against ours. Two copies of
    // a primitive that keeps context — the tooltip provider, the dialog's focus scope — means the
    // provider in one copy is invisible to the components in the other, and the failure looks
    // like "tooltips just don't open" rather than like a duplicate dependency.
    const source = readFileSync(dist('index.js'), 'utf8')
    expect(source).toMatch(/from ['"]@radix-ui\/react-dialog['"]/)
    // Radix's own internals appearing here would mean the source was inlined.
    expect(source).not.toMatch(/function createCollection|useComposedRefs\s*\(/)
  })

  it('stays within its JavaScript budget', () => {
    // Our own code only — Radix and React are external. Raise this deliberately, in a PR, with a
    // reason; a package that grows unnoticed is a bundle regression in every consuming app.
    const kb = readFileSync(dist('index.js')).byteLength / 1024
    expect(kb, `index.js is ${kb.toFixed(1)} kB`).toBeLessThan(80)
  })

  it('marks CSS as having side effects so bundlers keep it', () => {
    // `sideEffects: false` would let a bundler tree-shake the stylesheet import away and ship an
    // unstyled application.
    expect(pkg.sideEffects).toContain('*.css')
  })
})

describe('shipped stylesheet', () => {
  const css = readFileSync(dist('styles.css'), 'utf8')
  /** Comments carry URLs, and `tailwindcss.com` reads as a class selector to any naive scan. */
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')

  it('contains no GLOBAL CSS reset', () => {
    // Tailwind's preflight would restyle every heading, list and form control on the consumer's
    // page. A component library has no business resetting a document it does not own.
    expect(css).not.toContain('box-sizing:border-box')
    expect(css).not.toMatch(/h1,\s*h2,\s*h3/)
  })

  it('DOES neutralise user-agent control styling on its own elements', () => {
    /**
     * The other half of shipping no preflight, and the half that was missing.
     *
     * Without it every `<button>` the library renders keeps the user agent's `1px outset
     * ButtonBorder` and `ButtonFace` background — on a black canvas, a grey ring around every tab
     * and a grey slab behind any control that sets no background of its own. It looked like a
     * component bug and it was a missing reset.
     *
     * Scoped to `[data-un-component]` with element selectors, so it touches only our own form
     * controls and never the consumer's document.
     */
    expect(css, 'no appearance reset ships').toMatch(/button\[data-un-component\]/)
    expect(css).toContain('appearance:none')

    // Scoped, not global: a bare `button{...}` rule would restyle their page.
    const bareControlRule = /(^|[},])\s*(button|input|select|textarea)\s*[,{]/
    expect(rules, 'a bare element selector would leak into the consuming page').not.toMatch(
      bareControlRule,
    )
  })

  it('emits no unnamespaced custom properties', () => {
    // Anything not `--un-*` or `--tw-*` risks colliding with the consumer's own variables.
    // `--tw-*` are Tailwind's internal utility slots and are scoped to our own utilities.
    const declared = [...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1] as string)
    const foreign = [...new Set(declared)].filter(
      (name) => !name.startsWith('--un-') && !name.startsWith('--tw-'),
    )
    expect(foreign, `unnamespaced custom properties: ${foreign.join(', ')}`).toEqual([])
  })

  it('declares no custom property that references itself', () => {
    /**
     * This is the assertion that was missing when the bug it guards against actually shipped.
     *
     * Tailwind derives its theme variable names from the class prefix. With `prefix(un)` its own
     * `--text-sm` became `--un-text-sm` — the same name as our token — in a HIGHER cascade layer,
     * emitting `--un-text-sm: var(--un-text-sm)`. CSS treats a self-referencing custom property
     * as invalid, so the entire type and radius scale silently disappeared while every other
     * check stayed green: the names were all correctly namespaced, the utilities all referenced
     * tokens, and the build reported success.
     */
    const selfReferencing = [...css.matchAll(/(--[a-z0-9-]+)\s*:\s*var\(\s*(--[a-z0-9-]+)/gi)]
      .filter((m) => m[1] === m[2])
      .map((m) => m[1] as string)

    expect(
      [...new Set(selfReferencing)],
      `self-referencing custom properties: ${[...new Set(selfReferencing)].join(', ')}`,
    ).toEqual([])
  })

  it('emits no unprefixed utility classes', () => {
    // An unprefixed `.bg-primary` would fight the consumer's Tailwind and win or lose by parse
    // order. Our `u:` utilities and our `.un-*` component hooks are the only classes allowed.
    //
    // Matched on the first characters after the dot rather than on a whole class name: names
    // like `.u\:shadow-\[var\(--un-elevation-flat\)\]` contain escaped brackets that defeat any
    // reasonable "whole name" pattern.
    const violations = [...rules.matchAll(/\.(?!u\\:)(?!un-)[a-zA-Z_-][a-zA-Z0-9_-]*/g)].map(
      (m) => m[0],
    )
    expect(
      [...new Set(violations)],
      `unprefixed classes: ${[...new Set(violations)].slice(0, 10).join(', ')}`,
    ).toEqual([])
  })

  it('wraps everything in our own cascade layers', () => {
    // Layers rank below unlayered CSS, so the consuming app overrides us without !important.
    expect(css).toContain('@layer unalyze-base')
    expect(css).toContain('@layer unalyze-components')
    expect(css).toContain('@layer unalyze-utilities')
  })

  it('resolves colour utilities through tokens rather than baking values in', () => {
    // If a utility compiled to a literal hex, switching data-un-theme would change nothing.
    expect(css).toContain('.u\\:bg-primary{background-color:var(--un-primary)}')
    expect(css).not.toMatch(/\.u\\:bg-primary\{background-color:#/)
  })

  it('resolves the radius utilities through tokens, at the design\'s own values', () => {
    // Utilities must reference the token, not a baked-in pixel value, or a consumer overriding
    // --un-radius changes nothing.
    expect(css).toContain('.u\\:rounded-lg{border-radius:var(--un-radius)}')
    expect(css).toContain('.u\\:rounded-md{border-radius:var(--un-radius-md)}')

    // 32px is the design's panel radius. The two smaller rungs are derived — the design's
    // controls are all pills, so it settles no mid-size radius at all — and they are nested:
    // a menu row at 8 sits 4px inside its panel at 12, which keeps the two concentric.
    expect(css).toMatch(/--un-radius:\s*32px/)
    expect(css).toMatch(/--un-radius-md:\s*12px/)
    expect(css).toMatch(/--un-radius-sm:\s*8px/)

    // Stock shadcn derives the smaller steps as `calc(var(--radius) - 2px)`, which at a 32px base
    // gives 30 and 28 — two steps nobody can distinguish and neither of which is drawn.
    expect(css).not.toMatch(/--un-radius-md:\s*calc\(/)
  })

  it('never lets a translucent fill degrade to a solid one', () => {
    /**
     * Tailwind emits a solid-colour fallback ahead of every `color-mix()` value, for browsers
     * that lack it. For a fill written as `color-mix(… var(--un-x) 10%, transparent)` that
     * fallback is `var(--un-x)` — fully opaque. A 10 % veil silently becomes a grey slab, and it
     * looks like a component bug rather than a fallback.
     *
     * Translucent surfaces therefore come from tokens with the alpha already in them.
     * `color-mix` is still fine for a colour that is opaque either way, such as a text tone.
     */
    const offenders = [
        ...css.matchAll(/\.u\\:[^{]*\\:bg-\\\[color-mix[^{]*\{background-color:var\((--un-[a-z-]+)\)\}/g),
      ].map((m) => m[1] as string)

    expect(
      [...new Set(offenders)],
      `these background fills fall back to an opaque colour: ${offenders.join(', ')}`,
    ).toEqual([])
  })

  it('ships the glass material as one composable surface', () => {
    /**
     * The card and the floating panel are the same material — the design's modal is a card with a
     * black backing under the same veil, rim, paired inner shadows and 20 px blur. Overlays were
     * opaque at first on the grounds that a translucent menu shows the chart through its text,
     * which ignored that the blur is precisely what prevents that.
     */
    // Both members share the rim's companion — the paired inner light and the seating shadow.
    expect(css).toMatch(/\.un-glass-panel\s*,\s*\.un-glass-floating\{box-shadow/)

    /**
     * Tint and veil are two layers of ONE `background-image`. As two declarations in one cascade
     * layer they overwrote each other, and a tinted card silently lost one of them depending on
     * source order.
     */
    const fillDecls = css.match(/background-image:linear-gradient\(var\(--un-tint/g) ?? []
    expect(fillDecls.length, 'the tint is set from more than one place again').toBe(1)
  })

  it('spends the backdrop blur on cards only', () => {
    /**
     * A floating panel — dropdown, select, dialog, tooltip — is OPAQUE, and keeps only the rim
     * and the inner light. Translucency over arbitrary content needs a backdrop blur to stay
     * readable, and a blur costs a compositing layer per menu that repaints whenever anything
     * behind it moves. The two go together or not at all, so both were dropped there.
     *
     * A card keeps both: it sits on the page canvas rather than over content, so it is readable
     * either way, and its blur is what picks up the ambient glow behind the layout.
     */
    const floating = css.match(/\.un-glass-floating\{[^}]*background-color[^}]*\}/)?.[0] ?? ''
    expect(floating, 'the floating panel is not opaque').toContain('--un-surface-floating')
    expect(floating, 'a floating panel should not carry a blur').not.toContain('backdrop-filter')

    const card = css.match(/\.un-glass-panel\{[^}]*\}/)?.[0] ?? ''
    expect(card, 'the card lost its blur').toContain('backdrop-filter')
    expect(card, 'the card lost its veil').toContain('--un-card')

    // Exactly one blurred surface in the whole stylesheet.
    expect((css.match(/backdrop-filter:blur/g) ?? []).length).toBe(1)
  })

  it('keeps the brand green out of neutral chrome', () => {
    /**
     * Green means profit in this product. A menu row that turns green under the cursor, or a
     * field whose rim greens on focus, is claiming something about the row or the value — and
     * once green appears on chrome it stops being trustworthy on a number.
     *
     * The exceptions are deliberate and narrow: the focus RING is green because it is a
     * system-wide indicator with its own token, and a checked checkbox or switch is green
     * because there the green IS the state rather than a hover.
     */
    const highlighted = css.match(/data-\\\[highlighted\\\]\\:bg-[a-z-]+/g) ?? []
    expect(highlighted.join(' '), 'a menu highlight resolves to the accent green').not.toMatch(
      /bg-accent\b/,
    )
  })

  it('ships the glass rim, mask and fallback intact', () => {
    // The rim is the design's most-used material after the fills themselves — 57 layers carry
    // it. Losing any one of these three pieces silently turns every card back into a plain box.
    expect(css).toMatch(/\.u\\:glass-edge:before/)
    expect(css).toContain('mask-composite:exclude')
    // Engines without mask compositing must still get an edge, or the card has none at all.
    expect(css).toMatch(/@supports[^{]*mask-composite[^{]*\{[\s\S]*?\.u\\:glass-edge\{border:/)
  })

  it('defines the dark theme on :root as well as on the attribute', () => {
    // Attribute selectors lose their quotes under minification, hence the loose match.
    expect(css).toMatch(/\[data-un-theme=["']?dark/)
    // On :root too, so an app that sets no attribute still resolves every token.
    expect(css).toMatch(/:root[^{]*\{[^}]*--un-background/)
    // There is one theme by decision; a stray light block would mean the config drifted back.
    expect(css).not.toMatch(/\[data-un-theme=["']?light/)
  })

  it('ships no font files and no font @import', () => {
    // Nohemi is licence-restricted. The library exposes font slots and the app fills them.
    expect(css).not.toMatch(/@font-face/)
    expect(css).not.toMatch(/@import\s+url\(/)
  })

  it('stays within its size budget', () => {
    // A design system stylesheet that grows unnoticed is a page-weight regression in every
    // consuming app at once. Raise this deliberately, in a PR, with a reason.
    const kb = Buffer.byteLength(css, 'utf8') / 1024
    expect(kb, `styles.css is ${kb.toFixed(1)} kB`).toBeLessThan(40)
  })
})
