import { useState, type ReactNode } from 'react'
import {
  contrastRatio,
  globalTokens,
  provenance,
  themes,
  tokenOrigin,
    type ThemeName,
} from '@noduf/unalyze-tokens'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Divider,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  FormField,
  Heading,
  IconButton,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TooltipTip,
  Surface,
  Switch,
  Text,
  Textarea,
  UnalyzeProvider,
  type UnalyzeLocale,
} from '@noduf/unalyze-ui'

/**
 * Visual review surface.
 *
 * Built out of the real components and the real tokens, imported the way the consuming
 * application imports them. That is the point: a hand-drawn swatch page drifts from the library
 * within a week and then quietly lies about what the product looks like.
 */

/* ------------------------------------------------------------------ *
 * Which tokens to show, and in what order
 *
 * Grouped by the question a reviewer is actually asking — "what are my surfaces", "what can text
 * be" — rather than alphabetically, which is how the generated files are sorted and is useless
 * for looking at colour.
 * ------------------------------------------------------------------ */

const COLOUR_GROUPS: { title: string; note: string; tokens: string[] }[] = [
  {
    title: 'Surfaces',
    note: 'What things sit on. Every panel in the product is one of these.',
    tokens: ['background', 'card', 'popover', 'muted', 'accent', 'sidebar-background'],
  },
  {
    title: 'Content',
    note: 'Text and icons. Each pairs with a surface above it and is contrast-checked in CI.',
    tokens: [
      'foreground',
      'muted-foreground',
      'card-foreground',
      'popover-foreground',
      'accent-foreground',
      'sidebar-foreground',
    ],
  },
  {
    title: 'Interactive',
    note: 'Chrome. `primary` is the one action on a screen; `ring` is the focus indicator.',
    tokens: [
      'primary',
      'primary-foreground',
      'primary-hover',
      'secondary',
      'secondary-foreground',
      'secondary-hover',
      'destructive',
      'destructive-foreground',
      'destructive-hover',
      'ring',
      'border',
      'input',
    ],
  },
  {
    title: 'Financial data',
    note: 'A loss is not a delete button — `negative` and `destructive` stay separate on purpose, even where they resolve to the same red.',
    tokens: ['positive', 'negative', 'neutral-value', 'warning', 'info', 'success'],
  },
  {
    title: 'Material',
    note: 'What Figma variables cannot hold: the glass rim, the inner light, the emphasis wash, the chart area fade. The card carries the rim, the inner light and a backdrop blur all at once — that combination is what `level="glass"` is.',
    tokens: [
      'edge-stops',
      'edge-stops-accent',
      'elevation-inset',
      'tint-brand',
      'chart-area-from',
      'overlay-scrim',
    ],
  },
  {
    title: 'Charts',
    note: 'No green and no red in the categorical ramp: those two hues mean profit and loss everywhere else.',
    tokens: [
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
      'chart-6',
      'chart-axis',
      'chart-grid',
      'chart-zero-line',
    ],
  },
]

/** Every type variant, in the order a reader meets them on the dashboard. */
const TYPE_ROWS = [
  { variant: 'display', sample: '42', usage: 'the score' },
  { variant: 'value-xl', sample: '$8,097', usage: 'monthly / yearly totals' },
  { variant: 'value-lg', sample: '125.33 %', usage: 'KPI figures' },
  { variant: 'value', sample: '+446.04', usage: 'a calendar day' },
  { variant: 'value-sm', sample: '13 trades', usage: 'counts, USD, win rate' },
  { variant: 'title', sample: 'Unalyze Score', usage: 'card titles' },
  { variant: 'title-sm', sample: 'Po Út St Čt Pá', usage: 'weekday headers' },
  { variant: 'body', sample: 'podíl ziskových obchodů', usage: 'legends, sub-captions, nav' },
  { variant: 'label', sample: 'Čistý PnL · za období', usage: 'the KPI eyebrow' },
  { variant: 'label-sm', sample: 'Počet obchodů', usage: 'dense row labels' },
  { variant: 'caption', sample: 'Trades · Úspěšnost', usage: 'axis ticks, micro labels' },
] as const

