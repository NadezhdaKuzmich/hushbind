import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'src/i18n/locales/**/*.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.flatConfigs.strict,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // APG: a tab panel without focusable content is itself focusable
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel'], tags: [] }],
      // security: no HTML injection or dynamic code
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Injecting raw HTML is not allowed.',
        },
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message: 'Use React rendering instead of innerHTML.',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['*.config.{js,ts}', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
)
