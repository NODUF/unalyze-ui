#!/usr/bin/env node
/**
 * Re-emits three of the `figma/exports/*.json` files from values transcribed out of the UNALYZE
 * Figma file (`sPhUUdRZESDiMDKzD1GO4L`) on 2026-08-17.
 *
 * ## Why this exists, and when to stop using it
 *
 * The normal path is the Figma variables-export plugin: it writes `figma/exports/` directly and
 * this script is not involved. That path was unavailable when the Unalyze palette was first
 * brought across, so the values were read through the Figma MCP and transcribed here instead.
 *
 * **Once anyone re-exports with the plugin, that output wins and this file becomes history.**
 * It is committed rather than discarded for one reason: it is the written record of which
 * literal produced which token, so a later diff can be traced rather than guessed at.
 *
 * It only covers the three collections that changed — `unalyze_brand`, `shadcn/ui` and
 * `Typography`. `Tailwind Colors`, `Tailwind Primitives` and `Primitives` are stock and were
 * left as the plugin originally exported them.
 *
 * Run: node tooling/generate-exports-from-figma.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../figma/exports')

const rgba = (s) => {
  const [hex, a] = s.split('/')
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
    a: a === undefined ? 1 : Number(a),
  }
}

let seq = 9000
const nextId = () => `VariableID:900:${seq++}`

/** Builds one collection file in the shape the Figma variables-export plugin emits. */
function collection({ id, name, modes, vars }) {
  const modeIds = Object.fromEntries(modes.map((m, i) => [m, `900:${i}`]))
  const variables = vars.map((v) => {
    const varId = nextId()
    const valuesByMode = {}
    const resolvedValuesByMode = {}
    for (const mode of modes) {
      const cell = v.m[mode]
      const value = v.t === 'COLOR' ? rgba(cell.v) : v.t === 'FLOAT' ? Number(cell.v) : cell.v
      valuesByMode[modeIds[mode]] = value
      resolvedValuesByMode[modeIds[mode]] = {
        resolvedValue: value,
        alias: cell.via ? 'VariableID:alias' : null,
        ...(cell.via ? { aliasName: cell.via } : {}),
      }
    }
    return {
      id: varId,
      name: v.n,
      description: v.d ?? '',
      type: v.t,
      valuesByMode,
      resolvedValuesByMode,
      scopes: v.s ?? ['ALL_SCOPES'],
      hiddenFromPublishing: v.h ?? false,
      codeSyntax: v.w ? { WEB: v.w } : {},
    }
  })

  return {
    id,
    name,
    modes: Object.fromEntries(Object.entries(modeIds).map(([n, i]) => [i, n])),
    variableIds: variables.map((v) => v.id),
    variables,
  }
}

/* ---------------------------------------------------------------- brand */

const C = (n, v) => ({ n, t: 'COLOR', m: { 'Mode 1': { v, via: null } }, h: true })

const brand = collection({
  id: 'VariableCollectionId:102:1319',
  name: 'unalyze_brand',
  modes: ['Mode 1'],
  vars: [
    C('Alert/500', '#ff5850'),
    C('Canvas/black', '#000000'),
    C('Chart/magenta-400', '#d9558f'),
    C('Chart/magenta-700', '#92164c'),
    C('Chart/violet-400', '#bc74ff'),
    C('Chart/violet-600', '#9c32ff'),
    C('Content/base', '#faf8f8'),
    C('Content/muted', '#a5aca9'),
    C('Content/subtle', '#8b938f'),
    C('Green/300', '#c9ffd9'),
    C('Green/400', '#7cf2a6'),
    C('Green/500', '#5bfd8b'),
    C('Green/600', '#2fd36b'),
    C('Green/950', '#061007'),
    C('Info/500', '#3288ff'),
    C('Loss/400', '#e4736c'),
    C('Loss/500', '#d9534b'),
    C('Surface/veil', '#aeaeae'),
    C('Warning/500', '#e6b800'),
  ],
})

/* --------------------------------------------------------------- shadcn */

