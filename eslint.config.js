import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default [
    {
        ignores: [
            'node_modules/**',
            '.vite/**',
            'dist/**',
            'out/**',
            'coverage/**',
            'ssqq.*/dist/**',
            'src/renderer/public/bcui/js/**',
            'src/renderer/public/sw.js',
            'src/renderer/src/assets/img/qq-face/**',
            'dist_electron/**',
            'dist_capacitor/**',
            '.gitignore',
            'src/renderer/public/**',
            'src/renderer/src/assets/**',
            'src/mobile/**',
            // Rust build output contains binary-packed generated JavaScript
            // assets; it is never source and must not be parsed by ESLint.
            'src/tauri/target/**',
            'ssqq.capacitor-onebot-connector/**',
            'ssqq.napcat-plugin/**',
        ],
    },
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    eslint.configs.recommended,
    ...vue.configs['flat/recommended'],
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
        },
        plugins: { '@typescript-eslint': tseslint },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none',
            }],
            'no-console': 'warn',
            'no-debugger': 'warn',
        },
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
        },
        plugins: { '@typescript-eslint': tseslint },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none',
            }],
        },
    },
    {
        files: [
            'src/renderer/src/components/History.vue',
            'src/renderer/src/components/tooltip/Tooltip.vue',
            'src/renderer/src/components/tooltip/Tooltips.vue',
            'src/renderer/src/components/msg-component/jsonComp/**/*.vue',
        ],
        rules: {
            'vue/multi-word-component-names': 'off',
        },
    },
    {
        files: [
            'src/renderer/src/protocol/**/*.ts',
            'src/renderer/src/transport/**/*.ts',
            'src/renderer/src/storage/**/*.ts',
            'src/renderer/src/network/**/*.ts',
            'tests/**/*.ts',
        ],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.eslint.json',
            },
        },
        plugins: { '@typescript-eslint': tseslint },
        rules: {
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false }],
        },
    },
]
