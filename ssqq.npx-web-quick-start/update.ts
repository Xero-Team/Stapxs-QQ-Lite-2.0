#!/usr/bin/env node

import semver from 'semver'
import Logger from 'log4js'
import unzipper from 'unzipper'
import fs from 'fs'
import { Readable } from 'stream'

// 日志配置
const logger = Logger.getLogger('update')
logger.level = 'info'


/** Check an explicitly configured release endpoint. No endpoint means offline mode. */
export async function checkUpdate(nowVersion: string, endpoint = process.env.XERO_QQ_LITE_UPDATE_ENDPOINT) {
    if (!endpoint) {
        logger.info('未配置更新地址，跳过远程更新检查')
        return
    }
    try {
        const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const json = await response.json() as { tag_name?: unknown; assets?: unknown }
        if (typeof json.tag_name !== 'string' || !Array.isArray(json.assets)) {
            throw new Error('更新响应格式无效')
        }
        const version = json.tag_name.replace(/^v/, '')
        logger.info(`Xero QQ Lite 当前版本: ${version}, 本地版本: ${nowVersion}`)
        if (semver.lt(nowVersion, version)) {
                // 本地版本小于线上版本, 需要更新
                logger.info('发现新版本, 正在更新...')
                logger.info(`运行路径: ${process.cwd()}`)
                // 下载新版本
                const assetList = json.assets as Array<{ name?: unknown; browser_download_url?: unknown }>
                for (const asset of assetList) {
                    const name = typeof asset.name === 'string' ? asset.name : ''
                    // 寻找结尾为 -web.zip 的文件
                    if (name.endsWith('-web.zip')) {
                        // 删除 dist 文件夹
                        if(fs.existsSync('./dist')) {
                            fs.rm('./dist', { recursive: true }, err => {
                                if (err) {
                                    logger.error(`删除 dist 文件夹失败: ${err}`)
                                }
                            }
                            )
                        }
                        const downloadUrl = typeof asset.browser_download_url === 'string' ? asset.browser_download_url : ''
                        if (!downloadUrl) return
                        logger.info('开始下载 Web 更新包')
                        // 下载文件并解压
                        const downloadResponse = await fetch(downloadUrl)
                        if (!downloadResponse.ok || !downloadResponse.body) throw new Error(`HTTP ${downloadResponse.status}`)
                        await new Promise<void>((resolve, reject) => {
                            Readable.fromWeb(downloadResponse.body as never)
                                .pipe(unzipper.Extract({ path: './' }))
                                .on('close', resolve)
                                .on('error', reject)
                        })
                        logger.info('更新完成')
                        await fs.promises.writeFile('./dist/package.json', JSON.stringify({ version }))
                    }
                }
        } else {
                logger.info('当前已是最新版本')
        }
    } catch (err) {
        logger.error(`检查更新失败: ${err instanceof Error ? err.message : String(err)}`)
    }
}
