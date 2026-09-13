import ViteYaml from '@modyfi/vite-plugin-yaml'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { randomUUID } from 'node:crypto'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv, UserConfigFnObject, type PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import qfaceInfo from './src/renderer/src/assets/img/qq-face/public/assets/qq_emoji/_index.json' with { type: 'json' }
import { resolveFontProfile } from './scripts/noto-fonts.mjs'
import { prepareNotoFonts } from './scripts/prepare-noto-fonts.mjs'

const isDesktop = !!process.env.DESKTOP
const fontProfile = resolveFontProfile()

export function configFactory(outPath: string): UserConfigFnObject {
    return ({ mode }) => {
        const env = loadEnv(mode, process.cwd())
        const useLocalFace = env.VITE_LOCAL_FACE == 'true'
        const basePath = env.VITE_APP_BASE_PATH || './'

        const plugins: PluginOption[] = [
            {
                name: 'storage-build-id',
                config(_userConfig, { command }) {
                    const id = command === 'build' ? randomUUID() : 'dev'
                    return {
                        define: {
                            'import.meta.env.VITE_STORAGE_BUILD_ID': JSON.stringify(id),
                        },
                    }
                },
            },
            vue(),
            vueDevTools(),
            ViteYaml(),
            {
                name: 'prepare-noto-fonts',
                async config() {
                    if (fontProfile !== 'system') await prepareNotoFonts()
                    return {}
                },
                transformIndexHtml(html) {
                    if (fontProfile === 'system') return html
                    return html.replace(
                        '</head>',
                        '        <link rel="stylesheet" href="/fonts/faces.css">\n    </head>',
                    )
                },
            },
            !isDesktop && VitePWA({
                registerType: 'autoUpdate',
                workbox: {
                    globIgnores: ['**/fonts/**'],
                    runtimeCaching: [{
                        urlPattern: /\/fonts\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'noto-fonts',
                            expiration: {
                                maxEntries: 120,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    }],
                },
            }),
            visualizer() as unknown as PluginOption,
            {
                name: 'dev-csp',
                transformIndexHtml(html) {
                    if (mode !== 'development') return html
                    return html.replace(
                        "script-src 'self'",
                        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                    )
                },
            },
        ]

        if (useLocalFace) {
            const apngList: string[] = []
            const lottieList: string[] = []
            for (const info of qfaceInfo) {
                for (const pathInfo of info.assets) {
                    if (pathInfo.type === 2)
                        apngList.push(`src/assets/img/qq-face/public/${pathInfo.path}`)

                    else if (pathInfo.type === 3)
                        lottieList.push(`src/assets/img/qq-face/public/${pathInfo.path}`)
                }
            }

            const targets: Array<{ src: string; dest: string }> = []
            for (const src of apngList) {
                targets.push({
                    src: src,
                    dest: 'img/qface/',
                })
            }
            for (const src of lottieList) {
                targets.push({
                    src: src,
                    dest: 'img/qface/',
                })
            }

            plugins.push(viteStaticCopy({
                targets: targets
            }))
        }

        if (fontProfile !== 'system') {
            plugins.push(viteStaticCopy({
                targets: [{
                    src: resolve(__dirname, `resources/fonts/${fontProfile}/*`),
                    dest: 'fonts',
                }],
            }))
        }

        return {
            root: './src/renderer',
            envDir: '../../',
            cacheDir: '../../.vite',
            base: basePath,
            server: {
                port: 8080,
                proxy: {
                    '/api': {
                        target: 'http://localhost:3000',
                        changeOrigin: true,
                        rewrite: (path) => path.replace(/^\/api/, '')
                    }
                }
            },
            plugins: plugins,
            resolve: {
                alias: {
                    '@renderer': resolve(__dirname, 'src/renderer/src'),
                    fs: 'rollup-plugin-node-polyfills/polyfills/empty',
                }
            },
            build: {
                outDir: outPath,
                emptyOutDir: true,
                chunkSizeWarningLimit: 1100,
                rollupOptions: {
                    input: { main: resolve('src/renderer/index.html') },
                    external: [resolve('src/renderer/src/assets/img/qq-face/docs')],
                    onwarn: (warning) => {
                        if (warning.code === 'CIRCULAR_DEPENDENCY') return
                    },
                    output: {
                        chunkFileNames: 'assets/js/[name]-[hash].js',
                        entryFileNames: 'assets/js/[name]-[hash].js',
                        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                        manualChunks(id) {
                            if (id.includes('node_modules')) {
                                // 让每个插件都打包成独立的文件
                                return id.toString().split('node_modules/')[1]?.split('/')[0]?.toString()
                            }
                            return undefined
                        }
                    }
                }
            }
        }
    }
}

// https://vite.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig(configFactory(resolve(__dirname, 'dist')))
