#!/usr/bin/env node
/**
 * Turns the single-file Vite build into a shareable page fragment.
 *
 * The hosting surface supplies its own `<!doctype>`, `<html>`, `<head>` and `<body>`, so a
 * complete document would end up nested inside another one. This strips the shell and keeps
 * everything that matters: the inlined stylesheet, the inlined bundle and the mount point.
 *
 * Nothing is re-authored. The published page is the same bytes the preview app produces, which
 * is the only way a shared review stays honest about what the library actually looks like.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '../dist')
const source = readFileSync(resolve(dist, 'index.html'), 'utf8')

/**
 * Strip the document shell, keep everything inside it in source order.
 *
 * Extracting `<style>` and `<script>` separately looked tidier and was wrong: the single-file
 * plugin is free to place the inlined bundle in either `<head>` or `<body>`, and it moved. Order
 * matters here — the stylesheet has to precede the mount point — so removing the wrapper tags and
 * leaving the contents alone is both simpler and correct whichever way the plugin decides.
 */
const inner = source
  .replace(/<!doctype[^>]*>/gi, '')
  .replace(/<\/?(?:html|head|body)(?:\s[^>]*)?>/gi, '')
  // The host owns the document metadata; only our own <title> survives, set below.
  .replace(/<meta[^>]*>/gi, '')
  .replace(/<link[^>]*>/gi, '')
  .replace(/<title>[\s\S]*?<\/title>/gi, '')
  .trim()

if (!inner.includes('<script')) {
  throw new Error('Built HTML has no inlined script — is vite-plugin-singlefile still enabled?')
}
if (!inner.includes('<style')) {
  throw new Error('Built HTML has no inlined stylesheet — cssCodeSplit must stay off.')
}

const out = `<title>Unalyze UI Primitives</title>
${inner}
`

// Written under a descriptive name as well: the published page is keyed by file path, and
// `artifact.html` says nothing about what it contains when it turns up in a list of them.
for (const name of ['artifact.html', 'unalyze-ui-review.html']) {
  writeFileSync(resolve(dist, name), out, 'utf8')
}
console.log(`artifact → dist/unalyze-ui-review.html (${(Buffer.byteLength(out) / 1024).toFixed(0)} kB)`)
