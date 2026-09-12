// Browser component regression: real Vue and native XML parser, synthetic network only.
async (page) => {
    const baseURL = page.url()
    const baseOrigin = await page.evaluate(() => location.origin)
    const context = await page.context().browser().newContext({ serviceWorkers: 'block' })
    try {
        const cardPage = await context.newPage()
        const external = []
        let pageErrors = 0
        cardPage.on('pageerror', () => { pageErrors++ })
        await context.route('**/*', async (route) => {
            if (route.request().url().startsWith(`${baseOrigin}/`)) return route.continue()
            external.push({ url: route.request().url(), referer: route.request().headers().referer })
            return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' })
        })
        await cardPage.goto(baseURL)
        const input = cardPage.getByRole('textbox', { name: 'XML', exact: true })
        const card = cardPage.locator('.msg-xml')
        const assert = (condition, label) => { if (!condition) throw new Error(label) }
        const normal = '<msg url="https://example.test/item?title=summary&amp;id=1"><item><title size="30">item title summary &amp; more</title><picture cover="https://images.test/card.png?synthetic=1"/><summary>Summary</summary></item></msg>'
        await input.fill(normal)
        await card.getByText('item title summary & more', { exact: true }).waitFor()
        assert(await card.locator('img').count() === 0, 'XML image mounted without opt-in')
        assert(external.length === 0, 'XML parsing caused a third-party request')
        assert(await card.locator('p').evaluate((node) => node.style.fontSize) === '1rem', 'Title layout lost')
        await card.press('Enter')
        assert(await cardPage.getByLabel('Opened URL').textContent() === 'https://example.test/item?title=summary&id=1', 'XML link text was corrupted')

        await cardPage.getByRole('checkbox', { name: 'External services' }).check()
        await cardPage.waitForFunction(() => {
            const image = document.querySelector('.msg-xml img')
            return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
        })
        assert(external.length === 1 && !external[0].referer, 'Image request count or referrer policy incorrect')
        const audit = await cardPage.evaluate(() => JSON.parse(localStorage.getItem('xero-qq-lite:network-audit') ?? '[]'))
        assert(audit.length === 1 && audit[0].origin === 'https://images.test' && !JSON.stringify(audit).includes('synthetic'), 'Image audit missing or contains query data')
        await cardPage.getByRole('checkbox', { name: 'External services' }).uncheck()
        assert(await card.locator('img').count() === 0, 'Image remained after opt-out')

        const attack = '<msg url="javascript:window.XML_EXECUTED=1"><item><title size="99999" onclick="window.XML_EXECUTED=1"><![CDATA[<img src=x onerror="window.XML_EXECUTED=1">]]></title><summary>Safe summary</summary><img src="https://images.test/raw.png" onerror="window.XML_EXECUTED=1"/><picture cover="data:image/svg+xml,evil"/><script>window.XML_EXECUTED=1</script><iframe src="https://images.test/frame"/></item></msg>'
        await input.fill(attack)
        await card.getByText('Safe summary', { exact: true }).waitFor()
        assert(await card.locator('img,script,iframe,[onclick],[onerror]').count() === 0, 'Attacker markup reached live DOM')
        assert(await card.locator('p').textContent() === '<img src=x onerror="window.XML_EXECUTED=1">', 'CDATA was not rendered as literal text')
        assert(await card.locator('p').evaluate((node) => node.style.fontSize) === '1.6rem', 'Title size is unbounded')
        assert(await card.getAttribute('role') === null, 'Unsafe link remained clickable')
        await card.click()
        assert(await cardPage.getByLabel('Opened URL').textContent() === 'https://example.test/item?title=summary&id=1', 'Old card link leaked into replacement')
        assert(await cardPage.evaluate(() => window.XML_EXECUTED === undefined), 'XML executed script')

        for (const invalid of [
            '<msg><item><title>broken</item></msg>',
            '<!DOCTYPE msg [<!ENTITY external SYSTEM "https://images.test/entity">]><msg><item><title>&external;</title></item></msg>',
            '<html><body>Wrong root</body></html>',
            'x'.repeat(256 * 1024 + 1),
        ]) {
            await input.fill(invalid)
            await card.getByText('Unsupported XML', { exact: true }).waitFor()
            assert(await card.getAttribute('role') === null, 'Invalid card retained link state')
        }
        await input.fill('<msg><item><title>Vote</title></item><source name="群投票"/></msg>')
        await card.getByText('Unsupported XML', { exact: true }).waitFor()
        await input.fill('<msg><item><title>No link</title><summary>Offline text</summary></item></msg>')
        await card.getByText('Offline text', { exact: true }).waitFor()
        await context.setOffline(true)
        await input.fill('<msg><item><title>Offline card</title></item></msg>')
        await card.getByText('Offline card', { exact: true }).waitFor()
        assert(external.length === 1 && pageErrors === 0, 'Unexpected request or browser error')
        await cardPage.screenshot({ path: 'output/playwright/xml-card.png' })
        return { passed: true, scenarios: ['normal', 'opt-in', 'opt-out', 'injection', 'invalid-xml', 'entity', 'size-limit', 'unsupported', 'offline'], externalRequests: external.length }
    } finally {
        await context.close()
    }
}
