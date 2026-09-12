# 新对话 `/goal` 指令

复制下面整段到新对话：

```text
/goal 完整实施仓库中的 docs/REFACTOR_CHECKLIST.md。你必须先读取该清单、项目内 .codex/skills/stapxs-qq-lite-maintenance、playwright、security-best-practices，以及仓库现有配置和文档；然后按阶段实际修改代码，不要只给计划。

硬性方向：
1. 去上游化：这是 Xero-Team 的独立 fork，移除上游组织、链接、品牌、遥测服务、更新/贡献者/赞助外链和默认远程服务；保留第三方依赖归属与 AGPL/其他许可证义务。
2. 去遥测、隐私优先：删除 Umami 和所有统计上报；默认离线可用，外部服务显式开关；敏感数据不进日志。
3. 破坏性升级：把 Node/Yarn、Vue、Vite、TypeScript、ESLint、Pinia、Electron、Tauri、Capacitor 及插件升级到最新稳定兼容版本；无法升级时记录明确阻塞原因。
4. 严格规范：ESLint flat config、TypeScript strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes，消除 any，建立统一错误和日志模型。
5. 优先采用成熟方案：Zod 做运行时 schema，Dexie/idb 做 IndexedDB，Web Crypto/系统 keychain 做密钥；不要手写已有工业级能力。

执行要求：
- 先建立可运行基线和 ADR，再逐阶段提交；每阶段都运行相关检查并修复，而不是最后集中报错。
- 保持 OneBot 11 公共协议兼容，先建立 NapCat/Lagrange 等样例和契约测试。
- 拆分 Chat.vue、App.vue、msg.ts、msgUtil.ts、appUtil.ts；隔离 UI、状态、传输、协议和平台适配。
- 统一 WebSocket/SSE/HTTP Transport，加入超时、取消、心跳、指数退避和鉴权状态机。
- 为现有 localStorage/SQLite/缓存设计 Dexie/idb 版本迁移、导出和清除；不得丢失用户数据。
- 使用 Playwright 覆盖首次启动、连接、收发消息、媒体、历史迁移、离线和隐私开关；涉及令牌、IPC、外链时运行安全审查。
- 同步更新 README、README_EN、隐私政策、第三方声明、构建和发布工作流。
- 必须实际编辑仓库文件并运行可用的验证命令。若环境缺少工具，先安装或明确记录阻塞；绝不声称未运行的检查已通过。
- 遇到无法安全自动迁移的行为，保留兼容迁移路径并在 docs/ 中记录；只有清单全部完成且验证通过后才宣布 goal complete。
``` 
