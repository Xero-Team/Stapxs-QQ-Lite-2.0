import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    define: {
        'import.meta.env.VITE_STORAGE_BUILD_ID': JSON.stringify('test'),
    },
    plugins: [vue()],
    resolve: { alias: { '@renderer': fileURLToPath(new URL('../../src/renderer/src', import.meta.url)) } },
    server: { host: '127.0.0.1', port: 4174, strictPort: true },
})
