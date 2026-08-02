// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const boundaries = /** @type {import('eslint').ESLint.Plugin} */ (
  require('eslint-plugin-boundaries')
);
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/root-path': __dirname,
      'boundaries/elements': [
        {
          type: 'docs',
          pattern: 'projects/docs/src',
          partialMatch: false,
        },
        {
          type: 'electron-renderer',
          pattern: 'projects/electron/src',
          partialMatch: false,
        },
        {
          type: 'electron-main',
          pattern: 'projects/electron/electron',
          partialMatch: false,
        },
      ],
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkAllOrigins: false,
          checkUnknownLocals: false,
          checkInternals: false,
          policies: [
            {
              from: {
                element: {
                  type: 'electron-main',
                },
              },
              allow: {
                to: {
                  element: {
                    type: 'electron-renderer',
                    fileInternalPath: 'app/core/qdb-contracts.ts',
                  },
                },
              },
            },
          ],
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/sort-keys-in-type-decorator': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/component-max-inline-declarations': ['error', { template: 10, styles: 0 }],
      '@angular-eslint/inject-at-top': 'error',
      'no-unused-private-class-members': 'off',
      '@typescript-eslint/no-unused-private-class-members': 'error',
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/attributes-order': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Call[args.length > 0]:not(BoundEvent Call)',
          message:
            'Avoid calling functions with arguments in templates. Use signals or properties instead.',
        },
      ],
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    files: ['projects/electron/src/app/core/country-flag/generated-flags.ts'],
    rules: {
      'max-lines': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'max-lines': ['error', { max: 800, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    files: ['**/electron/database.ts'],
    rules: {
      'max-lines': ['error', { max: 900, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    files: ['**/electron/importer.ts'],
    rules: {
      'max-lines': ['error', { max: 2200, skipBlankLines: false, skipComments: false }],
    },
  },
]);