const BUTTON_VARIANTS = [
  'primary',
  'glass',
  'secondary',
  'outline',
  'ghost',
  'destructive',
] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const
const SURFACE_LEVELS = ['glass', 'flat', 'raised', 'overlay', 'sunken', 'none'] as const
const TONES = [
  { tone: 'positive', value: '+1 284,50 Kč', glyph: '▲' },
  { tone: 'negative', value: '−316,80 Kč', glyph: '▼' },
  { tone: 'neutral', value: '0,00 Kč', glyph: '●' },
  { tone: 'warning', value: '+412,00 Kč', glyph: '⚠' },
  { tone: 'muted', value: '—', glyph: '' },
] as const

/* ------------------------------------------------------------------ *
 * Layout helpers — intentionally NOT namespaced
 *
 * This file plays the part of the consuming application, so it styles itself with plain inline
 * styles and unprefixed class names. If any of it collided with the library, the collision would
 * show up here first.
 * ------------------------------------------------------------------ */

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <Heading level={4} style={{ marginBottom: note ? 4 : 16 }}>
        {title}
      </Heading>
      {note ? (
        <Text variant="body" tone="muted" style={{ marginTop: 0, marginBottom: 20, maxWidth: '60ch' }}>
          {note}
        </Text>
      ) : null}
      {children}
    </section>
  )
}

function Row({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'center' }}>{children}</div>
}

/**
 * Ambient light behind a group of surfaces.
 *
 * Not part of the library — it belongs to a page shell, not to a primitive. It is reproduced here
 * because `level="glass"` carries a `backdrop-filter`, and a backdrop filter over flat black
 * samples flat black and shows nothing. The design floats large, heavily blurred coloured
 * ellipses behind its layout (`LAYER_BLUR 200` and `420` in the file); without something like
 * them the glass card is indistinguishable from a flat one and cannot be reviewed.
 */
function Ambient({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', isolation: 'isolate' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-40px -20px',
          zIndex: -1,
          pointerEvents: 'none',
          background: [
            'radial-gradient(38% 120% at 12% 0%, var(--un-tint-brand), transparent 70%)',
            'radial-gradient(34% 110% at 52% 100%, var(--un-tint-info), transparent 70%)',
            'radial-gradient(30% 110% at 88% 10%, var(--un-tint-chart), transparent 70%)',
          ].join(', '),
          filter: 'blur(40px)',
        }}
      />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Colour swatches
 * ------------------------------------------------------------------ */

