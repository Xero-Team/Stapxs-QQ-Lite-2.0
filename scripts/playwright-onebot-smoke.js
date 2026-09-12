// Executed by playwright-cli run-code; all accounts and responses are synthetic.
async (page) => {
    const baseURL = page.url()
    const baseOrigin = await page.evaluate(() => location.origin)
    const results = []

    for (const backend of ['Lagrange.OneBot', 'NapCat.Onebot']) {
        for (const accountId of [10001, '10001']) {
            const scenario = `${backend}/${typeof accountId}`
            const context = await page.context().browser().newContext({
                locale: 'zh-CN',
                serviceWorkers: 'block',
            })
            try {
                const smokePage = await context.newPage()
                smokePage.setDefaultTimeout(10000)
                const requests = []
                let externalRequests = 0
                let unexpectedRequests = 0
                let pageErrors = 0
                smokePage.on('pageerror', () => { pageErrors++ })
                await context.route('**/*', (route) => {
                    if (route.request().url().startsWith(`${baseOrigin}/`)) {
                        return route.continue()
                    }
                    externalRequests++
                    return route.abort()
                })

                const friendAction = backend === 'NapCat.Onebot'
                    ? 'get_friends_with_category' : 'get_friend_list'
                const responses = {
                    get_version_info: { app_name: backend, app_version: '1.0.0' },
                    get_login_info: { user_id: accountId, nickname: 'Mock Login' },
                    [friendAction]: [{ user_id: 20002, nickname: 'Mock Friend', remark: 'Mock Friend' }],
                    get_group_list: [],
                    get_cookies: { cookies: '' },
                    send_msg: { message_id: 'mock-send-1' },
                    ...(backend === 'NapCat.Onebot' ? { get_recent_contact: [] } : {}),
                }
                const initializationActions = Object.keys(responses).filter((action) => action !== 'send_msg')
                let initialized
                let activeSocket
                const initialization = new Promise((resolve) => { initialized = resolve })
                // Intercept every socket, so the smoke can never contact a real bot.
                await smokePage.routeWebSocket('**/*', (socket) => {
                    activeSocket = socket
                    if (!socket.url().startsWith('ws://127.0.0.1:30991/')) {
                        unexpectedRequests++
                        socket.close()
                        return
                    }
                    socket.onMessage((message) => {
                        const request = JSON.parse(String(message))
                        requests.push(request.action)
                        const known = Object.hasOwn(responses, request.action)
                        if (!known) unexpectedRequests++
                        socket.send(JSON.stringify({
                            status: known ? 'ok' : 'failed',
                            retcode: known ? 0 : 1404,
                            data: known ? responses[request.action] : null,
                            echo: request.echo,
                        }))
                        if (initializationActions.every((action) => requests.includes(action))) {
                            initialized()
                        }
                    })
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
                await smokePage.getByPlaceholder('连接地址', { exact: true }).fill('127.0.0.1:30991')
                await smokePage.getByRole('button', { name: '连接', exact: true }).click()
                await smokePage.waitForFunction(() => document.title === 'Mock Login - Xero QQ Lite')
                await smokePage.getByText('选择联系人开始聊天', { exact: true }).waitFor()
                await Promise.race([
                    initialization,
                    smokePage.waitForTimeout(10000).then(() => {
                        throw new Error(`${scenario}: post-login initialization timed out`)
                    }),
                ])

                // Exercise the browser transport with one real UI send and one
                // server-pushed OneBot message. Keep the login matrix fast by
                // running this extended flow only once.
                let messageFlow = { sent: false, received: false }
                if (backend === 'Lagrange.OneBot' && accountId === 10001) {
                    await smokePage.locator('#bar-friends').click()
                    const friend = smokePage.locator('#user-20002:visible')
                    await smokePage.locator('#friendTab').waitFor({ state: 'visible' })
                    await friend.waitFor({ state: 'attached' })
                    await friend.click({ force: true })
                    const input = smokePage.locator('#main-input')
                    await input.waitFor()
                    await input.fill('hello from Playwright')
                    await input.press('Enter')
                    await smokePage.waitForFunction(() =>
                        document.body.textContent?.includes('hello from Playwright') === true)
                    messageFlow.sent = requests.includes('send_msg')
                    activeSocket?.send(JSON.stringify({
                        post_type: 'message',
                        message_type: 'private',
                        sub_type: 'friend',
                        time: Math.floor(Date.now() / 1000),
                        self_id: 10001,
                        user_id: 30003,
                        message_id: 'mock-incoming-1',
                        message: [{ type: 'text', data: { text: 'hello from OneBot' } }],
                        raw_message: 'hello from OneBot',
                    }))
                    await smokePage.getByText('hello from OneBot', { exact: true }).waitFor()
                    messageFlow.received = true
                }

                // Validate the persisted account type through the public settings format.
                const historyIsNormalized = await smokePage.evaluate(() => {
                    const options = localStorage.getItem('options') ?? ''
                    const entry = options.split('&').find((item) => item.startsWith('connection_history:'))
                    const history = JSON.parse(decodeURIComponent(entry?.slice('connection_history:'.length) ?? '[]'))
                    return history.length === 1 && history[0].uin === '10001'
                        && history[0].nickname === 'Mock Login' && history[0].token === ''
                })
                await smokePage.locator('#side-bar li').filter({ hasText: '设置' }).click()
                const externalServices = smokePage.locator('input[name=enable_external_services]')
                await externalServices.waitFor({ state: 'attached' })
                const checks = {
                    historyIsNormalized,
                    externalServicesDisabled: !(await externalServices.isChecked()),
                    externalRequests,
                    unexpectedRequests,
                    pageErrors,
                    messageFlow,
                }
                if (!checks.historyIsNormalized || !checks.externalServicesDisabled
                    || externalRequests !== 0 || unexpectedRequests !== 0 || pageErrors !== 0
                    || (backend === 'Lagrange.OneBot' && accountId === 10001
                        && (!messageFlow.sent || !messageFlow.received))) {
                    throw new Error(`${scenario}: login smoke failed (${JSON.stringify(checks)})`)
                }
                results.push({ backend, accountType: typeof accountId, loggedIn: true })
            } finally {
                await context.close()
            }
        }
    }
    return { passed: true, scenarios: results }
}
