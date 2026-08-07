/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'
import lingui, { linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), lingui(), babel({ presets: [linguiTransformerBabelPreset(), reactCompilerPreset()] })],
  server: {
    port: 5173,
    proxy: {
      '/ingest': {
        target: process.env.VITE_API_PROXY || 'https://tracking.test',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '.localhost',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 40,
        statements: 60,
      },
    },
  },
})
