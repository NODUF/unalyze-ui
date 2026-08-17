import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * The preview builds to ONE self-contained HTML file.
 *
 * Not a build-tool flourish: it makes the visual review shareable as a file or a link, so a
 * design decision can be looked at by someone who has not cloned the repo and does not run node.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // Required by the single-file plugin: everything has to land in one chunk to be inlined.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
