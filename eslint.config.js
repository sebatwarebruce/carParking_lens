import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'dev-dev-dist', 'node_modules'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.vitest }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...js.configs.recommended.rules, ...reactHooks.configs.recommended.rules, 'no-unused-vars': ['warn', { varsIgnorePattern: '^(_|React$)', argsIgnorePattern: '^_' }], 'react-hooks/set-state-in-effect': 'off', 'react-hooks/purity': 'off' },
  },
];
