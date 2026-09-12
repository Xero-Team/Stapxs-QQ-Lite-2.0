import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import * as viteConfig from './vite.config.ts'

export default defineConfig({
    main: {
        plugins: [
            externalizeDepsPlugin(),
            viteStaticCopy({
                targets: [
                    { src: 'src/electron/assets', dest: './' },
                ]
            })
        ],
        build: {
            lib: {
                entry: 'src/electron/index.ts',
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
    },
    // electron-vite 5 merges renderer config eagerly and no longer accepts a
    // callback here. Keep the shared Vite factory while resolving its build
    // environment explicitly for the renderer bundle.
    renderer: viteConfig.configFactory('out/renderer')({
        command: 'build',
        mode: process.env.NODE_ENV ?? 'production',
        ssrBuild: false,
    }),
})
