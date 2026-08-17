/**
 * Fixture: an ESM bundler consuming the published package.
 *
 * Written in plain JSX with no TypeScript on purpose — a consumer without TS must still be able
 * to install and build. Type errors are our problem; a broken ESM entry is theirs.
 */

import { createRoot } from 'react-dom/client'
import { Button, Heading, Surface, Text, UnalyzeProvider } from '@noduf/unalyze-ui'
import '@noduf/unalyze-ui/styles.css'

function App() {
  return (
    <UnalyzeProvider theme="light" locale="en">
      <Surface level="raised">
        <Heading level={1}>Net P/L</Heading>
        <Text tone="positive" numeric>
          +4,128.60
        </Text>
        <Button variant="primary" icon={<span>+</span>}>
          Add account
        </Button>
      </Surface>
    </UnalyzeProvider>
  )
}

createRoot(document.getElementById('root')).render(<App />)
