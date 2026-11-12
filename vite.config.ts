/// <reference types="vitest/config" />
import { lingui } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages serves a project site from /<repo>/, CI passes it in
function resolveBase(): string {
  const base = process.env.BASE_PATH
  return base ? base.replace(/\/?$/, '/') : '/'
}

// GitHub Pages can't send headers, so CSP goes into a meta tag (ADR-6).
// Build only: the dev server injects inline styles for hot reload.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'hushbind:csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig({
  base: resolveBase(),
  plugins: [
    lingui({ macroTransform: true }),
    babel({ presets: [reactCompilerPreset()] }),
    react(),
    contentSecurityPolicy(),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    // no data: URIs, so the CSP can stay strict
    assetsInlineLimit: 0,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/i18n/locales/**'],
      // Branch % is skewed by React Compiler memo checks, so lines/functions are the gate
      thresholds: { lines: 85, functions: 85 },
    },
  },
})
