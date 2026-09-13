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
                const requestPayloads = []
                let externalRequests = 0
                let unexpectedRequests = 0
                let pageErrors = 0
                const pageErrorMessages = []
                smokePage.on('pageerror', (error) => {
                    pageErrors++
                    pageErrorMessages.push(String(error))
                })
                await context.route('**/*', (route) => {
                    const url = route.request().url()
                    if (url === `${baseOrigin}/received.txt`) {
                        return route.fulfill({ status: 200, contentType: 'text/plain', body: 'received file' })
                    }
                    if (url.startsWith(`${baseOrigin}/`)) {
                        return route.continue()
                    }
                    if (/^https:\/\/(q\d+\.qlogo\.cn|p\.qlogo\.cn)\//.test(url)) {
                        return route.fulfill({
                            status: 200,
                            contentType: 'image/png',
                            body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
                        })
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
                    get_friend_msg_history: { messages: [] },
                    get_group_msg_history: { messages: [] },
                    send_private_msg: { message_id: 'mock-send-1' },
                    get_msg: { message_id: 'mock-send-1', user_id: 10001, message: [{ type: 'text', data: { text: 'hello from Playwright' } }] },
                    get_group_file_url: { url: `${baseOrigin}/received.txt` },
                    get_private_file_url: { url: `${baseOrigin}/received.txt` },
                    delete_msg: null,
                    fetch_custom_face: [],
                    ...(backend === 'NapCat.Onebot' ? { get_recent_contact: [] } : {}),
                }
                const initializationActions = Object.keys(responses).filter((action) => ![
                    'send_private_msg', 'get_msg', 'delete_msg', 'fetch_custom_face',
                    'get_group_file_url', 'get_private_file_url',
                    'get_friend_msg_history', 'get_group_msg_history',
                ].includes(action))
                let activeSocket
                let socketCount = 0
                // Intercept every socket, so the smoke can never contact a real bot.
                await smokePage.routeWebSocket('**/*', (socket) => {
                    activeSocket = socket
                    socketCount++
                    if (!socket.url().startsWith('ws://127.0.0.1:30991/')) {
                        unexpectedRequests++
                        socket.close()
                        return
                    }
                    socket.onMessage((message) => {
                        const request = JSON.parse(String(message))
                        requests.push(request.action)
                        requestPayloads.push(request)
                        const known = Object.hasOwn(responses, request.action)
                        if (!known && request.action) unexpectedRequests++
                        socket.send(JSON.stringify({
                            status: known ? 'ok' : 'failed',
                            retcode: known ? 0 : 1404,
                            data: known ? responses[request.action] : null,
                            echo: request.echo,
                        }))
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
                // The route callback runs in the Playwright driver while the
                // page continues rendering. Poll the driver-side request log
                // instead of coupling the assertion to a one-shot resolver;
                // this also handles a reconnect that opens a second socket.
                for (let attempt = 0; attempt < 100; attempt++) {
                    if (initializationActions.every((action) => requests.includes(action))) break
                    await smokePage.waitForTimeout(100)
                }
                if (!initializationActions.every((action) => requests.includes(action))) {
                    const missing = initializationActions.filter((action) => !requests.includes(action))
                    throw new Error(`${scenario}: post-login initialization timed out (requests=${requests.join(',')}; missing=${missing.join(',')})`)
                }

                // Exercise the browser transport with one real UI send and one
                // server-pushed OneBot message. Keep the login matrix fast by
                // running this extended flow only once.
                let messageFlow = { sent: false, received: false }
                if (backend === 'Lagrange.OneBot' && accountId === 10001) {
                    await smokePage.locator('#bar-friends').click()
                    const friend = smokePage.locator('#user-20002')
                    await smokePage.locator('#friendTab').waitFor({ state: 'visible' })
                    await friend.waitFor({ state: 'attached' })
                    // Contact groups are collapsed by default. Expand the
                    // containing group before clicking the row so the event
                    // is delivered through Vue's component listener.
                    if (!(await friend.isVisible())) {
                        const headers = smokePage.locator('#friendTab .exp-header')
                        for (let index = 0; index < await headers.count(); index++) {
                            const header = headers.nth(index)
                            if (!(await header.isVisible())) continue
                            await header.click()
                            if (await friend.isVisible()) break
                        }
                    }
                    await friend.waitFor({ state: 'visible' })
                    await friend.click()
                    await smokePage.locator('#bar-msg').click()
                    const input = smokePage.locator('#main-input, #main-input-ex').first()
                    await input.waitFor()
                    await input.fill('hello from Playwright')
                    await input.press('Enter')
                    await smokePage.waitForFunction(() =>
                        document.body.textContent?.includes('hello from Playwright') === true)
                    messageFlow.sent = requests.includes('send_private_msg')
                    activeSocket?.send(JSON.stringify({
                        post_type: 'message',
                        message_type: 'private',
                        sub_type: 'friend',
                        time: Math.floor(Date.now() / 1000),
                        self_id: 10001,
                        user_id: 20002,
                        sender: { user_id: 20002, nickname: 'Mock Friend' },
                        message_id: 30003001,
                        message: [{ type: 'text', data: { text: 'hello from OneBot' } }],
                        raw_message: 'hello from OneBot',
                    }))
                    await smokePage.getByText('hello from OneBot', { exact: true }).first().waitFor()
                    messageFlow.received = true

                    // Receive media from the server and exercise the file
                    // download path through the same mocked OneBot socket.
                    activeSocket?.send(JSON.stringify({
                        post_type: 'message',
                        message_type: 'private',
                        sub_type: 'friend',
                        time: Math.floor(Date.now() / 1000),
                        self_id: 10001,
                        user_id: 20002,
                        sender: { user_id: 20002, nickname: 'Mock Friend' },
                        message_id: 30003002,
                        message: [
                            { type: 'image', data: { url: 'data:image/png;base64,iVBORw0KGgo=', file: 'received.png' } },
                            { type: 'file', data: { file: 'received.txt', name: 'received.txt', file_id: 'received-file', size: 14 } },
                        ],
                        raw_message: '[图片][文件: received.txt]',
                    }))
                    const receivedFile = smokePage.locator('.msg-file').filter({ hasText: 'received.txt' }).first()
                    await receivedFile.waitFor({ state: 'visible' })
                    messageFlow.mediaReceived = await receivedFile.isVisible()
                    await receivedFile.locator('svg').last().click()
                    for (let attempt = 0; attempt < 100; attempt++) {
                        if (requests.includes('get_private_file_url') || requests.includes('get_group_file_url')) break
                        await smokePage.waitForTimeout(100)
                    }
                    messageFlow.mediaDownloaded = requests.includes('get_private_file_url') || requests.includes('get_group_file_url')

                    // Reply is selected from the rendered incoming message.
                    // Run it before later messages can replace the current
                    // transition-group entry during the synthetic flow.
                    const incomingMessage = smokePage.getByText('hello from OneBot', { exact: true })
                        .locator('xpath=ancestor::div[contains(@class, "message")]').first()
                    await incomingMessage.click({ button: 'right' })
                    const menu = smokePage.locator('#msgMenu')
                    await menu.getByText('回复', { exact: true }).click()
                    await smokePage.locator('.replay-tag.show').waitFor({ state: 'visible' })
                    await input.fill('reply from Playwright')
                    await input.press('Enter')
                    for (let attempt = 0; attempt < 100; attempt++) {
                        const replySent = requestPayloads.some((request) =>
                            request.action === 'send_private_msg'
                            && Array.isArray(request.params?.message)
                            && request.params.message.some((segment) => segment?.type === 'reply'
                                && String(segment?.data?.id) === '30003001'))
                        if (replySent) break
                        await smokePage.waitForTimeout(100)
                    }
                    messageFlow.replySent = requestPayloads.some((request) =>
                        request.action === 'send_private_msg'
                        && Array.isArray(request.params?.message)
                        && request.params.message.some((segment) => segment?.type === 'reply'
                            && String(segment?.data?.id) === '30003001'))

                    // Exercise the actual file input and ensure the outgoing
                    // OneBot payload contains an image segment. A tiny PNG
                    // keeps this smoke deterministic and avoids network I/O.
                    await smokePage.locator('#choice-pic').evaluate((input) => {
                        const file = new File([new Uint8Array([
                            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13,
                            73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 4,
                            0, 0, 0, 181, 28, 12, 2, 0, 0, 0, 11, 73, 68,
                            65, 84, 120, 218, 99, 100, 248, 15, 0, 1, 5, 1,
                            1, 39, 24, 227, 102, 0, 0, 0, 0, 73, 69, 78, 68,
                            174, 66, 96, 130,
                        ])], 'pixel.png', { type: 'image/png' })
                        const transfer = new DataTransfer()
                        transfer.items.add(file)
                        input.files = transfer.files
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                    })
                    await smokePage.locator('.img-pan img').waitFor({ state: 'visible' })
                    await input.press('Enter')
                    for (let attempt = 0; attempt < 100; attempt++) {
                        const imageSent = requestPayloads.some((request) =>
                            request.action === 'send_private_msg'
                            && Array.isArray(request.params?.message)
                            && request.params.message.some((segment) => segment?.type === 'image'))
                        if (imageSent) break
                        await smokePage.waitForTimeout(100)
                    }
                    messageFlow.imageSent = requestPayloads.some((request) =>
                        request.action === 'send_private_msg'
                        && Array.isArray(request.params?.message)
                        && request.params.message.some((segment) => segment?.type === 'image'))

                    // The file path uses the same transport but exercises the
                    // upload queue and FileReader conversion first.
                    await smokePage.locator('#choice-file').evaluate((input) => {
                        const file = new File(['file smoke payload'], 'smoke.txt', { type: 'text/plain' })
                        const transfer = new DataTransfer()
                        transfer.items.add(file)
                        input.files = transfer.files
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                    })
                    for (let attempt = 0; attempt < 100; attempt++) {
                        const fileSent = requestPayloads.some((request) =>
                            request.action === 'send_private_msg'
                            && Array.isArray(request.params?.message)
                            && request.params.message.some((segment) => segment?.type === 'file'))
                        if (fileSent) break
                        await smokePage.waitForTimeout(100)
                    }
                    messageFlow.fileSent = requestPayloads.some((request) =>
                        request.action === 'send_private_msg'
                        && Array.isArray(request.params?.message)
                        && request.params.message.some((segment) => segment?.type === 'file'))

                    // Confirm the pre-send item with a normal OneBot event
                    // before exercising the self-message recall action.
                    activeSocket?.send(JSON.stringify({
                        post_type: 'message_sent',
                        message_type: 'private',
                        sub_type: 'friend',
                        time: Math.floor(Date.now() / 1000),
                        self_id: 10001,
                        user_id: 10001,
                        target_id: 20002,
                        message_id: 10001001,
                        sender: { user_id: 10001, nickname: 'Mock Login' },
                        message: [{ type: 'text', data: { text: 'confirmed OneBot send' } }],
                        raw_message: 'confirmed OneBot send',
                    }))

                    // Recall is only enabled after the fake pre-send message
                    // is confirmed by the synthetic OneBot event above.
                    const sentMessage = smokePage.locator('.message.me:not(.revoke)').first()
                    await sentMessage.waitFor({ state: 'visible' })
                    await sentMessage.click({ button: 'right' })
                    await menu.getByText('撤回', { exact: true }).click()
                    for (let attempt = 0; attempt < 100; attempt++) {
                        if (requests.includes('delete_msg')) break
                        await smokePage.waitForTimeout(100)
                    }
                    messageFlow.recalled = requests.includes('delete_msg')

                    // Drop the established socket and verify the shared
                    // reconnecting transport opens a fresh connection and
                    // repeats the OneBot initialization handshake.
                    const socketsBeforeDrop = socketCount
                    activeSocket?.close()
                    for (let attempt = 0; attempt < 150; attempt++) {
                        if (socketCount > socketsBeforeDrop && requests.filter((action) => action === 'get_version_info').length > 1) break
                        await smokePage.waitForTimeout(100)
                    }
                    messageFlow.reconnected = socketCount > socketsBeforeDrop
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
                    requests,
                    pageErrorMessages,
                    sendPayloads: requestPayloads.filter((request) => request.action === 'send_private_msg').map((request) => request.params?.message),
                    pageErrors,
                    messageFlow,
                }
                if (!checks.historyIsNormalized || !checks.externalServicesDisabled
                    || externalRequests !== 0 || unexpectedRequests !== 0 || pageErrors !== 0
                    || (backend === 'Lagrange.OneBot' && accountId === 10001
                        && (!messageFlow.sent || !messageFlow.received
                            || !messageFlow.imageSent || !messageFlow.fileSent
                            || !messageFlow.replySent || !messageFlow.recalled
                            || !messageFlow.mediaReceived || !messageFlow.mediaDownloaded
                            || !messageFlow.reconnected))) {
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
