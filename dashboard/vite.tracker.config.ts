import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(root, 'src/tracker.ts'),
      name: 'AnalyticsTracker',
      formats: ['iife'],
      fileName: () => 'x7k2p.js',
    },
    minify: 'oxc',
    cssCodeSplit: false,
  },
})
