# Plán: `@noduf/unalyze-ui` — frontend library (Figma → tokeny → shadcn → npm balíček)

## Kontext

`CLAUDE_FIGMA_SHADCN.md` popisuje **pravidla**, jak se má z Figmy dělat React UI, ale neexistuje
nic, co by je vynucovalo, a neexistuje artefakt, který by se dal předat cizímu týmu. Dnes máme
tři nesouvisející světy:

| Co | Kde | Stav |
|---|---|---|
| Pravidla workflow | `un_figma_shadcn/CLAUDE_FIGMA_SHADCN.md` | text, nikdo je nekontroluje |
| Figma variables | `App redesign/plugin/*.json` (shadcn/ui kit, Tailwind Colors, Typography, `neon-green`) | ruční export, nikam nevede |
| Referenční kód | `unalyze-app/` (token generator, glass/bloom utility, motion, formátovače) | tvůj test, není to knihovna |
| Reálná aplikace | jinde, cizí tým | podle gamifikačního auditu: **žádná component library**, jen `.un-pill`, `components.json` odkazuje na shadcn a `tailwind.config.ts`, které neexistují |

**Cíl:** jeden verzovaný balíček, který navrhuješ ty ve Figmě a jejich vývojáři ho jen aktualizují
přes `npm update`. Ne showcase, ne generovaný JSX — **produkt s API, changelogem a semverem.**

---

## Potvrzená rozhodnutí

| # | Rozhodnutí | Důsledek |
|---|---|---|
| D1 | Monorepo v `un_figma_shadcn/`, packages `tokens` + `ui` | vlastní release cyklus, nezávislý na jakékoli aplikaci |
| D2 | Figma = primitiva + shadcn sémantický kontrakt; kód = sémantika, materiál, motion | co Figma neumí (glass, gradient rim, easing, heat ramp) žije v TS |
| D3 | Předkompilované CSS | konzument **nepotřebuje Tailwind ani konfiguraci** — `npm i`, jeden CSS import, provider |
| D4 | GitHub Packages (privátní) | `.npmrc` + token u nich, publikace z CI na tag |
| D5 | Vizuál z Figmy, z `unalyze-app` přeneseme jen technicky cenné části | žádné dědictví dark/glass vzhledu, pokud to Figma neříká |
| D6 | v1.0 = Foundations + Core UI; layout/patterns, trading, gamifikace = další fáze | v1 je úzká, ale kompletní |

---

## Architektura

```text
Figma (tvůj soubor)
  │  Tailwind Colors · Tailwind Primitives · Typography · shadcn/ui (4 módy) · Primitives
  ▼  export pluginem → figma/exports/*.json  (commitnuté, diffovatelné)
packages/tokens  @noduf/unalyze-tokens
  │  resolve aliasů → DTCG tokens.json → tokens.css (--un-*) + tokens.ts + kontrakt
  ▼
packages/ui      @noduf/unalyze-ui
  │  Radix (chování/a11y) + cva (varianty) + Tailwind v4 prefix(un) → PŘEDKOMPILOVANÉ CSS
  ▼
apps/docs (Storybook)  ·  apps/fixtures/* (smoke testy konzumenta)
  ▼
GitHub Packages → jejich aplikace
```

### Struktura repa

```text
un_figma_shadcn/
├─ CLAUDE.md                      # současný CLAUDE_FIGMA_SHADCN.md, přejmenovaný → agenti ho načtou
├─ .changeset/                    # semver + CHANGELOG
├─ .github/workflows/{ci,release,figma-sync}.yml
├─ figma/
│  ├─ exports/*.json              # RAW export z Figmy (nikdy needitovat ručně)
│  └─ code-connect/               # fáze 4
├─ packages/
│  ├─ tokens/                     # @noduf/unalyze-tokens
│  ├─ ui/                         # @noduf/unalyze-ui
│  └─ eslint-plugin-unalyze/      # interní guardrail pravidla
├─ apps/
│  ├─ docs/                       # Storybook 9 → GitHub Pages
│  └─ fixtures/{next-app,next-pages,vite}/   # instalují build a renderují vše
├─ tooling/                       # sdílené tsconfig / eslint / tsup presety
└─ docs/{INTEGRATION.md,TOKENS.md,adr/}
```

