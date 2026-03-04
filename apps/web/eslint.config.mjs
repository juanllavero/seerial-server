import { baseConfig } from '@seerial/config/eslint-preset.js'
import eslintPluginPrettierRecommended from 'eslint-config-prettier'
import pluginReact from 'eslint-plugin-react'
import reactCompiler from 'eslint-plugin-react-compiler'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
    languageOptions: { globals: globals.browser },
  },
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
]
