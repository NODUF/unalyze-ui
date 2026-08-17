import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@noduf/unalyze-ui/styles.css'
import { Preview } from './preview'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