---

## 1. Token pipeline (`packages/tokens`)

**Vstup:** `figma/exports/*.json` — přesně ten formát, který už máš (`resolvedValuesByMode`,
`VARIABLE_ALIAS`). Pipeline se staví kolem **commitnutého exportu**, ne kolem REST API: Variables
REST API vyžaduje Figma Enterprise a nechceme na tom být závislí. `scripts/figma-pull.ts` REST
zkusí, a když není, řekne přesný postup exportu pluginem.

**Kroky:**

1. **Resolve** — rozbalí řetězce aliasů (`shadcn/ui:primary` → `Tailwind Colors:green-400`)
   a zploští 4 módy (`light/slate`, `dark/slate`, `light/zinc`, `dark/zinc`) na dvě témata.
   Ze `slate`/`zinc` vybíráme jednu neutrální řadu — druhá se zahodí explicitně, ne mlčky.
2. **Kanonický `tokens.json`** ve W3C DTCG formátu — commitnutý, diffovatelný. Tohle je artefakt,
   nad kterým se dělá review, ne surový Figma export.
3. **Sémantická vrstva v TS** (`src/semantic.ts`) — mapuje primitiva na role a přidává, co Figma
   neumí: `elevation-*`, `glass-*`, `edge-*`, motion (`duration-*`, `ease-*`), `heat-*`,
   `chart-*`, `positive` / `negative` / `neutral-value`. Vzor převzít z
   `unalyze-app/src/design-system/tokens/semantic.ts`, hodnoty ale z Figmy.
4. **Generátory** (vzor: `unalyze-app/scripts/generate-tokens.ts`, jen s namespacem):
   - `dist/tokens.css` — `:root { --un-* }` + `[data-un-theme="dark"] { … }` + `@theme` bridge
     pro interní Tailwind autoring
   - `dist/tokens.js` + `.d.ts` — hodnoty v JS (grafy, budoucí native klient)
   - `dist/tokens.contract.json` — seznam veřejných názvů tokenů
5. **Report nenamapovaných** — každá Figma proměnná, která nikam nevedla, se vypíše. Build
   selže, když se objeví nová a není v `figma/ignored-variables.json`. Nic nezmizí potichu.

**Namespace `--un-*` je nutnost, ne kosmetika.** Balíček padá do cizí aplikace, kde už `--primary`
nebo `--background` skoro jistě existuje.

---

## 2. Jak vypadá komponenta uvnitř

```tsx
// packages/ui/src/components/button/button.tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      data-un-component="button"      // stabilní override surface pro jejich tým
      data-variant={variant}
      className={cn('un-button', buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})
```

Tři vrstvy `className` a každá má důvod:
- `un-button` — **dokumentovaný, semver-chráněný** hook pro override (navazuje na jejich `.un-pill`)
- `buttonVariants()` — cva, uvnitř Tailwind utility s prefixem `un:` → nikdy nekoliduje s jejich CSS
- `className` z propu — jejich vlastní třídy projdou beze změny

Chování a přístupnost z Radixu (Dialog, Popover, Select, Tabs, Tooltip, DropdownMenu, …), vizuál
100 % náš. Přesně model z `CLAUDE_FIGMA_SHADCN.md`.

**Vědomá omezení kvůli cizímu repu:**

