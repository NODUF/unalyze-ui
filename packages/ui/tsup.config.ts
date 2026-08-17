import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  treeshake: true,
  // `clean` is off on purpose: the CSS build writes dist/styles.css first, and a clean here
  // would delete it. Order is enforced by the `build` script.
  clean: false,
  external: ['react', 'react-dom'],
  /**
   * The whole bundle is marked as a client module — but by `scripts/add-client-directive.mjs`,
   * not here. tsup's `banner` is swallowed by the bundler, which treats the string as a
   * directive and drops it with only a warning. See that script.
   *
   * Why bundle-wide rather than per-file: preserving per-file directives needs an unbundled
   * build whose relative imports stay extensionless, which breaks under Node's native ESM
   * resolver. That is a real integration failure in someone else's repo, traded against a few
   * kilobytes of JS for `Text` and `Surface`.
   *
   * What this does NOT cost: a Server Component may still import and render these. The directive
   * marks a hydration boundary, not a rendering one, and SSR still produces markup.
   */
})