// [name, lightValue, lightVia, darkValue, darkVia]
const ROLES = [
  ['background', '#ffffff', 'base/white', '#000000', 'Canvas/black'],
  ['sidebar/background', '#fafafa', 'zinc/50', '#000000', 'Canvas/black'],
  ['bg-muted-40', '#f1f5f9/0.4', null, '#aeaeae/0.04', null],
  ['bg-muted-50', '#f1f5f9/0.5', null, '#aeaeae/0.05', null],
  ['bg-accent-50', '#f1f5f9/0.5', null, '#5bfd8b/0.05', null],
  ['foreground', '#09090b', 'zinc/950', '#faf8f8', 'Content/base'],
  ['sidebar/foreground', '#3f3f46', 'zinc/700', '#a5aca9', 'Content/muted'],
  ['sidebar/foreground-70', '#3f3f46/0.7', null, '#a5aca9/0.7', null],
  ['sidebar/primary', '#18181b', 'zinc/900', '#5bfd8b', 'Green/500'],
  ['sidebar/primary-foreground', '#fafafa', 'zinc/50', '#000000', 'Canvas/black'],
  ['sidebar/accent', '#f4f4f5', 'zinc/100', '#5bfd8b/0.1', null],
  ['sidebar/accent-foreground', '#18181b', 'zinc/900', '#5bfd8b', 'Green/500'],
  ['sidebar/border', '#e4e4e7', 'zinc/200', '#ffffff/0.12', null],
  ['sidebar/ring', '#a1a1aa', 'zinc/400', '#5bfd8b', 'Green/500'],
  ['muted', '#f4f4f5', 'zinc/100', '#aeaeae/0.05', null],
  ['muted-foreground', '#71717a', 'zinc/500', '#faf8f8/0.6', null],
  ['card', '#ffffff', 'base/white', '#aeaeae/0.05', null],
  ['card-foreground', '#09090b', 'zinc/950', '#faf8f8', 'Content/base'],
  ['popover', '#ffffff', 'base/white', '#000000/0.7', null],
  ['popover-foreground', '#09090b', 'zinc/950', '#faf8f8', 'Content/base'],
  ['border', '#e4e4e7', 'zinc/200', '#ffffff/0.12', null],
  ['border-muted-40', '#f1f5f9/0.4', null, '#ffffff/0.04', null],
  ['border-destructive-50', '#fecaca', 'red/200', '#d9534b/0.5', null],
  ['input', '#e4e4e7', 'zinc/200', '#ffffff/0.12', null],
  ['primary', '#18181b', 'zinc/900', '#5bfd8b', 'Green/500'],
  ['primary-foreground', '#fafafa', 'zinc/50', '#000000', 'Canvas/black'],
  ['hover:primary', '#27272a', 'zinc/800', '#7cf2a6', 'Green/400'],
  ['secondary', '#f1f5f9', 'slate/100', '#faf8f8/0.08', null],
  ['secondary-foreground', '#18181b', 'zinc/900', '#faf8f8', 'Content/base'],
  ['hover:secondary', '#e4e4e7', 'zinc/200', '#faf8f8/0.16', null],
  ['accent', '#f4f4f5', 'zinc/100', '#5bfd8b/0.1', null],
  ['accent-foreground', '#18181b', 'zinc/900', '#5bfd8b', 'Green/500'],
  ['destructive', '#dc2626', 'red/600', '#d9534b', 'Loss/500'],
  ['destructive-foreground', '#fafafa', 'zinc/50', '#000000', 'Canvas/black'],
  ['hover:destructive', '#ef4444', 'red/500', '#e4736c', 'Loss/400'],
  ['bg-destructive-10', '#dc2626/0.1', null, '#d9534b/0.1', null],
  ['hover:destructive-20', '#dc2626/0.2', null, '#d9534b/0.2', null],
  ['ring', '#71717a', 'zinc/500', '#5bfd8b', 'Green/500'],
  ['success', '#16a34a', 'green/600', '#5bfd8b', 'Green/500'],
  ['hover:succes', '#15803d', 'green/700', '#7cf2a6', 'Green/400'],
  ['neon-green', '#adfa1d', null, '#adfa1d', null],
]