| Věc | Rozhodnutí | Proč |
|---|---|---|
| Ikony | žádná závislost; komponenty berou `ReactNode`, vestavěné jen chevron/check/close/spinner | `@tabler/icons-react` bychom jim vnutili |
| Motion | core je CSS-only; `motion` až jako volitelný subpath `@noduf/unalyze-ui/motion` | ~34 kB navíc do cizího bundlu bez ptaní |
| Fonty | **nebalíme žádné** — čteme `--un-font-display` / `--un-font-sans` s fallbackem | Nohemi má licenční omezení (audit: local-only, never committed) |
| Texty | žádný natvrdo napsaný string; a11y labely přes provider s EN/CS tabulkou | jejich CI hlídá EN+CS paritu na 435 klíčích |
| Barvy | červená/zelená rezervovaná pro P&L, nikdy pro stav či tier | binding constraint z auditu |
| Názvy | žádné nároky na dovednost (`Pro`, `Expert`, `Master`), žádná jména brokerů | jejich CI to vynucuje |
| Téma | `data-un-theme="light|dark"`, default **light**, nikdy neváže `prefers-color-scheme` sám | jejich app to záměrně odpojila |

---

## 3. Build a balíček

- **tsup** → ESM + CJS, `.d.ts`, zachované `'use client'` direktivy (RSC).
- **Tailwind v4** `@import "tailwindcss" prefix(un)` — celý styl se přeloží do jednoho
  `dist/styles.css`, zabaleného v `@layer unalyze-base, unalyze-components`. Vrstva se deklaruje
  jako první ⇒ **jakékoli jejich nevrstvené CSS nás automaticky přebije.** Override bez `!important`.
- `tailwind-merge` nakonfigurovaný na prefix `un`, jinak `cn()` tiše přestane deduplikovat.
- `exports` mapa: `.`, `./styles.css`, `./tokens.css`, `./motion`. Správné `sideEffects`.
- peer deps: `react`/`react-dom` `>=18.2 <20`. Radix jako běžná dependency (verzovaná, malá).
- Integrace u nich = tři řádky:

```tsx
import '@noduf/unalyze-ui/styles.css'
<UnalyzeProvider theme="light" locale="cs">{children}</UnalyzeProvider>
import { Button } from '@noduf/unalyze-ui'
```

---

## 4. Stabilita — CI brány

Tohle je jádro zadání. Každá brána existuje proti konkrétnímu způsobu, jak se knihovna rozbije.

