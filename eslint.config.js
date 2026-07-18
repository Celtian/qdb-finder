// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
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
    rules: {
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
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        {
          template: 0,
          styles: 0,
        },
      ],
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
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Call[args.length > 0]:not(BoundEvent Call)',
          message:
            'Avoid calling functions with arguments in templates. Use signals or properties instead.',
        },
      ],
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
]);
