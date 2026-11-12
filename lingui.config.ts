import { defineConfig } from '@lingui/cli'

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en'],
  catalogs: [
    {
      path: '<rootDir>/src/i18n/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/*.test.*'],
    },
  ],
})
