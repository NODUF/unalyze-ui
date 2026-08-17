# CLAUDE.md — `@noduf/unalyze-ui`

This repository is a **frontend library**, not an application. It is designed in Figma, built
here, and consumed by an external team through a versioned npm package. Everything below exists to
keep that handoff stable.

## Repository map

```text
figma/exports/*.json        Raw Figma Variables export. NEVER hand-edit. Source of truth for primitives.
figma/figma.config.json     Which collections/modes map to which themes.
packages/tokens/            @noduf/unalyze-tokens — Figma → DTCG → CSS custom properties + JS values.
  ├─ src/semantic.ts        HAND-AUTHORED. The role vocabulary + everything Figma cannot express.
  └─ generated/             GENERATED but COMMITTED. Never hand-edit. `pnpm tokens` rewrites it.
packages/ui/                @noduf/unalyze-ui — Radix behaviour + cva variants + precompiled CSS.
apps/docs/                  Storybook. The handoff surface for the consuming team.
apps/fixtures/*             Consumer smoke tests: install the packed tarball and render everything.
docs/                       ADRs, INTEGRATION.md (for the consuming team), TOKENS.md.
PLAN.md                     The build plan, its phases and its CI gates.
```

## Non-negotiables for this repo

These are not style preferences. Each one exists because the package lands in a codebase we do
not control.

1. **Every CSS custom property is namespaced `--un-*`.** The consuming app already has
   `--background` and `--primary`. Collisions are silent and untraceable.
2. **Every Tailwind utility is prefixed `u:` — a different namespace from the tokens, on
   purpose.** Tailwind derives its theme variable names from the class prefix, so `prefix(un)`
   renamed Tailwind's own `--text-sm` and `--radius-sm` to `--un-text-sm` and `--un-radius-sm`,
   colliding with our tokens of exactly those names in a higher cascade layer. The output
   contained `--un-text-sm: var(--un-text-sm)`, a self-reference, which CSS discards — silently
   deleting the whole type and radius scale while every build stayed green. Do not "tidy" the two
   prefixes into one. `verify-package.test.ts` asserts no property references itself.
3. **All library CSS lives in `@layer unalyze-base, unalyze-components`,** declared first, so the
   consumer's unlayered CSS wins without `!important`.
4. **Never hand-edit anything under `generated/`.** CI gate G1 regenerates and fails on drift.
5. **No raw colour, spacing, radius or shadow values in `packages/ui/src/**`.** Use tokens. Lint-enforced.
6. **The library bundles no fonts.** It reads `--un-font-display` / `--un-font-sans` with a fallback
   stack. Nohemi is licence-restricted and must never be committed.
7. **No hardcoded user-visible strings.** a11y labels come from the provider's EN/CS table. The
   consuming app's CI enforces EN+CS parity across 435 keys.
8. **Red and green are reserved for P&L tone.** Never for status, tier, or decoration.
9. **No component or variant name may claim trading ability** (`Pro`, `Expert`, `Master`, `Elite`)
   and no broker or platform name may appear anywhere. The consuming app's CI enforces both.
10. **Themes switch on `data-un-theme="light|dark"`.** Default light. Never bind
    `prefers-color-scheme` automatically — the consuming app deliberately unbound it.
11. **No avatar.** No component may assume a profile photo exists.
12. **Every component ships complete or not at all**: component + cva variants + story +
    conformance test + Code Connect stub + `component-map.json` entry. Use `pnpm gen:component`.

## Before adding any component

Check `component-map.json` first. It links Figma component key ↔ package component ↔ Code Connect
file, so "does this already exist?" is a lookup, not a guess.

## Design-to-code rules

The full Figma → design system → shadcn/ui methodology lives in a separate document and applies to
every UI task in this repo:

@CLAUDE_FIGMA_SHADCN.md
