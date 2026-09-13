// Executed by playwright-cli run-code; the WebSocket endpoint is synthetic.
async (page) => {
    const baseURL = page.url()
    const baseOrigin = await page.evaluate(() => location.origin)
    const context = await page.context().browser().newContext({
        locale: 'zh-CN',
        serviceWorkers: 'block',
    })
    try {
        const smokePage = await context.newPage()
        smokePage.setDefaultTimeout(10_000)
        let externalRequests = 0
        let pageErrors = 0
        let socketCount = 0

        smokePage.on('pageerror', () => { pageErrors++ })
        await context.route('**/*', (route) => {
            if (route.request().url().startsWith(`${baseOrigin}/`)) return route.continue()
            externalRequests++
            return route.abort()
        })
        await smokePage.routeWebSocket('**/*', (socket) => {
            socketCount++
            if (!socket.url().startsWith('ws://127.0.0.1:30992/')) {
                socket.close()
                return
            }
            // Close the first authenticated socket with a protocol-level
            // rejection. Leave the retry socket open so the UI can settle.
            if (socketCount === 1) {
                socket.onMessage(() => socket.close(4003, 'authentication failed'))
            }
        })

        await smokePage.goto(baseURL)
        const next = smokePage.getByRole('button', { name: '继续', exact: true })
        const close = smokePage.getByRole('button', { name: '关闭', exact: true })
        for (let step = 0; step < 12; step++) {
            await next.or(close).waitFor()
            if (await close.isVisible()) {
                await close.click()
                break
            }
            await next.click()
        }

        await smokePage.getByPlaceholder('连接地址', { exact: true }).fill('127.0.0.1:30992')
        await smokePage.getByRole('button', { name: '连接', exact: true }).click()
        await smokePage.getByText('连接失败', { exact: false }).first().waitFor({ state: 'visible' })
        const connectButton = smokePage.getByRole('button', { name: '连接', exact: true })
        const result = {
            notificationVisible: await smokePage.locator('.app-msg').getByText('连接失败', { exact: false }).count() > 0,
            loginFormVisible: await smokePage.getByPlaceholder('连接地址', { exact: true }).isVisible(),
            connectButtonEnabled: await connectButton.isEnabled(),
            socketCount,
            externalRequests,
            pageErrors,
        }
        if (!result.notificationVisible || !result.loginFormVisible || !result.connectButtonEnabled
            || result.externalRequests !== 0 || result.pageErrors !== 0) {
            throw new Error(`Authentication failure UI smoke failed (${JSON.stringify(result)})`)
        }
        return { passed: true, ...result }
    } finally {
        await context.close()
    }
}
