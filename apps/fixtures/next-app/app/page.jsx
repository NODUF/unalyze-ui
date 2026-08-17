import { Button, Heading, Surface, Text, UnalyzeProvider } from '@noduf/unalyze-ui'

/**
 * A Server Component importing the library directly.
 *
 * No `'use client'` anywhere in this file. If the published bundle were missing its directive,
 * `next build` fails here with "You're importing a component that needs useContext" — which is
 * precisely the failure that a green library build cannot see and the consuming team would.
 */
export default function Page() {
  return (
    <UnalyzeProvider theme="light" locale="cs" applyThemeToDocument={false}>
      <Surface level="raised" padding="lg">
        <Heading level={1}>Čistý P/L</Heading>
        <Text tone="positive" numeric>
          +4 128,60 Kč
        </Text>
        <Text tone="negative" numeric>
          −316,80 Kč
        </Text>
        <Button variant="primary">Přidat účet</Button>
        <Button variant="destructive" size="sm">
          Smazat
        </Button>
      </Surface>
    </UnalyzeProvider>
  )
}
