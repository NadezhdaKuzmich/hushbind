import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-po'

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en'],
  // File names stay as context for translators; line numbers would change the catalog on every edit
  format: formatter({ lineNumbers: false }),
  catalogs: [
    {
      path: '<rootDir>/src/i18n/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/*.test.*'],
    },
  ],
})
