# Setup — `@noduf/unalyze-ui`

Three minutes, once. Then `npm install` and `npm update` work normally.

---

### 1. Make a token

[github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token
(classic)** → tick **`read:packages`** → copy it.

Classic, not fine-grained — GitHub Packages does not accept fine-grained tokens for npm.

### 2. Put it in your shell

```bash
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
source ~/.zshrc
```

### 3. Add `.npmrc` to the project

Next to `package.json`. Commit it — there is no secret in it.

```ini
@noduf:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 4. Install

```bash
npm install @noduf/unalyze-ui
```

### 5. Check it actually works

Downloading is not the same as working. This renders a component and confirms the stylesheet
came with it:

```bash
node -e "
const ui = require('@noduf/unalyze-ui')
const css = require.resolve('@noduf/unalyze-ui/styles.css')
console.log(Object.keys(ui).length + ' components, stylesheet at ' + css)
"
```

Expect **65 components** and a path ending in `styles.css`.

---

## See what the components look like

One self-contained HTML file — no server, no build, works offline. Every release has one:

**[Releases](https://github.com/NODUF/unalyze-ui/releases)** → newest → download
`unalyze-ui-<version>.html` → open it in a browser.

It matches the version you installed, so it is a reference rather than a marketing page.

---

## Use it

```tsx
// app/layout.tsx
import '@noduf/unalyze-ui/styles.css'
import { UnalyzeProvider } from '@noduf/unalyze-ui'

export default function RootLayout({ children }) {
  return (
    <html lang="cs" data-un-theme="dark">
      <body>
        <UnalyzeProvider locale="cs">{children}</UnalyzeProvider>
      </body>
    </html>
  )
}
```

```tsx
import { Button, Surface, Text } from '@noduf/unalyze-ui'

<Surface>
  <Text variant="label" tone="muted">Čistý PnL</Text>
  <Button variant="glass">Detail</Button>
</Surface>
```

No Tailwind, no config, no build changes.

---

## If the install fails

Almost always one of two things:

- **`401` / `authentication token not provided`** — the token is not in *this* shell. Run
  `echo $GITHUB_TOKEN`; if it is empty, open a new terminal.
- **A `404` mentioning `registry.npmjs.org`** — the `.npmrc` is missing, or sits in a parent
  folder instead of next to the `package.json` you are installing into.

Anything else: [INTEGRATION.md § troubleshooting](INTEGRATION.md#troubleshooting) has a
paste-in check that tells you exactly which part is wrong.

---

**Everything else** — all 24 components, theming, overriding, upgrading —
**[INTEGRATION.md](INTEGRATION.md)**.
