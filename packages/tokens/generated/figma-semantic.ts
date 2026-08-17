/**
 * GENERATED FILE — do not edit.
 *
 * Source: figma/exports/*.json  ·  Rules: figma/figma.config.json
 * Regenerate: pnpm tokens
 *
 * Committed on purpose: a design change must arrive as a reviewable diff.
 */

/**
 * The shadcn/ui role vocabulary, resolved per theme.
 *
 * Neutral ramp: slate. Change it in figma/figma.config.json and regenerate.
 */
export const figmaSemantic = {
  dark: {
    "accent": "rgb(91 253 139 / 0.1)",
    "accent-foreground": "#5bfd8b",
    "background": "#000000",
    "bg-accent-50": "rgb(91 253 139 / 0.05)",
    "bg-destructive-10": "rgb(217 83 75 / 0.1)",
    "bg-muted-40": "rgb(174 174 174 / 0.04)",
    "bg-muted-50": "rgb(174 174 174 / 0.05)",
    "border": "rgb(255 255 255 / 0.12)",
    "border-destructive-50": "rgb(217 83 75 / 0.5)",
    "border-muted-40": "rgb(255 255 255 / 0.04)",
    "card": "rgb(174 174 174 / 0.05)",
    "card-foreground": "#faf8f8",
    "destructive": "#d9534b",
    "destructive-20-hover": "rgb(217 83 75 / 0.2)",
    "destructive-foreground": "#000000",
    "destructive-hover": "#e4736c",
    "foreground": "#faf8f8",
    "input": "rgb(255 255 255 / 0.12)",
    "muted": "rgb(174 174 174 / 0.05)",
    "muted-foreground": "rgb(250 248 248 / 0.6)",
    "neon-green": "#adfa1d",
    "popover": "rgb(0 0 0 / 0.7)",
    "popover-foreground": "#faf8f8",
    "primary": "#5bfd8b",
    "primary-foreground": "#000000",
    "primary-hover": "#7cf2a6",
    "ring": "#5bfd8b",
    "secondary": "rgb(250 248 248 / 0.08)",
    "secondary-foreground": "#faf8f8",
    "secondary-hover": "rgb(250 248 248 / 0.16)",
    "sidebar-accent": "rgb(91 253 139 / 0.1)",
    "sidebar-accent-foreground": "#5bfd8b",
    "sidebar-background": "#000000",
    "sidebar-border": "rgb(255 255 255 / 0.12)",
    "sidebar-foreground": "#a5aca9",
    "sidebar-foreground-70": "rgb(165 172 169 / 0.7)",
    "sidebar-primary": "#5bfd8b",
    "sidebar-primary-foreground": "#000000",
    "sidebar-ring": "#5bfd8b",
    "success": "#5bfd8b",
    "success-hover": "#7cf2a6",
  },
} as const

/** Which primitive each role resolves through. Makes a colour diff say WHY, not just what. */
export const provenance = {
  dark: {
    "accent": "",
    "accent-foreground": "Green/500",
    "background": "Canvas/black",
    "bg-accent-50": "",
    "bg-destructive-10": "",
    "bg-muted-40": "",
    "bg-muted-50": "",
    "border": "",
    "border-destructive-50": "",
    "border-muted-40": "",
    "card": "",
    "card-foreground": "Content/base",
    "destructive": "Loss/500",
    "destructive-20-hover": "",
    "destructive-foreground": "Canvas/black",
    "destructive-hover": "Loss/400",
    "foreground": "Content/base",
    "input": "",
    "muted": "",
    "muted-foreground": "",
    "neon-green": "",
    "popover": "",
    "popover-foreground": "Content/base",
    "primary": "Green/500",
    "primary-foreground": "Canvas/black",
    "primary-hover": "Green/400",
    "ring": "Green/500",
    "secondary": "",
    "secondary-foreground": "Content/base",
    "secondary-hover": "",
    "sidebar-accent": "",
    "sidebar-accent-foreground": "Green/500",
    "sidebar-background": "Canvas/black",
    "sidebar-border": "",
    "sidebar-foreground": "Content/muted",
    "sidebar-foreground-70": "",
    "sidebar-primary": "Green/500",
    "sidebar-primary-foreground": "Canvas/black",
    "sidebar-ring": "Green/500",
    "success": "Green/500",
    "success-hover": "Green/400",
  },
} as const

/** Figma variable descriptions, surfaced in the docs site. */

export const descriptions = {

} as const


export type ThemeName = keyof typeof figmaSemantic
export type FigmaSemanticToken = keyof (typeof figmaSemantic)[ThemeName]