| # | Brána | Chrání proti |
|---|---|---|
| G1 | `npm run tokens && git diff --exit-code` | ručně editovanému generovanému CSS |
| G2 | diff `tokens.contract.json` → smazaný/přejmenovaný token = major | tichému breaking change u konzumenta |
| G3 | snapshot veřejného API (`.api.md`, commitnutý) | nechtěné změně props |
| G4 | ESLint: zákaz hex / `rgb()` / arbitrary Tailwind v `packages/ui/src/**` | rozpadu token systému |
| G5 | **conformance suite** pro každou komponentu: forward ref, `className` passthrough, všechny cva varianty se vyrenderují, `displayName`, axe-clean, ovladatelné klávesnicí, obě témata | nekonzistentnímu API napříč 35 komponentami |
| G6 | Playwright visual regression: komponenta × varianta × téma × viewport, baseline commitnuté | neúmyslné vizuální regresi |
| G7 | kontrastní asserty na každý pár foreground/background | nedostupné paletě po změně tokenu ve Figmě |
| G8 | **fixture matrix** — `next-app`, `next-pages`, `vite` nainstalují `npm pack` tarball a vyrenderují všechno | ESM/CJS, `'use client'`, peer-dep a exports-mapa chybám (tohle je skutečný důvod, proč cizí knihovny „nefungují") |
| G9 | `size-limit` rozpočet na entry point | tichému nabobtnání bundlu |
| G10 | Changesets → semver + CHANGELOG + publish na tag | ručnímu verzování |
| G11 | `figma-sync.yml` (scheduled) — stáhne/porovná export a otevře PR „design se změnil" | rozjetí Figmy a kódu |

**Žádná brána není advisory.** Buď blokuje merge, nebo tam nepatří.

---

## 5. Workflow v praxi

**W1 — změnil jsi barvu ve Figmě**
Export pluginem → commit do `figma/exports/` (nebo to udělá scheduled job za tebe) → CI
přegeneruje tokeny, spustí kontrast + visual regression → v PR vidíš screenshot diff každé
komponenty, které se to dotklo → merge → changeset → nová verze.

**W2 — nová komponenta**
`pnpm gen:component select` vygeneruje **naráz** komponentu, cva varianty, story, conformance test,
Code Connect stub a záznam v `component-map.json`. Nejde přidat komponentu napůl zapojenou.

**W3 — nová obrazovka (ty nebo jejich tým s Claudem)**
`CLAUDE.md` (dnešní `CLAUDE_FIGMA_SHADCN.md`) je v rootu ⇒ agent ho načte automaticky. Rozhodovací
strom z něj je nově **zodpověditelný nástrojem**, ne grepováním: `component-map.json` propojuje
Figma component key ↔ komponenta v balíčku ↔ Code Connect soubor. „Existuje tohle už?" je dotaz,
ne odhad.

**W4 — release**
Tag → GitHub Action publikuje na GitHub Packages, nasadí Storybook na Pages, přiloží CHANGELOG.
Jejich tým dělá `npm update @noduf/unalyze-ui`.

**W5 — breaking change**
G2/G3 ho odhalí v PR. Major bump + zápis v `MIGRATION.md` s codemodem, pokud jde napsat.

---

## 6. Fáze

| Fáze | Obsah | Brána | Stav |
|---|---|---|---|
| **0** | Monorepo scaffold (pnpm + Turborepo), tooling, ADR, jména balíčků, CI | `pnpm build` projde naprázdno | ✅ hotovo |
| **1** | Token pipeline kompletní: exports → DTCG → CSS/TS/kontrakt, sémantika v TS, report nenamapovaných, G1/G2/G7 | tokeny se generují z Figmy a kontrast sedí | ✅ hotovo |
| **2** | **Walking skeleton — hlavní gate.** Jen `Button`, `Surface`, `Text`. Ale celý řetěz: Tailwind prefix build → tsup → předkompilované CSS → tarball → tři fixture aplikace to nainstalují a postaví → preview app → G3–G9 zelené | **externí `npm i` vykreslí správný Button** | ✅ hotovo (mimo publikaci na GitHub Packages — čeká na O3) |
| **3** | Core UI v dávkách po ~6 komponentách, každá přes generátor + conformance suite | G5/G6 na každou dávku | ⏭ další |
| **4** | Code Connect, migrace z `.un-pill`, verzovací politika | jejich vývojář nasadí v1.0 bez tvé asistence | |
| **5+** | Layout & patterns → trading doména → gamifikace V1 → dokončení dark tématu | per fáze | |

### Co se ve fázi 2 naučilo (a je zapsané v kódu)

| Zjištění | Kde je to ošetřené |
|---|---|
| Tailwind `prefix(un)` přejmenuje **své** theme proměnné také na `--un-*` → vznikne `--un-text-sm: var(--un-text-sm)`, self-reference, kterou CSS zahodí, a tiše zmizí celá typo a radius škála | Třídy mají prefix `u:`, tokeny `--un-*`. Test na self-referenci v `verify-package.test.ts`. |
| `codeSyntax.WEB` ve Figmě u většiny proměnných nese Tailwind **třídu**, ne CSS výraz | `rewriteExpr` honoruje jen výrazy s `var(`/`calc(` |
| tsup `banner` s `'use client'` bundler zahodí (jen warning) → RSC build u konzumenta padá na `createContext is not a function` | `scripts/add-client-directive.mjs` + asserce v testu + fixture `next-app` |
| `forwardRef` nemá `displayName` → všechno je v DevTools `Anonymous` | conformance suite to vyžaduje |
| green-600 a amber-600 nesplní AA na bílé | G7 to zamítla, hodnoty posunuté na 700, důvod okomentovaný |

**Rozsah fáze 3 (v1.0 Core UI):**
Text · Heading · Surface/Card · Divider · VisuallyHidden · Spinner · Skeleton · Button · IconButton ·
ButtonGroup · Link · Input · Textarea · Label · FormField · Checkbox · RadioGroup · Switch · Select ·
Badge · Pill · Dialog · AlertDialog · Popover · Tooltip · DropdownMenu · Sheet · Tabs · Accordion ·
Toast · Alert · Progress · Table · Pagination · Breadcrumb · ScrollArea · EmptyState

---

## 7. Co přeneseme z `unalyze-app` (jen kód, ne vzhled)

| Odkud | Co | Proč |
|---|---|---|
| `scripts/generate-tokens.ts` | struktura generátoru, `@theme inline` bridge | vyřešené, funguje |
| `src/styles/globals.css` | `glass-*`, `bloom`, `glass-edge` (masked pseudo-element), `eyebrow`, `pb-safe` | netriviální CSS, komentáře vysvětlují proč |
| `src/styles/globals.css` | reduced-motion backstop + `data-allow-motion` výjimka | správně vyřešená a11y past |
| `src/lib/formatters/` | měna, procenta, trvání, symboly, CS/EN | fáze 5, ale ať se to nepíše dvakrát |
| `src/components/trading/profit-loss-value.tsx` | grammar barva + znaménko + glyf | fáze 5, splňuje „barva není jediný nositel významu" |
| `src/design-system/motion/` | duration/easing tokeny, `useReducedMotion` | fáze 1 (tokeny) + volitelný subpath |

Vzhled (dark, glass, Nohemi) se **nepřenáší** — vizuál určuje Figma.

---

## 8. Ověření

```bash
# 1 — tokeny sedí s Figmou
pnpm --filter @noduf/unalyze-tokens build && git diff --exit-code   # G1
pnpm --filter @noduf/unalyze-tokens test:contrast                    # G7

# 2 — knihovna se postaví a je konzumovatelná
pnpm --filter @noduf/unalyze-ui build
pnpm --filter @noduf/unalyze-ui pack                                 # tarball
pnpm test:fixtures        # nainstaluje tarball do next-app / next-pages / vite a vyrenderuje vše

# 3 — kvalita komponent
pnpm test:conformance     # ref, className, varianty, axe, klávesnice, obě témata
pnpm test:visual          # Playwright baseline
pnpm size                 # rozpočet bundlu

# 4 — handoff
pnpm --filter docs build  # Storybook
pnpm changeset:status     # co půjde v příští verzi
```

**Ruční ověření fáze 2 (skutečná brána):** v čistém adresáři `npm i @noduf/unalyze-ui` z GitHub Packages,
tři řádky integrace, `Button` vypadá jako ve Figmě, override přes `className` funguje, jejich
Tailwind (pokud ho mají) nic nerozbije.

---

## 9. Otevřené otázky a rizika

| # | Věc | Dopad | Kdy to potřebuju |
|---|---|---|---|
| O1 | Odkaz na Figma soubor + přístup | bez něj pipeline běží na starém exportu z `App redesign/` | fáze 1 |
| O2 | React verze a jestli používají RSC | rozsah peer deps, fixture matrix | fáze 2 |
| O3 | GitHub org / repo pro balíček | publikace, `.npmrc` návod pro ně | fáze 2 |
| O4 | Kontakt na jejich vývojáře | `INTEGRATION.md` se píše pro konkrétní stack | fáze 4 |
| R1 | Figma Variables REST API = Enterprise | pipeline záměrně staví na commitnutém exportu, REST je bonus | ošetřeno |
| R2 | Code Connect publish = Figma Organization+ | bez něj zůstanou `*.figma.tsx` lokálně, MCP je stejně přečte | ošetřeno |
| R3 | Nohemi licence | knihovna nebalí fonty, čte je z CSS proměnných | ošetřeno |
| R4 | `slate` vs `zinc` — Figma má obě neutrální řady | jednu vybereme explicitně a druhou zahodíme v resolveru | fáze 1, potřebuju tvoje rozhodnutí |
| R5 | `CLAUDE_FIGMA_SHADCN.md` → `CLAUDE.md` v rootu | jinak ho agenti nenačtou automaticky; obsah zůstane, jen se rozšíří o mapu balíčků | fáze 0 |