const shadcn = collection({
  id: 'VariableCollectionId:23:1105',
  name: 'shadcn/ui',
  modes: ['light/slate', 'dark/slate'],
  vars: ROLES.map(([n, lv, lvia, dv, dvia]) => ({
    n,
    t: 'COLOR',
    m: {
      'light/slate': { v: lv, via: lvia },
      'dark/slate': { v: dv, via: dvia },
    },
  })),
})

/* ----------------------------------------------------------- typography */

const T = (n, v, t = 'FLOAT', w = null) => ({ n, t, m: { 'Mode 1': { v, via: null } }, w })

const typography = collection({
  id: 'VariableCollectionId:23:3',
  name: 'Typography',
  modes: ['Mode 1'],
  vars: [
    T('font-family/font-display', 'Nohemi', 'STRING'),
    T('font-family/font-mono', 'SF Mono', 'STRING'),
    T('font-family/font-sans', 'Nohemi', 'STRING'),
    T('font-family/font-serif', 'Georgia', 'STRING'),
    // Sizes the design uses that the stock Tailwind ramp does not carry. Named by pixel value
    // rather than by a ladder position, because they do not sit on the ladder — inventing
    // `xs-plus` / `2xl-minus` would imply a relationship that is not there.
    T('font-size/text-10', 10, 'FLOAT'),
    T('font-size/text-11', 11, 'FLOAT'),
    T('font-size/text-13', 13, 'FLOAT'),
    T('font-size/text-15', 15, 'FLOAT'),
    T('font-size/text-21', 21, 'FLOAT'),
    T('font-size/text-28', 28, 'FLOAT'),
    T('font-size/text-xs', 12, 'FLOAT', 'text-xs'),
    T('font-size/text-sm', 14, 'FLOAT', 'text-sm'),
    T('font-size/text-base', 16, 'FLOAT', 'text-base'),
    T('font-size/text-lg', 18, 'FLOAT', 'text-lg'),
    T('font-size/text-xl', 20, 'FLOAT', 'text-xl'),
    T('font-size/text-2xl', 24, 'FLOAT', 'text-2xl'),
    T('font-size/text-3xl', 30, 'FLOAT', 'text-3xl'),
    T('font-size/text-4xl', 36, 'FLOAT', 'text-4xl'),
    T('font-size/text-5xl', 48, 'FLOAT', 'text-5xl'),
    T('font-size/text-6xl', 60, 'FLOAT', 'text-6xl'),
    T('font-size/text-7xl', 72, 'FLOAT', 'text-7xl'),
    T('font-size/text-8xl', 96, 'FLOAT', 'text-8xl'),
    T('font-size/text-9xl', 128, 'FLOAT', 'text-9xl'),
    T('line-height/leading-15', 15, 'FLOAT'),
    T('line-height/leading-22', 22, 'FLOAT'),
    T('line-height/leading-3', 12, 'FLOAT', 'leading-3'),
    T('line-height/leading-4', 16, 'FLOAT', 'leading-4'),
    T('line-height/leading-5', 20, 'FLOAT', 'leading-5'),
    T('line-height/leading-6', 24, 'FLOAT', 'leading-6'),
    T('line-height/leading-7', 28, 'FLOAT', 'leading-7'),
    T('line-height/leading-8', 32, 'FLOAT', 'leading-8'),
    T('line-height/leading-9', 36, 'FLOAT', 'leading-9'),
    T('line-height/leading-10', 40, 'FLOAT', 'leading-10'),
    T('font-weight/font-thin', 100),
    T('font-weight/font-extralight', 200),
    T('font-weight/font-light', 300),
    T('font-weight/font-normal', 400),
    T('font-weight/font-medium', 500),
    T('font-weight/font-semibold', 600),
    T('font-weight/font-bold', 700),
    T('font-weight/font-extrabold', 800),
    T('font-weight/font-black', 900),
  ],
})

for (const [file, data] of [
  ['unalyze_brand.json', brand],
  ['shadcn_ui.json', shadcn],
  ['Typography.json', typography],
]) {
  writeFileSync(resolve(OUT, file), JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`${file}: ${data.variables.length} vars, modes ${Object.values(data.modes).join(' | ')}`)
}
