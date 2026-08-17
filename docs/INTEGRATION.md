# Integrating `@noduf/unalyze-ui`

For the team consuming the package. Nothing here assumes you use Tailwind, and nothing here asks
you to change your build.

---

## 1. Get access

The package lives in **GitHub Packages**, not on npmjs, so npm needs to be told two things: where
to look for the `@noduf` scope, and who you are.

**Create a token** at [github.com/settings/tokens](https://github.com/settings/tokens) →
*Generate new token (classic)* → tick **`read:packages`** only. Classic, not fine-grained —
GitHub Packages for npm does not accept fine-grained tokens yet.

**Put it in your shell profile**, not in a file you might commit:

```bash
# ~/.zshrc or ~/.bashrc
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

**Add `.npmrc` beside your `package.json`** — this one is safe to commit, it contains no secret:

```ini
@noduf:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

> **CI**: give the job a secret with `read:packages` and export it as `GITHUB_TOKEN`.

```bash
npm install @noduf/unalyze-ui
```

That is the only package you need. The design tokens are compiled into the stylesheet at build
time — `@noduf/unalyze-tokens` is published separately only for the case where you want the raw
values in JavaScript, such as handing a colour to a chart runtime.

---

## 2. Three lines

```tsx
// app/layout.tsx — the stylesheet import goes at the root, BEFORE your own styles
import '@noduf/unalyze-ui/styles.css'
import { UnalyzeProvider } from '@noduf/unalyze-ui'

export default function RootLayout({ children }) {
  return (
    // Setting the attribute here rather than letting the provider do it puts the theme in the
    // first HTML response, so there is no flash before hydration.
    <html lang="cs" data-un-theme="dark">
      <body>
        <UnalyzeProvider locale="cs" applyThemeToDocument={false}>
          {children}
        </UnalyzeProvider>
      </body>
    </html>
  )
}
```

```tsx
import { Button, Surface, Text } from '@noduf/unalyze-ui'

export function NetPnl({ value, formatted }) {
  return (
    <Surface>
      <Text variant="label" tone="muted">Čistý PnL</Text>
      <Text variant="value-lg" tone={value >= 0 ? 'positive' : 'negative'} numeric>
        {formatted}
      </Text>
      <Button variant="glass">Detail</Button>
    </Surface>
  )
}
```

No Tailwind. No config file. No content paths. No PostCSS plugin.

---

## 3. What the package does to your page

| | |
|---|---|
| Ships a CSS reset | **No.** Your headings, lists and form controls are untouched. |
| Ships fonts | **No.** See *Fonts* below. |
| Global custom properties | Only `--un-*`. |
| Global classes | Only `.u\:*` utilities and `.un-*` component hooks. |
| Touches `<html>` / `<body>` | Only `data-un-theme`, and only if you let it. |
| Reads `prefers-color-scheme` | **No.** You decide which theme applies. |
| Requires React | Yes — a peer dependency, `>=18.2 <20`. Server Components are supported. |
| Bundles Radix | **No** — a normal dependency, so your package manager dedupes it against your own copy. |

Everything the package ships sits in `@layer unalyze-base, unalyze-components, unalyze-utilities`.
Cascade layers rank **below** unlayered CSS, so your ordinary stylesheet wins with no `!important`
and no specificity fight.

**One thing it does reset**, deliberately: the browser's own styling on its *own* `<button>`,
`<input>`, `<textarea>` and `<select>` elements, scoped to `[data-un-component]`. Without it every
control the library renders would keep the user agent's grey border and `ButtonFace` background.
Your elements are not touched.

---

## 4. Theme

There is one theme: **dark**. It is bound to `:root`, so an app that sets nothing still gets it.

`data-un-theme="dark"` is emitted alongside, so setting it explicitly works and is the recommended
approach for SSR. A light theme is a later addition; the machinery is already in place and nothing
in your integration changes when it lands.

---

## 5. Fonts

The package bundles **no font files** — nothing is downloaded on your users' behalf and no font
licence travels with the package. Point the slots at whatever you already load:

```css
:root {
  --un-font-sans: 'Nohemi', ui-sans-serif, system-ui, sans-serif;
  --un-font-display: 'Nohemi', var(--un-font-sans);
  --un-font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

The product is single-face: both slots are Nohemi. Set nothing and you get a system stack — the
layout is correct, only the voice is missing.

> ⚠ If Nohemi turns out to lack tabular figures, a column of live P&L values will shift width as
> the digits change. `<Text numeric>` already asks for them; worth confirming against the real font
> files before launch.

---

## 6. Overriding

**Tokens first.** They reshape the system coherently rather than one element at a time:

```css
:root {
  --un-radius: 24px;      /* every panel, including the derived smaller steps */
  --un-primary: #0b7a3c;
  --un-primary-hover: #0a6b35;
}
```

**Then component hooks.** Every component root carries a stable class and data attributes. These
are part of the public API and covered by semver:

```css
.un-button[data-variant='primary'] { letter-spacing: 0.01em; }
.un-surface[data-level='glass']    { border-radius: 20px; }
.un-tab[data-state='active']       { font-weight: 600; }
```

**Last, `className`.** Passed through untouched and merged safely — `cn()` is prefix-aware, so our
utilities deduplicate against each other while your own classes ride along unchanged.

**Import order matters.** Put `@noduf/unalyze-ui/styles.css` before your own stylesheets. Your
unlayered CSS wins regardless, but if you also use cascade layers, layer order is set by first
appearance and you want yours declared after ours.

---

## 7. Things worth knowing before you build with it

**Red and green mean money.** `positive` is a profit, `negative` is a loss, and neither is
available for "success" or "error" decoration. A menu row that turns green under the cursor is what
makes a green number stop being trustworthy. There are separate tokens for the other jobs:
`destructive` for a dangerous action, `alert` for an unread count, `warning` for stale data.

**Colour is never the only channel.** `<Text tone="negative">` colours a value; pair it with a sign
and a glyph so it survives greyscale and colour-vision deficiency.

**`variant`, not `role`.** `Text`'s style axis is called `variant` because `role` is a reserved
ARIA attribute — `<Text role="status">` still does exactly what you expect.

**Icon buttons need a name.** `IconButton`'s `label` prop is required. A button containing only an
SVG is announced as "button" and nothing else.

**`FormField` takes a function, not children.** It hands your control the ids and state it needs:

```tsx
<FormField label="Částka" hint="Až 2 desetinná místa" error={errors.amount}>
  {(field) => <Input {...field} numeric />}
</FormField>
```

That is the whole reason it exists — `htmlFor`, `aria-describedby` and `aria-invalid` cannot be
forgotten, because the control cannot be rendered without receiving them.

**Overlay triggers want `asChild`.** `<DialogTrigger asChild><Button>…</Button></DialogTrigger>`,
so the trigger *is* your button rather than wrapping one.

---

## 8. Component reference

| Component | Key props |
|---|---|
| `Surface` | `level` glass·flat·raised·overlay·sunken·none · `edge` none·subtle·strong·accent · `tint` · `radius` · `padding` |
| `Text` | `variant` display·value-xl·value-lg·value·value-sm·title·title-sm·body·label·label-sm·caption · `tone` · `numeric` |
| `Heading` | `level` 1–6 · everything `Text` takes |
| `Button` | `variant` primary·glass·secondary·outline·ghost·destructive · `size` sm·md·lg·icon-\* · `loading` · `icon` |
| `IconButton` | `label` **required** · `icon` **required** · same variants and sizes |
| `Input` / `Textarea` | `size` · `icon` · `iconTrailing` · `numeric` |
| `FormField` | `label` · `hint` · `error` · `required` · children as a function |
| `Checkbox` | `indeterminate` |
| `Switch` | — |
| `Badge` | `variant` accent·neutral·count·positive·negative·warning·outline · `size` |
| `Divider` | `orientation` |
| `Spinner` / `Skeleton` | `size` / `shape` |
| `EmptyState` | `title` · `description` · `icon` · `action` |
| `Dialog` | `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` |
| `Popover` / `Tooltip` | `PopoverTrigger`/`Content`; `TooltipTip` for the one-element case |
| `Select` | `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` |
| `DropdownMenu` | `Trigger`, `Content`, `Item` (`destructive`), `Label`, `Separator` |
| `Tabs` | `TabsList`, `TabsTrigger` (`locked`, `lockedLabel`), `TabsContent` |

`DialogTitle` is required by Radix — without one the dialog has no accessible name.

---

## 9. Upgrading

```bash
npm update @noduf/unalyze-ui
```

Read the release notes; they are generated from changesets, so every entry is a real change.

- **patch / minor** — safe. Tokens may gain entries; none are removed.
- **major** — a token or a prop was renamed or removed, with its replacement listed.

The public token surface is diffed in CI on every pull request, so a removed custom property
cannot ship as a minor. That matters because CSS has no type system: if your stylesheet references
`--un-muted-foreground` and we delete it, nothing in your build fails — the page just goes wrong.

---

## 10. Reporting a problem

Open an issue at [github.com/NODUF/unalyze-ui/issues](https://github.com/NODUF/unalyze-ui/issues)
with the component, the props and what you expected.

If it is visual, every CI run attaches a `visual-review` artifact: one self-contained HTML file
showing every component. A screenshot of the difference usually makes it a five-minute fix.

**A known gap worth knowing about.** Some components have no design behind them yet and were
derived from the material of the ones that do. They say so in their own source:

```bash
grep -rn "@derived" node_modules/@noduf/unalyze-ui/
```

Their behaviour and accessibility are settled; their appearance may change in a minor release.
