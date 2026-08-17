#!/usr/bin/env node
/**
 * Gate G8 — the fixture matrix.
 *
 * Packs the real tarballs and installs them into applications that are NOT part of this
 * workspace, then builds each one. Everything else in CI tests the source; this tests the
 * artefact, which is the only thing the consuming team ever sees.
 *
 * The three fixtures cover three distinct failure modes, not three frameworks for their own sake:
 *
 *   node-cjs   `require()` + renderToString — the CJS half of the exports map, and SSR
 *   vite       an ESM bundler — the ESM entry, and whether the stylesheet survives tree-shaking
 *   next-app   React Server Components — whether the `'use client'` directive actually shipped
 *
 * Usage: node tooling/test-fixtures.mjs [name …]   (default: all)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const FIXTURE_DIR = join(ROOT, 'apps/fixtures')
const PACKAGES = ['packages/tokens', 'packages/ui']

const run = (cmd, args, cwd, env) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })

const capture = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim()

/* ------------------------------------------------------------------ *
 * Pack
 * ------------------------------------------------------------------ */

const staging = mkdtempSync(join(tmpdir(), 'unalyze-pack-'))
const tarballs = []

console.log('· packing')
for (const pkg of PACKAGES) {
  run('npm', ['pack', '--pack-destination', staging, '--silent'], join(ROOT, pkg))
}
for (const file of readdirSync(staging)) {
  if (file.endsWith('.tgz')) tarballs.push(join(staging, file))
}

if (tarballs.length !== PACKAGES.length) {
  throw new Error(`expected ${PACKAGES.length} tarballs, got ${tarballs.length}`)
}
for (const t of tarballs) console.log(`  ${t.split('/').pop()}`)

/* ------------------------------------------------------------------ *
 * Install and verify, each in a throwaway copy
 * ------------------------------------------------------------------ */

const requested = process.argv.slice(2)
const fixtures = readdirSync(FIXTURE_DIR).filter((f) => !requested.length || requested.includes(f))

let failed = 0

for (const name of fixtures) {
  const work = mkdtempSync(join(tmpdir(), `unalyze-fixture-${name}-`))

  // Copied out of the repo before installing. An install inside the workspace tree lets pnpm and
  // npm walk upwards, find the workspace root and link the source — which would make this gate
  // pass while testing nothing.
  cpSync(join(FIXTURE_DIR, name), work, { recursive: true })

  console.log(`\n· ${name}`)
  try {
    run('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error', ...tarballs], work)
    run('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error'], work)

    // Prove we are testing the tarball, not a stray link back into the repo.
    const resolved = capture(
      'node',
      ['-e', "process.stdout.write(require.resolve('@noduf/unalyze-ui/package.json'))"],
      work,
    )
    if (resolved.includes(ROOT)) {
      throw new Error(`fixture resolved @noduf/unalyze-ui back into the repo: ${resolved}`)
    }

    run('npm', ['run', 'verify'], work)
    console.log(`✓ ${name}`)
  } catch {
    console.error(`✗ ${name}`)
    failed += 1
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

rmSync(staging, { recursive: true, force: true })

if (failed) {
  console.error(`\n${failed} fixture(s) failed. The package builds but does not install cleanly.`)
  process.exit(1)
}
console.log(`\n✓ all ${fixtures.length} fixtures installed the tarball and built`)
