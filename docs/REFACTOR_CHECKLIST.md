# Stapxs QQ Lite 重构清单

目标：把当前 fork 改造成独立、隐私优先、依赖现代、类型严格且可长期维护的 OneBot 客户端。所有阶段都必须保持 AGPL 合规，并以可回滚的小步提交完成。

## 0. 基线与治理

- [x] 建立 `refactor` 分支、变更日志和 ADR 目录；记录当前 Web/Electron/Tauri/Capacitor 构建基线。
- [ ] 安装 Node 22+、Corepack/Yarn，锁定包管理器和 CI 版本；生成依赖清单与许可证清单。
- [ ] 为 OneBot 11 消息、事件、API 建立兼容性样例集；覆盖常见 Bot（NapCat、Lagrange 等）。
- [ ] 增加 CI 门禁：格式、ESLint、TypeScript、依赖审计、Web 构建、Rust check、Playwright smoke。

## 1. 去上游化与品牌

- [ ] 全仓替换上游组织、仓库、Pages、release、issue、npm、作者和赞助链接；保留第三方依赖的真实归属。
- [ ] 重新设置 `package.json`、Capacitor/Tauri identifier、协议 scheme、应用名、图标、User-Agent 和默认 API 地址。
- [ ] 清理上游专属更新检查、贡献者/赞助者拉取、远程公告和默认外链；改为可配置或完全关闭。
- [ ] 编写独立隐私政策、第三方声明、迁移说明；核对 AGPL 与复制代码（如 DeltaChat user-notify）的许可义务。

## 2. 去遥测与隐私化

- [x] 删除 `@stapxs/umami-logger-typescript`、Umami 页面和所有统计上报代码；确认无隐式 beacon、指纹、崩溃上传。
- [ ] 默认禁止向第三方请求；将地图、音乐、链接预览、更新检查等外部服务做成显式可选开关。
- [x] 令牌使用系统密钥链或加密存储；禁止日志记录 token、完整 URL、聊天内容、用户 ID 和文件路径。
- [ ] 增加网络请求 allowlist/审计日志（仅在本地），提供“一键导出和清除本地数据”。
- [ ] 用 Playwright 验证首次启动、离线启动和关闭遥测后的网络请求均符合预期。

## 3. 破坏性技术栈升级

- [ ] 评估并升级 Vue、Vite、TypeScript、ESLint、Pinia、Electron、Tauri、Capacitor、Node 类型和所有插件到当时最新稳定版。
- [ ] 每次大版本升级单独提交，记录阻塞项（例如 TypeScript 与 vue-tsc/Vue 兼容性）和替代方案。
- [ ] 用维护中的库替换弃用或自研实现：Zod 做运行时校验，Dexie/idb 做 IndexedDB，标准 Web Crypto/系统 keychain 做密钥，成熟 Markdown/XSS 库做内容处理。
- [ ] 移除重复跨端实现，统一平台适配接口；明确主桌面运行时，其他运行时保持兼容。
- [ ] 升级 `ssqq.capacitor-onebot-connector` 和 npx 工具，消除 workspace 内部版本漂移和已知过时依赖（如 request）。

## 4. 规范化与类型安全

- [x] 迁移 ESLint flat config，启用 TypeScript strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes、useUnknownInCatchVariables。
- [ ] 将 `any` 降为零（第三方边界使用 `unknown` + Zod）；开启 no-explicit-any、no-floating-promises、consistent-type-imports 等规则。
- [ ] 拆分 `Chat.vue`、`App.vue`、`msg.ts`、`msgUtil.ts`、`appUtil.ts`；UI、状态、协议、传输、平台能力各自独立。
- [ ] 为 Pinia store 定义输入输出类型和状态迁移；统一错误模型、日志接口、异步取消和重试策略。
- [ ] 统一命名、文件大小上限、导入边界、注释语言和提交规范；删除调试日志与死代码。

## 5. 数据与协议层

- [x] 建立 OneBot schema 包：事件/API 请求响应使用 Zod；必要时评估 protobuf 仅用于明确的高吞吐内部通道，不改变 OneBot 公共 JSON 协议。
- [ ] 将 WebSocket、SSE、HTTP 抽象为同一 Transport；实现心跳、指数退避、取消、超时、鉴权和重连状态机。
- [ ] 用 Dexie/idb 迁移聊天历史、缓存和设置；设计版本化 schema、迁移、导出/清除和容量策略。
- [ ] 消息解析、CQ 码、媒体 URL、转发消息全部使用纯函数和兼容性测试。

## 6. 验证与发布

- [ ] 为连接、鉴权、消息解析、历史迁移编写单元/契约测试。
- [ ] Playwright 覆盖连接、收发消息、图片/文件、撤回/回复、设置迁移、离线和隐私开关。
- [ ] 在 Linux、Windows、macOS 至少验证 Web、主桌面端和一个移动端构建；记录体积、启动时间和内存回归。
- [ ] 完成 SBOM、许可证、依赖漏洞、CSP、签名和发布产物校验。
- [ ] 发布迁移工具和回滚说明；所有清单项完成后再删除旧实现。
