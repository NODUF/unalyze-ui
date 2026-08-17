import '@noduf/unalyze-ui/styles.css'

/**
 * A Server Component root layout.
 *
 * `data-un-theme` is set here rather than left to the provider's effect — the attribute is then
 * in the first HTML response, so there is no flash of the wrong theme before hydration. This is
 * the integration the docs recommend, so the fixture proves the recommendation actually works.
 */
export const metadata = { title: 'fixture-next-app' }

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-un-theme="light">
      <body>{children}</body>
    </html>
  )
}
