/**
 * Fixture: CommonJS + server-side rendering, no bundler involved.
 *
 * The cheapest fixture and the one that catches the most: `require()` exercises the CJS half of
 * the exports map, and `renderToString` proves a Server Component can render our components
 * without a browser. Both are paths a bundler would paper over.
 */

const assert = require('node:assert/strict')
const { createElement } = require('react')
const { renderToString } = require('react-dom/server')
const ui = require('@noduf/unalyze-ui')

/* ---- exports map, CJS half ---- */

for (const name of ['Button', 'Surface', 'Text', 'Heading', 'UnalyzeProvider', 'cn']) {
  assert.ok(ui[name], `@noduf/unalyze-ui does not export ${name} through the CJS entry`)
}

/* ---- server rendering ---- */

const html = renderToString(
  createElement(
    ui.UnalyzeProvider,
    { theme: 'dark', locale: 'cs', applyThemeToDocument: false },
    createElement(
      ui.Surface,
      { level: 'raised' },
      createElement(ui.Heading, { level: 2 }, 'Čistý P/L'),
      createElement(ui.Text, { tone: 'positive', numeric: true }, '+4 128,60 Kč'),
      createElement(ui.Button, { variant: 'primary', loading: true }, 'Ukládám'),
    ),
  ),
)

assert.match(html, /data-un-component="button"/, 'Button did not render its component marker')
assert.match(html, /data-un-theme="dark"/, 'theme attribute missing from server output')
assert.match(html, /class="[^"]*un-surface/, 'Surface lost its stable class hook')
assert.match(html, /u:bg-primary/, 'Button lost its variant classes')
// The provider's locale must reach the server render; a client-only string table would mean the
// consuming app ships English in the HTML and swaps to Czech after hydration.
assert.match(html, /Načítání/, 'loading label did not come from the cs locale during SSR')
assert.match(html, /Ukládám/, 'button label missing from server output')

/* ---- the stylesheet is reachable as a subpath ---- */

const cssPath = require.resolve('@noduf/unalyze-ui/styles.css')
const css = require('node:fs').readFileSync(cssPath, 'utf8')
assert.ok(css.includes('@layer unalyze-base'), 'styles.css is not the built stylesheet')

console.log('✓ node-cjs — require, SSR, locale and styles.css all resolve')
