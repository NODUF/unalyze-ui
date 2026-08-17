# figma/

The design side of the pipeline. Everything here is input; nothing here is written by the build.

```text
figma/
├─ exports/            Raw Figma Variables export. Overwrite, never edit.
├─ figma.config.json   How collections, modes and groups map onto tokens.
└─ README.md           You are here.
```

## Re-exporting after a design change

1. In Figma, open the file and run the variables-export plugin.
2. Export **all five collections**: `Tailwind Colors`, `Tailwind Primitives`, `Typography`,
   `shadcn/ui`, `Primitives`.
3. Drop the JSON files into `figma/exports/`, replacing what is there. Filenames do not matter —
   the loader keys on the collection's own `name` field — but do not leave a stale duplicate of a
   collection behind, or the build will refuse to guess which one is current.
4. `pnpm tokens`
5. Commit `figma/exports/` **and** `packages/tokens/generated/` together. The diff between them
   is the design change, and it is the thing reviewers actually look at.

## What the build will refuse to do

- **Silently drop a variable.** Anything that matches no rule in `figma.config.json` fails the
  build with its name. Add a group rule, or list it under `ignoredVariables` with a reason.
- **Silently drop a collection.** A collection present in `exports/` but absent from the config
  is an error.
- **Resolve a conflict by last-write-wins.** `gap/gap-4` and `padding/p-4` both feed the single
  spacing scale; if they ever disagree the build stops rather than picking one.

## Why the export is committed rather than fetched

The Figma REST Variables API is Enterprise-only. Building the pipeline around a committed export
means it works on any plan, produces reviewable diffs, and reproduces byte-for-byte in CI. If an
Enterprise token becomes available, `figma-sync.yml` can fetch and open the same PR automatically —
the rest of the pipeline does not change.

## Known upstream quirks

| Quirk | Handling |
|---|---|
| `hover:succes` (typo) | Renamed to `success-hover` via `renames` in the config, so the Figma file stays untouched. |
| `codeSyntax.WEB` holds Tailwind class names (`text-sm`, `gap-14`) for most variables | Only honoured when it contains `var(` or `calc(`. See `rewriteExpr` in `figma-to-ts.ts`. |
| `slate` and `zinc` neutral ramps both exist | `neutral` in the config picks one. Currently `slate`. |
| Font family resolves to `Geist` | The package bundles no fonts; this becomes the default of the `--un-font-sans` slot, which the consuming app overrides. |
