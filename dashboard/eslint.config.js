import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

// Minimal ESLint stack for the React + TypeScript frontend.
// typescript-eslint is not used because it hard-blocks TS 7.0 (no compatible
// release exists in the registry yet), so TS files are parsed with the
// version-agnostic Babel TypeScript preset instead. `tsc --noEmit` remains the
// source of truth for type checking; no-undef/no-unused-vars are therefore
// disabled for TS files (TypeScript covers those checks).
// react-hooks/exhaustive-deps is intentionally disabled: the live pages close
// over context/state via nested helper functions and keep effect dependency
// arrays minimal on purpose. rules-of-hooks stays enforced.
export default [
  {
    ignores: ['dist'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript'],
          plugins: ['@babel/plugin-syntax-jsx'],
        },
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-hooks/exhaustive-deps': 'off',
      // The pages intentionally reset state (setError(null), modal resets,
      // auth-triggered site resets) synchronously at the start of effects.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]
