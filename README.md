# @noduf/unalyze-ui

The Unalyze component library. Designed in Figma, built here, consumed as a versioned npm package.

Dark theme, Nohemi, precompiled CSS. **No Tailwind, no config and no build changes required in the
consuming application** — install, import one stylesheet, wrap the app in one provider.

```bash
npm install @noduf/unalyze-ui
```

Two one-time steps before that first install, because GitHub Packages needs a token even to read:
a committed `.npmrc` in the consuming repo, and one line in each developer's shell. Both are in
**[docs/INTEGRATION.md](docs/INTEGRATION.md)** — the guide to hand the consuming team. Start there.

---

## What is in the box

24 components, all keyboard-operable, all with a documented override surface:

| | |
|---|---|
| **Surface** | `Surface` — the glass card material: veil, rim, inner light, backdrop blur |
| **Type** | `Text`, `Heading` — eleven named roles read off the design's 23 text styles |
| **Actions** | `Button`, `IconButton` — six variants, three sizes, shared cva definition |
| **Forms** | `Input`, `Textarea`, `Label`, `FormField`, `Checkbox`, `Switch` |
| **Display** | `Badge`, `Divider`, `Spinner`, `Skeleton`, `EmptyState` |
| **Overlays** | `Dialog`, `Popover`, `Tooltip`, `Select`, `DropdownMenu` — Radix behaviour |
| **Navigation** | `Tabs` — including the locked-destination state |

Overlay behaviour comes from [Radix](https://www.radix-ui.com/): focus trapping, focus returning
to the trigger, arrow-key navigation, typeahead, viewport-aware positioning. The visual language is
entirely ours.

## See it

```bash
pnpm install
pnpm preview        # every component, live, at localhost:5173
```

`pnpm --filter @noduf/unalyze-preview build` produces
`apps/preview/dist/unalyze-ui-review.html` — one self-contained file, shareable with anyone.

## Repository map

```text
figma/exports/*.json      Raw Figma Variables export. Never hand-edited.
figma/reference/          Screenshots of the design, so it is readable without a Figma seat.
packages/tokens/          Figma → CSS custom properties + JS values.
  src/semantic.ts         HAND-AUTHORED. Everything Figma cannot express.
  generated/              GENERATED but COMMITTED. `pnpm tokens` rewrites it.
packages/ui/              The components.
apps/preview/             Visual review surface.
apps/fixtures/*           Consumer smoke tests: install the packed tarball and build.
docs/INTEGRATION.md       For the consuming team.
docs/TOKENS.md            Where every value comes from and who owns it.
```

## Working on it

```bash
pnpm build          # tokens → CSS → JS
pnpm test           # 232 tests
pnpm typecheck
pnpm test:fixtures  # packs real tarballs, installs them outside the workspace, builds three apps
```

`pnpm test:fixtures` is the one that matters before a release. Everything else tests the source;
that tests the artefact — the exports map, the ESM/CJS split, the `'use client'` directive and the
peer ranges, which is where a library that builds cleanly still breaks in someone else's repo.

## Releasing

```bash
pnpm changeset      # describe the change, pick a bump
git commit && git push
```

Merging to `main` opens a release PR. Merging **that** publishes to GitHub Packages and tags the
commit. See [docs/INTEGRATION.md](docs/INTEGRATION.md#upgrading) for what a consumer sees.

## Status

Phases 0–3 of [PLAN.md](PLAN.md). Core UI is in; layout patterns, the trading components and the
charts are not.

Some components have no design behind them yet and are marked `@derived` in their source, with a
note on what was borrowed and what is settled regardless:

```bash
grep -rn "@derived" packages/ui/src/components/
```

[docs/design-backlog.html](docs/design-backlog.html) lists what still needs drawing.
