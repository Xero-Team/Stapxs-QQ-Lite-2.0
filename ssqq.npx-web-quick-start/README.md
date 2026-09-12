# Xero QQ Lite Web Quick Starter

一个兼容 OneBot 的非官方网页版 QQ 客户端，Web 端快速启动包。

```bash
npx ssqq-web hostname=0.0.0.0 port=8081
```
注意：工具默认离线启动，不会请求远程更新服务。需要自动更新时，请显式设置 `XERO_QQ_LITE_UPDATE_ENDPOINT` 指向兼容的 JSON release endpoint（响应需包含 `tag_name` 和 `assets`），并确保下载地址可信。启用后，Web 文件会解压到 npx 执行所在的目录。
