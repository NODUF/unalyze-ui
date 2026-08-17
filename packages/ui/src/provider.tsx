import * as RadixTooltip from '@radix-ui/react-tooltip'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'

/**
 * Strings the library renders on the user's behalf — screen-reader labels, mostly.
 *
 * These exist as a table rather than as literals because the consuming application's CI enforces
 * EN + CS parity across its whole message catalogue. A hardcoded English "Loading" inside a
 * component would be invisible to that check and would ship untranslated.
 *
 * Anything a user actually reads on screen is a prop, not an entry here. This table is only for
 * text the component must produce when the caller has no way to supply it.
 */
export interface UnalyzeStrings {
  loading: string
  close: string
  dismiss: string
  previous: string
  next: string
}

const STRINGS: Record<string, UnalyzeStrings> = {
  en: {
    loading: 'Loading',
    close: 'Close',
    dismiss: 'Dismiss',
    previous: 'Previous',
    next: 'Next',
  },
  cs: {
    loading: 'Načítání',
    close: 'Zavřít',
    dismiss: 'Zavřít',
    previous: 'Předchozí',
    next: 'Další',
  },
}

export type UnalyzeLocale = keyof typeof STRINGS

/**
 * There is one theme. The type stays a union of one rather than disappearing, so adding a light
 * theme later widens it instead of introducing a prop that did not exist.
 */
export type UnalyzeTheme = 'dark'

interface UnalyzeContextValue {
  locale: UnalyzeLocale
  strings: UnalyzeStrings
  theme: UnalyzeTheme
}

const UnalyzeContext = createContext<UnalyzeContextValue | null>(null)

const FALLBACK: UnalyzeContextValue = {
  locale: 'en',
  strings: STRINGS.en as UnalyzeStrings,
  theme: 'dark',
}

export interface UnalyzeProviderProps {
  children: ReactNode
  /**
   * Which theme the tokens resolve to. Dark is the only one that exists today.
   *
   * `prefers-color-scheme` is deliberately not consulted: the application decides which theme
   * applies, and binding it here would override a product decision from inside a dependency.
   */
  theme?: UnalyzeTheme
  locale?: UnalyzeLocale
  /** Overrides for individual strings, for a consumer with their own catalogue. */
  strings?: Partial<UnalyzeStrings>
  /**
   * Write `data-un-theme` onto `<html>`.
   *
   * On by default because portalled surfaces — dialogs, popovers, toasts — render into
   * `document.body`, outside any wrapper element this provider could put the attribute on. Left
   * to a wrapper, an overlay would resolve against whatever the document root says instead of
   * against the provider — which matters the moment a second theme exists.
   *
   * Set it to false and put `data-un-theme` in your own root layout instead. That is the better
   * option for SSR: the attribute is then present in the first HTML response, so there is no
   * flash of the wrong theme before hydration.
   */
  applyThemeToDocument?: boolean
}

export function UnalyzeProvider({
  children,
  theme = 'dark',
  locale = 'en',
  strings,
  applyThemeToDocument = true,
}: UnalyzeProviderProps) {
  useEffect(() => {
    if (!applyThemeToDocument || typeof document === 'undefined') return

    const root = document.documentElement
    const previous = root.getAttribute('data-un-theme')
    root.setAttribute('data-un-theme', theme)

    // Restore rather than remove: the consuming app may have set the attribute itself, and an
    // unmounting provider must not strip their value.
    return () => {
      if (previous === null) root.removeAttribute('data-un-theme')
      else root.setAttribute('data-un-theme', previous)
    }
  }, [theme, applyThemeToDocument])

  const value = useMemo<UnalyzeContextValue>(
    () => ({
      locale,
      theme,
      strings: { ...(STRINGS[locale] ?? STRINGS.en), ...strings } as UnalyzeStrings,
    }),
    [locale, theme, strings],
  )

  return (
    <UnalyzeContext.Provider value={value}>
      {/*
        Radix requires a tooltip provider above any tooltip, and mounting it here means a consumer
        never has to know that. It also owns the shared timing: once one tooltip has opened the
        next opens immediately, which is what makes scanning a toolbar feel responsive rather than
        sticky. `delayDuration` is generous enough that a pointer crossing a control does not
        summon a tooltip it never asked for.
      */}
      <RadixTooltip.Provider delayDuration={350} skipDelayDuration={300}>
        {/*
          The attribute is also written here so a subtree renders correctly during SSR and inside
          tests, where the effect above has not run yet. `display: contents` keeps the wrapper out
          of the layout entirely — it must never introduce a box the consumer did not ask for.
        */}
        <div data-un-theme={theme} data-un-root="" style={{ display: 'contents' }}>
          {children}
        </div>
      </RadixTooltip.Provider>
    </UnalyzeContext.Provider>
  )
}

/**
 * Reads provider context, falling back to sane defaults.
 *
 * Deliberately does NOT throw when the provider is missing. A component library that crashes
 * because someone forgot a wrapper is a bad neighbour; an unwrapped `<Button>` renders in
 * English on the dark theme, which is exactly what an unwrapped button should do.
 */
export function useUnalyze(): UnalyzeContextValue {
  return useContext(UnalyzeContext) ?? FALLBACK
}