function Swatch({ name, theme }: { name: string; theme: ThemeName }) {
  const value = themes[theme][name]
  if (!value) return null

  const page = themes[theme]['background'] as string
  const via = (provenance[theme] as Record<string, string>)[name]
  const origin = tokenOrigin[name]

  // Gradient stop lists and shadows are not colours and cannot be measured or painted flat.
  const isShadow = value.includes('inset ') || /^\s*\d/.test(value)
  const isStops = !isShadow && value.includes(',') && !value.startsWith('rgb')
  const isGradient = value.startsWith('radial-') || value.startsWith('linear-')

  // Shown for every swatch because a colour that cannot carry text is a colour someone will
  // eventually put text on.
  let ratio: string
  try {
    ratio =
      isStops || isGradient || isShadow
        ? '—'
        : contrastRatio(themes[theme]['foreground'] as string, value, page).toFixed(1)
  } catch {
    ratio = '—'
  }

  return (
    <div style={{ width: 168 }}>
      <div
        style={{
          height: 56,
          borderRadius: 8,
          // A stop list is only meaningful once an angle is applied, which is what the
          // `glass-edge` utility does — so the swatch composes the same gradient by hand.
          // A shadow is not a fill at all, so it is painted as one on the card colour.
          background: isShadow
            ? (themes[theme]['card'] as string)
            : isStops
              ? `linear-gradient(180deg, ${value})`
              : value,
          boxShadow: isShadow ? value : undefined,
          border: '1px solid var(--un-border)',
        }}
      />
      <div style={{ marginTop: 6, lineHeight: 1.35 }} data-contrast={ratio}>
        <Text as="span" variant="caption" weight="medium" style={{ display: 'block' }}>
          {name}
        </Text>
        <Text as="span" variant="caption" tone="muted" numeric style={{ display: 'block' }}>
          {value}
        </Text>
        <Text as="span" variant="caption" tone="subtle" style={{ display: 'block' }}>
          {origin === 'figma' ? (via ? `figma · ${via}` : 'figma') : 'code'} · fg {ratio}:1
        </Text>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The panes
 * ------------------------------------------------------------------ */

function Showcase({ theme, locale }: { theme: ThemeName; locale: UnalyzeLocale }) {
  const t = locale === 'cs'
  const missingRadius = globalTokens['radius']

  return (
    <UnalyzeProvider theme={theme} locale={locale} applyThemeToDocument={false}>
      <div
        className="u:bg-background u:text-foreground"
        style={{ padding: '32px 28px', minHeight: '100%' }}
      >
        <div style={{ marginBottom: 40 }}>
          <Text variant="caption" tone="muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {theme} · {locale} · radius {missingRadius}
          </Text>
          <Heading level={1} variant="value-xl" style={{ marginTop: 4, marginBottom: 0 }}>
            @noduf/unalyze-ui
          </Heading>
        </div>

        {/* -------------------------------------------------- Buttons */}
        <Section
          title={t ? 'Button' : 'Button'}
          note={
            t
              ? 'Varianty pojmenovávají záměr, ne vzhled. Tvar je pilulka — v návrhu je každý ovládací prvek kulatý. `glass` nese stejný rim jako karty, takže lišta čte jako stejný materiál jako panely kolem ní.'
              : 'Variants name intent, not appearance. The shape is a pill — every control in the design is fully round. `glass` wears the same rim as the cards, so a toolbar reads as the same material as the panels around it.'
          }
        >
          {BUTTON_SIZES.map((size) => (
            <Row key={size}>
              <Text variant="caption" tone="subtle" numeric style={{ width: 28 }}>
                {size}
              </Text>
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {t ? 'Pokračovat' : 'Continue'}
                </Button>
              ))}
            </Row>
          ))}

          <div style={{ height: 20 }} />

          <Row>
            <Text variant="caption" tone="subtle" style={{ width: 28 }}>
              st
            </Text>
            <Button disabled>{t ? 'Nedostupné' : 'Disabled'}</Button>
            <Button loading>{t ? 'Ukládám' : 'Saving'}</Button>
            <Button variant="secondary" loading>
              {t ? 'Ukládám' : 'Saving'}
            </Button>
            <Button icon={<PlusIcon />}>{t ? 'Přidat účet' : 'Add account'}</Button>
            <Button variant="outline" iconTrailing={<ChevronIcon />}>
              {t ? 'Období' : 'Date range'}
            </Button>
            <IconButton variant="ghost" label={t ? 'Obnovit' : 'Refresh'} icon={<RefreshIcon />} />
          </Row>

          <div style={{ height: 20 }} />
          <Button block variant="primary">
            {t ? 'Celá šířka' : 'Full width'}
          </Button>

          <div style={{ height: 28 }} />
          <Text variant="body" tone="muted" style={{ marginBottom: 12, maxWidth: '60ch' }}>
            {t
              ? 'IconButton čte tutéž cva definici jako Button, takže má všechny jeho varianty i velikosti. Přístupný název je povinný prop — tlačítko jen s ikonou se bez něj nezkompiluje.'
              : 'IconButton reads the same cva definition as Button, so it has every one of its variants and sizes. The accessible name is a required prop — an icon-only button will not compile without one.'}
          </Text>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Row key={size}>
              <Text variant="caption" tone="subtle" style={{ width: 28 }}>
                {size}
              </Text>
              {BUTTON_VARIANTS.map((variant) => (
                <IconButton
                  key={variant}
                  variant={variant}
                  size={size}
                  label={variant}
                  icon={<RefreshIcon />}
                />
              ))}
              <IconButton size={size} loading label={t ? 'Načítám' : 'Loading'} icon={<RefreshIcon />} />
            </Row>
          ))}
        </Section>

        {/* -------------------------------------------------- Surfaces */}
        <Section
          title="Surface"
          note={
            t
              ? 'Level pojmenovává roli ve vrstvení, ne stín. Světlé téma sáhne po stínu, tmavé po vnitřním horním prosvětlení.'
              : 'Level names the role in the stack, not the shadow. Light reaches for a drop shadow, dark for an inset top highlight.'
          }
        >
          <Ambient>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {SURFACE_LEVELS.map((level) => (
                <Surface key={level} level={level} style={{ width: 190 }}>
                  <Text variant="value-sm">
                    {level}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {level === 'glass'
                      ? t
                        ? 'výchozí — karta z návrhu'
                        : 'the default — the design’s card'
                      : t
                        ? 'Ukázkový panel'
                        : 'Example panel'}
                  </Text>
                </Surface>
              ))}
            </div>
          </Ambient>

          <div style={{ height: 20 }} />
          <Row gap={16}>
            {(['none', 'sm', 'md', 'lg', 'full'] as const).map((radius) => (
              <Surface key={radius} radius={radius} padding="sm" style={{ width: 110 }}>
                <Text variant="caption" tone="muted">
                  radius {radius}
                </Text>
              </Surface>
            ))}
          </Row>
        </Section>

        {/* -------------------------------------------------- The rim */}
        <Section
          title={t ? 'Skleněný rim' : 'The glass rim'}
          note={
            t
              ? 'Gradientní 1px prstenec, nejjasnější na horní hraně a k dolní zmizí — světlo dopadající na hranu skla, ne nakreslený obrys. V návrhu ho nese 57 vrstev: karty, KPI pás i kulatá tlačítka. Je vědomě sotva viditelný (bílá na 5 %) — na tom ten efekt stojí.'
              : 'A 1 px gradient ring, brightest at the top lip and gone by the bottom — light on the edge of a pane, not a drawn outline. 57 layers in the design carry it: cards, the KPI strip, the round buttons. It is deliberately barely visible (white at 5 %); that is the whole effect.'
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {(['none', 'subtle', 'strong', 'accent'] as const).map((edge) => (
              <Surface key={edge} edge={edge} style={{ width: 190 }}>
                <Text variant="value-sm">
                  edge={edge}
                </Text>
                <Text variant="caption" tone="muted">
                  {edge === 'none'
                    ? t
                      ? 'bez rimu'
                      : 'no rim'
                    : edge === 'subtle'
                      ? t
                        ? 'výchozí, z návrhu'
                        : 'the default, from the design'
                      : edge === 'strong'
                        ? 'hover'
                        : t
                          ? 'zvýrazněný povrch'
                          : 'emphasised surface'}
                </Text>
              </Surface>
            ))}
          </div>

          <div style={{ height: 24 }} />
          <Text variant="body" tone="muted" style={{ marginBottom: 12, maxWidth: '60ch' }}>
            {t
              ? 'Návrh navíc každou kartu tónuje barvou série, kterou vykresluje — Score zeleně, Equity modře, denní PnL fialově. Váže kartu k jejím datům, aniž by obarvil cokoli, co se čte jako hodnota.'
              : 'The design also tints each card with the colour of the series it plots — Score green, Equity blue, daily P&L violet. It ties a card to its data without colouring anything that reads as a value.'}
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {([
              ['none', 'Kumulativní PnL'],
              ['brand', 'Unalyze Score'],
              ['info', 'Equity / zůstatek'],
              ['chart', 'Denní realizovaný PnL'],
            ] as const).map(([tint, label]) => (
              <Surface
                key={tint}
                tint={tint}
                edge={tint === 'brand' ? 'accent' : 'subtle'}
                style={{ width: 190 }}
              >
                <Text variant="caption" tone="muted">
                  tint={tint}
                </Text>
                <Text variant="value-sm" style={{ marginTop: 4 }}>
                  {label}
                </Text>
              </Surface>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------- Overlays */}
        <Section
          title={t ? 'Překryvy a navigace' : 'Overlays and navigation'}
          note={
            t
              ? 'Vzhled je odvozený — v návrhu je jen zavřený „2026 ⌄" a prázdná skořápka modalu. Chování ale odvozené není: focus trap, návrat fokusu na spouštěč, šipky mezi záložkami, typeahead v selectu. To se změnou vzhledu nezmění.'
              : 'The visuals are derived — the design has only the closed “2026 ⌄” control and an empty modal shell. The behaviour is not: focus trapping, focus returning to the trigger, arrow keys between tabs, typeahead in the select. None of that changes with a restyle.'
          }
        >
          <Tabs defaultValue="dashboard">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="achievements">{t ? 'Úspěchy' : 'Achievements'}</TabsTrigger>
              <TabsTrigger value="community" locked lockedLabel={t ? 'Připravujeme' : 'Coming soon'}>
                {t ? 'Komunita' : 'Community'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" style={{ paddingTop: 16 }}>
              <Text variant="body" tone="muted">
                {t ? 'Obsah záložky Dashboard.' : 'The Dashboard panel.'}
              </Text>
            </TabsContent>
            <TabsContent value="achievements" style={{ paddingTop: 16 }}>
              <Text variant="body" tone="muted">
                {t ? 'Obsah záložky Úspěchy.' : 'The Achievements panel.'}
              </Text>
            </TabsContent>
          </Tabs>

          <div style={{ height: 24 }} />

          <Row>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="glass">{t ? 'Otevřít dialog' : 'Open dialog'}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t ? 'Smazat účet' : 'Delete account'}</DialogTitle>
                  <DialogDescription>
                    {t
                      ? 'Tuto akci nelze vrátit zpět. Historie obchodů zůstane zachována.'
                      : 'This cannot be undone. Trade history is kept.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">{t ? 'Zrušit' : 'Cancel'}</Button>
                  <Button variant="destructive">{t ? 'Smazat' : 'Delete'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="glass">{t ? 'Filtry' : 'Filters'}</Button>
              </PopoverTrigger>
              <PopoverContent>
                <Text variant="label" tone="muted">
                  {t ? 'Období' : 'Period'}
                </Text>
                <div style={{ height: 10 }} />
                <Button block>{t ? 'Použít' : 'Apply'}</Button>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass">{t ? 'Akce' : 'Actions'}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t ? 'Obchod' : 'Trade'}</DropdownMenuLabel>
                <DropdownMenuItem>{t ? 'Upravit' : 'Edit'}</DropdownMenuItem>
                <DropdownMenuItem>{t ? 'Duplikovat' : 'Duplicate'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive>{t ? 'Smazat' : 'Delete'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select defaultValue="2026">
              <SelectTrigger aria-label={t ? 'Rok' : 'Year'} style={{ width: 130 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>

            <TooltipTip label={t ? 'Poměr zisků ke ztrátám' : 'Gross profit over gross loss'}>
              <IconButton variant="glass" label="Profit factor" icon={<InfoIcon />} />
            </TooltipTip>
          </Row>
        </Section>

        {/* -------------------------------------------------- Badges & feedback */}
        <Section
          title={t ? 'Odznaky a stavy' : 'Badges and states'}
          note={
            t
              ? 'Odznaky jsou z návrhu — série dní i počítadlo notifikací. Notifikační červená #FF5850 je vlastní token, ne ztrátová #D9534B: „něco nepřečteného" a „prodělal jsi" nesmí splynout.'
              : 'The badges are from the design — the day-streak chips and the unread count. The notification red #FF5850 is its own token, not the loss red #D9534B: "something unread" and "you lost money" must not collapse into one colour.'
          }
        >
          <Row>
            <Badge variant="accent">11 days</Badge>
            <Badge variant="neutral">5 days</Badge>
            <Badge variant="count" count>
              9+
            </Badge>
            <Badge variant="positive">+4.2 %</Badge>
            <Badge variant="negative">−1.8 %</Badge>
            <Badge variant="warning">{t ? 'částečná data' : 'partial data'}</Badge>
            <Badge variant="outline">{t ? 'obrys' : 'outline'}</Badge>
            <Badge size="sm">sm</Badge>
          </Row>

          <div style={{ height: 24 }} />
          <Row gap={20}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>

          <div style={{ height: 24 }} />
          <Surface style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Skeleton shape="circle" style={{ width: 40 }} />
              <div style={{ flex: 1, display: 'grid', gap: 8 }}>
                <Skeleton />
                <Skeleton style={{ width: '60%' }} />
              </div>
            </div>
          </Surface>

          <div style={{ height: 24 }} />
          <Row gap={0}>
            <Text variant="label" tone="muted" style={{ paddingRight: 16 }}>
              {t ? 'Čistý PnL' : 'Net P/L'}
            </Text>
            <Divider orientation="vertical" style={{ height: 20 }} />
            <Text variant="label" tone="muted" style={{ padding: '0 16px' }}>
              {t ? 'Počet obchodů' : 'Trades'}
            </Text>
            <Divider orientation="vertical" style={{ height: 20 }} />
            <Text variant="label" tone="muted" style={{ paddingLeft: 16 }}>
              {t ? 'Úspěšnost' : 'Win rate'}
            </Text>
          </Row>

          <div style={{ height: 24 }} />
          <Surface style={{ maxWidth: 420 }} padding="none">
            <EmptyState
              title={t ? 'Zatím žádné obchody' : 'No trades yet'}
              description={
                t
                  ? 'Připojte účet a obchody se tu objeví automaticky.'
                  : 'Connect an account and trades will appear here automatically.'
              }
              action={<Button>{t ? 'Přidat účet' : 'Add account'}</Button>}
            />
          </Surface>
        </Section>

        {/* -------------------------------------------------- Form controls */}
        <Section
          title={t ? 'Formulářové prvky' : 'Form controls'}
          note={
            t
              ? 'Pole nesou stejný materiál jako karty, o stupeň světlejší. Checkbox a Switch jsou skutečné inputy schované přes sr-only — ne div s rolí, protože jinak zmizí z tab orderu i z formuláře.'
              : 'Fields wear the same material as the cards, one step brighter. Checkbox and Switch are real inputs hidden with sr-only — not a div with a role, which would drop them out of the tab order and out of the form.'
          }
        >
          <div style={{ display: 'grid', gap: 20, maxWidth: 420 }}>
            <FormField label={t ? 'Název účtu' : 'Account name'} hint={t ? 'Zobrazí se v přehledu' : 'Shown in the overview'}>
              {(field) => <Input {...field} placeholder={t ? 'Hlavní účet' : 'Main account'} />}
            </FormField>

            <FormField label={t ? 'Částka' : 'Amount'} required requiredLabel={t ? 'povinné' : 'required'}>
              {(field) => <Input {...field} numeric defaultValue="1 284,50" iconTrailing={<span>USD</span>} />}
            </FormField>

            <FormField label={t ? 'Počet obchodů' : 'Trade count'} error={t ? 'Zadejte číslo' : 'Enter a number'}>
              {(field) => <Input {...field} defaultValue="abc" />}
            </FormField>

            <FormField label={t ? 'Poznámka' : 'Note'}>
              {(field) => <Textarea {...field} placeholder={t ? 'Volitelný komentář…' : 'Optional comment…'} />}
            </FormField>

            <Row gap={16}>
              <Input aria-label="sm" size="sm" placeholder="sm" style={{ width: 90 }} />
              <Input aria-label="md" size="md" placeholder="md" style={{ width: 90 }} />
              <Input aria-label="lg" size="lg" placeholder="lg" style={{ width: 90 }} />
            </Row>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Checkbox defaultChecked>{t ? 'Zahrnout víkendy' : 'Include weekends'}</Checkbox>
              <Checkbox indeterminate>{t ? 'Částečně vybráno' : 'Partly selected'}</Checkbox>
              <Checkbox disabled>{t ? 'Nedostupné' : 'Unavailable'}</Checkbox>
              <Switch defaultChecked>{t ? 'Živá synchronizace' : 'Live sync'}</Switch>
              <Switch>{t ? 'Upozornění e-mailem' : 'Email alerts'}</Switch>
              <Switch disabled>{t ? 'Nedostupné' : 'Unavailable'}</Switch>
            </div>

            <div>
              <Label size="sm">{t ? 'Samostatný popisek' : 'Standalone label'}</Label>
            </div>
          </div>
        </Section>

        {/* -------------------------------------------------- Type */}
        <Section
          title={t ? 'Typografie' : 'Type'}
          note={
            t
              ? 'Varianty pojmenovávají práci, ne velikost. Návrh má 23 různých textových stylů; tohle je těch jedenáct rolí, které zastávaly. Nohemi nese čísla a nadpisy karet, Montserrat popisky a osy — poměr zhruba 186 ku 54.'
              : 'Variants name the job, not the size. The design has 23 distinct text styles; these are the eleven jobs they were doing. Nohemi carries the numbers and card titles, Montserrat the labels and axes — roughly 186 runs to 54.'
          }
        >
          {TYPE_ROWS.map(({ variant, sample, usage }) => (
            <div
              key={variant}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 20,
                borderBottom: '1px solid var(--un-border)',
                padding: '12px 0',
              }}
            >
              <Text variant="caption" tone="subtle" style={{ width: 84, flexShrink: 0 }}>
                {variant}
              </Text>
              <Text variant={variant} style={{ flex: 1 }}>
                {sample}
              </Text>
              <Text variant="caption" tone="subtle" style={{ width: 190, flexShrink: 0 }}>
                {usage}
              </Text>
            </div>
          ))}
        </Section>

        {/* -------------------------------------------------- Tones */}
        <Section
          title={t ? 'Tón a čísla' : 'Tone and numerals'}
          note={
            t
              ? 'Barva není jediný nositel významu — hodnota vždy nese i znaménko a glyf, takže přežije černobílý tisk i barvosleposti.'
              : 'Colour is never the only channel — a value always carries a sign and a glyph, so it survives greyscale and colour-vision deficiency.'
          }
        >
          <Surface padding="lg" style={{ maxWidth: 420 }}>
            {TONES.map(({ tone, value, glyph }) => (
              <div
                key={tone}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}
              >
                <Text variant="body" tone="muted">
                  {tone}
                </Text>
                <Text variant="value-sm" tone={tone} numeric>
                  {glyph} {value}
                </Text>
              </div>
            ))}
          </Surface>
        </Section>

        {/* -------------------------------------------------- Composed */}
        <Section
          title={t ? 'Složeno jen z primitiv' : 'Composed from primitives only'}
          note={
            t
              ? 'Žádná nová komponenta, žádná ruční hodnota. Tohle je test, jestli jazyk stačí na skutečnou obrazovku.'
              : 'No new component and no hand-written value. This is the test of whether the language is enough for a real screen.'
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <MetricCard label={t ? 'Čistý P/L' : 'Net P/L'} value="+4 128,60" tone="positive" glyph="▲" sub={t ? '32 obchodů' : '32 trades'} />
            <MetricCard label={t ? 'Nejhorší den' : 'Worst day'} value="−1 042,10" tone="negative" glyph="▼" sub="14. 8." />
            <MetricCard label="Profit factor" value="1,84" tone="neutral" glyph="" sub={t ? 'za 30 dní' : 'last 30 days'} />
          </div>
        </Section>

        {/* -------------------------------------------------- Tokens */}
        {COLOUR_GROUPS.map((group) => (
          <Section key={group.title} title={group.title} note={group.note}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {group.tokens.map((name) => (
                <Swatch key={name} name={name} theme={theme} />
              ))}
            </div>
          </Section>
        ))}

        {/* -------------------------------------------------- Override proof */}
        <Section
          title={t ? 'Přepsání z aplikace' : 'Overriding from the app'}
          note={
            t
              ? 'Stejný Button, jen v obalu, který si nastavuje --un-radius a --un-primary nevrstveným CSS. Žádné !important.'
              : 'The same Button, inside a wrapper that sets --un-radius and --un-primary from unlayered CSS. No !important.'
          }
        >
          <Row>
            <Button>{t ? 'Výchozí' : 'Default'}</Button>
            <div
              style={
                {
                  '--un-radius': '2px',
                  '--un-primary': '#0b7a3c',
                  '--un-primary-hover': '#0a6b35',
                  display: 'contents',
                } as React.CSSProperties
              }
            >
              <Button>{t ? 'Přepsané tokeny' : 'Overridden tokens'}</Button>
            </div>
            <Button className="app-owned-class">{t ? 'Vlastní třída' : 'App class'}</Button>
          </Row>
        </Section>
      </div>
    </UnalyzeProvider>
  )
}

function MetricCard({
  label,
  value,
  tone,
  glyph,
  sub,
}: {
  label: string
  value: string
  tone: 'positive' | 'negative' | 'neutral'
  glyph: string
  sub: string
}) {
  return (
    <Surface level="raised" padding="lg" style={{ minWidth: 190 }}>
      <Text
        variant="caption"
        tone="muted"
        family="display"
        style={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}
      >
        {label}
      </Text>
      <Text variant="value-lg" tone={tone} weight="semibold" numeric style={{ marginTop: 6 }}>
        {glyph ? `${glyph} ` : ''}
        {value}
      </Text>
      <Text variant="caption" tone="subtle" style={{ marginTop: 2 }}>
        {sub}
      </Text>
    </Surface>
  )
}

/* ------------------------------------------------------------------ *
 * Icons
 *
 * Hand-drawn here rather than pulled from an icon package, because the library deliberately does
 * not depend on one: components take icons as elements so the consuming team keeps their own set.
 * The preview has to demonstrate that, not paper over it.
 *
 * `currentColor` throughout — an icon inside a Button must follow the variant's text colour, and
 * a hardcoded stroke would look right on `primary` and invisible on `ghost`.
 * ------------------------------------------------------------------ */

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 6.5 8 10l3.5-3.5" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v4M8 4.9v.1" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.9-4.16" />
      <path d="M13.5 2v3.2h-3.2" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */

export function Preview() {
  const [locale, setLocale] = useState<UnalyzeLocale>('en')

  return (
    <>
      <style>{`
        /*
         * The review chrome.
         *
         * Deliberately committed to one look rather than following the viewer's theme: the page
         * shows both themes at once, so chrome that changed with a third theme would compete
         * with the thing under review. It is unlayered and unprefixed on purpose — this file
         * plays the part of the consuming application, and if any of it collided with the
         * library the collision would surface here first.
         *
         * Type is the system UI stack, and that is also accurate: the package bundles no fonts,
         * so a consumer who sets nothing sees exactly this.
         */
        .chrome {
          position: sticky; top: 0; z-index: 10;
          display: flex; gap: 16px; align-items: baseline;
          padding: 14px 20px;
          background: #0c0d10; color: #e7e9ee;
          border-bottom: 1px solid #23262e;
          font: 500 13px/1.4 ui-sans-serif, system-ui, -apple-system, sans-serif;
          letter-spacing: -0.005em;
        }
        .chrome b { font-weight: 600; letter-spacing: -0.015em; }
        .chrome .meta { color: #7d838f; font-variant-numeric: tabular-nums; }
        .chrome .controls { margin-left: auto; display: flex; gap: 8px; }
        .chrome button {
          font: inherit; cursor: pointer; padding: 5px 11px; border-radius: 6px;
          border: 1px solid #2c3038; background: #171a20; color: #e7e9ee;
          font-variant-numeric: tabular-nums;
        }
        .chrome button:hover { background: #1e222a; border-color: #3a3f4a; }
        .chrome button:focus-visible { outline: 2px solid #6ea8fe; outline-offset: 2px; }

        /* Per-pane label, so a screenshot of half this page still says which theme it is. */
        .pane-label {
          position: sticky; top: 45px; z-index: 5;
          padding: 7px 28px;
          font: 600 11px/1 ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .app-owned-class { text-transform: uppercase; letter-spacing: 0.06em; }

        .panes { display: grid; grid-template-columns: 1fr; }
        @media (min-width: 1400px) { .panes.side { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <header className="chrome">
        <b>Unalyze UI</b>
        <span className="meta">
          primitives · tokens read from the Figma design · dark only
        </span>
        <div className="controls">
          <button onClick={() => setLocale(locale === 'en' ? 'cs' : 'en')}>
            locale · {locale}
          </button>
          </div>
      </header>

      {/* One theme, so no side-by-side comparison to make. */}
      <Showcase theme="dark" locale={locale} />
    </>
  )
}

