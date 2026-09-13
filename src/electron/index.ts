import path from 'path'
import Store from 'electron-store'
import fs from 'fs'
import log4js from 'log4js'

import windowStateKeeper from 'electron-window-state'
import packageInfo from '../../package.json' with { type: 'json' }

import { regIpcListener } from './function/ipc.ts'
import { Menu, session, app, protocol, BrowserWindow, Tray, nativeImage, screen, type BrowserWindowConstructorOptions } from 'electron'
import { computeDefaultWindowSize, isLegacyDefaultWindowSize, minWindowSize, resolveWindowBounds, type RestoredWindowBounds } from './function/windowBounds.ts'
import { touchBar } from './function/touchbar.ts'
import { join } from 'path'
import trayIconPath from './assets/tray@2x.png?asset&asarUnpack'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isPrimary = app.requestSingleInstanceLock()
const logger = log4js.getLogger('background')
export let logLevel = isDevelopment ? 'debug' : 'info'

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

export let win = undefined as BrowserWindow | undefined
export let touchBarInstance = undefined as touchBar | undefined
const isDev = import.meta.env.DEV

async function createWindow() {
    const store = new Store()
    const storedGlass = store.get('glass_effect')
    const glassEffect = storedGlass === true || storedGlass === 'true'
    if (store.get('opt_log_level')) {
        logLevel = (store.get('opt_log_level') ?? 'info') as string
    }
    logger.level = logLevel

    /* eslint-disable no-console */
    console.log('')
    console.log(' _____ _____ _____ _____ __ __  \n' +
        '|   __|_   _|  _  |  _  |  |  | \n' +
        '|__   | | | |     |   __|-   -| \n' +
        '|_____| |_| |__|__|__|  |__|__| CopyRight © Xero-Team')
    console.log('=======================================================')
    console.log('日志等级:', logLevel)
    /* eslint-enable no-console */
    logger.info('欢迎使用 Xero QQ Lite, 当前版本: ' + packageInfo.version)

    logger.info('启动平台架构：' + process.platform)
    logger.info('正在创建窗体 ……')
    Menu.setApplicationMenu(null)
    const cursorDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    const defaultSize = computeDefaultWindowSize(cursorDisplay.workArea)
    const mainWindowState = windowStateKeeper({
        defaultWidth: defaultSize.width,
        defaultHeight: defaultSize.height,
    })
    const restoredBounds: RestoredWindowBounds = {
        width: mainWindowState.width,
        height: mainWindowState.height,
    }
    if (Number.isInteger(mainWindowState.x)) restoredBounds.x = mainWindowState.x
    if (Number.isInteger(mainWindowState.y)) restoredBounds.y = mainWindowState.y
    const restoredX = restoredBounds.x
    const restoredY = restoredBounds.y
    const workArea = (!isLegacyDefaultWindowSize(restoredBounds)
        && restoredX !== undefined
        && restoredY !== undefined)
        ? screen.getDisplayMatching({
            x: restoredX,
            y: restoredY,
            width: restoredBounds.width,
            height: restoredBounds.height,
        }).workArea
        : cursorDisplay.workArea
    const windowBounds = resolveWindowBounds(restoredBounds, workArea)
    const minSize = minWindowSize(workArea)
    logger.info(`窗口尺寸: ${windowBounds.width}x${windowBounds.height}`)
    let windowConfig = {
        x: windowBounds.x,
        y: windowBounds.y,
        width: windowBounds.width,
        height: windowBounds.height,
        minWidth: minSize.width,
        minHeight: minSize.height,
        icon: path.join(__dirname, '/public/img/icons/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
        },
        maximizable: true,
        fullscreen: false
    } as BrowserWindowConstructorOptions
    if (process.platform === 'darwin') {
        // macOS
        windowConfig = {
            ...windowConfig,
            titleBarStyle: 'hidden',
            trafficLightPosition: { x: 11, y: 10 },
            transparent: true,
        }
        if (!glassEffect) {
            windowConfig = {
                ...windowConfig,
                vibrancy: 'fullscreen-ui',
                visualEffectState: 'followWindow'
            }
        }
    } else if (process.platform === 'win32') {
        // Windows
        windowConfig = {
            ...windowConfig,
            backgroundColor: '#00000000',
            backgroundMaterial: 'acrylic',
            frame: false
        }
    } else if (process.platform === 'linux') {
        // Linux
        windowConfig = {
            ...windowConfig,
            transparent: true,
            frame: false
        }
    }
    win = new BrowserWindow(windowConfig)
    // Identify the client without including account data or connection tokens.
    win.webContents.setUserAgent(`${win.webContents.getUserAgent()} XeroQQLite/${packageInfo.version}`)
    win.once('focus', () => { if (win) win.flashFrame(false) })
    mainWindowState.manage(win)     // 窗口状态管理器
    logger.info('创建窗体完成')
    // 注册 IPC 事务
    regIpcListener()
    // macOS：创建 TouchBar
    touchBarInstance = new touchBar(win)
    // 加载应用
    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        // 打开开发者工具
        win.webContents.openDevTools()
    } else {
        win.loadURL('app://./index.html')
    }

    if (glassEffect && process.platform === 'darwin') {
        win.webContents.once('did-finish-load', () => {
            if (!win) return
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const liquidGlass = require('electron-liquid-glass') as {
                    addView: (handle: Buffer, options: { cornerRadius: number; tinitCOlor: string }) => number
                    unstable_setVariant: (viewId: number, variant: number) => void
                }
                const viewId = liquidGlass.addView(win.getNativeWindowHandle(), {
                    cornerRadius: 24,
                    tinitCOlor: '#00000000'
                })
                win.setWindowButtonVisibility(true)
                liquidGlass.unstable_setVariant(viewId, 9)
                win.webContents.send('sys:liquidGlassReady', {})
                logger.info('liquidGlass 装载成功:', viewId)
            } catch (err) {
                logger.error('liquidGlass 装载失败:', err)
            }
        })
    }

    win.on('close', (e) => {
        e.preventDefault()
        win?.hide()
    })

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        if (details.responseHeaders) {
            const imageAddress = [
                'https://gchat.qpic.cn/gchatpic_new',
                'https://multimedia.nt.qq.com.cn/download'
            ]
            const ignoreAddress = [
                'devtools://',
                'chrome-extension://',
                'https://registry.npmjs.org',
                // 本地开发地址
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:8081',
                'http://127.0.0.1:8081'
            ]
            if (imageAddress.some((address) =>
                details.url.startsWith(address))) {
                // 不缓存图片
                details.responseHeaders['cache-control'] = ['max-age=300']
                const contentType = details.responseHeaders['content-type']
                if (contentType && contentType[0]) {
                    const typeName = contentType[0].split('/')[1]
                    // 添加文件名方便下载
                    details.responseHeaders['content-disposition'] = ['inline; filename="image.' + typeName + '"']
                }
            } else if (!ignoreAddress.some((address) =>
                details.url.startsWith(address)) && details.url.includes('qlogo.cn')) {
                // QQ 头像 URL 默认有 2592000（30 天）的缓存时间，这里修改为 3 天。
                // 保留远程站点提供的 CSP 和 X-Frame-Options。
                details.responseHeaders['cache-control'] = ['max-age=259200']
            }
        }
        callback(details.responseHeaders
            ? { cancel: false, responseHeaders: details.responseHeaders }
            : { cancel: false })
    })
}

app.on('open-url', (_, url) => {
    sendUrlToWindow(url)
})
app.on('second-instance', (_, cmd, workingDirectory) => {
    sendUrlToWindow(workingDirectory, cmd)
})

app.on('window-all-closed', () => {
    if (process.platform === 'win32') {
        app.removeAsDefaultProtocolClient('xero-qq-lite')   // 取消默认协议
    }
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('ready', async () => {
    // 单例模式
    if (!isPrimary) {
        app.quit()
        return
    }
    if (process.platform === 'win32') {
        app.setAppUserModelId('team.xero.qqlite')           // 设置应用 ID
        app.setAsDefaultProtocolClient('xero-qq-lite')      // 设置为默认协议
    }
    // 注册 customFileProtocol 到 app 协议
    protocol.handle('app', async (request) => {
        const rendererRoot = path.resolve(__dirname, '..', 'renderer')
        let filePath: string
        try {
            const requestUrl = new URL(request.url)
            const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '')
            filePath = path.resolve(rendererRoot, relativePath)
        } catch {
            return new Response('Invalid app resource', { status: 400 })
        }
        if (filePath !== rendererRoot && !filePath.startsWith(rendererRoot + path.sep)) {
            return new Response('Forbidden', { status: 403 })
        }

        // 确认文件存在并返回内容
        try {
            const fileContent = await fs.promises.readFile(filePath)
            return new Response(fileContent, {
                headers: { 'Content-Type': getMimeType(filePath) },
            });
        } catch (err) {
            logger.error('Failed to load app resource', err)
            return new Response('File not found', { status: 404 });
        }
    })
    // 创建托盘
    if (process.platform !== 'darwin') {
        try {
            const icon = nativeImage.createFromPath(trayIconPath)
            if (icon.isEmpty()) {
                logger.warn('托盘图标为空，跳过创建托盘')
            } else {
                const tray = new Tray(icon)
                tray.setContextMenu(Menu.buildFromTemplate([
                    { label: '显示窗口', click: () => win?.show() },
                    { label: '退出', type: 'normal', click: () => { app.quit() } }
                ]))
                tray.on('click', () => {
                    win?.show()
                })
            }
        } catch (err) {
            logger.error('创建托盘失败', err)
        }
    }
    // 创建窗口
    createWindow()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
    if (win) {
        win.show()
    }
})

app.on('before-quit', () => {
    logger.info('正在退出程序 ……')
    if (win) {
        win.destroy()
    }
})

// ================================

function sendUrlToWindow(url: string, args: string[] = []) {
    win?.webContents.send('sys:handleUri', {
        url: url,
        args: args
    })
}

if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}
