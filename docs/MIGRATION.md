# 本地数据迁移与回滚

Web 端首次启动时会把现有 `localStorage` 条目复制到版本化 Dexie 数据库 `xero-qq-lite-local` 的 `legacy-localstorage` 命名空间。迁移是幂等的，源条目会保留，便于用户回滚；迁移标记为 `legacy-localstorage:migration-v1`。

设置加载会优先使用浏览器中的 `options` 条目。如果该条目已被清理但迁移副本存在，应用会从迁移副本恢复设置。之后的设置保存会同步更新 `settings` 命名空间。

扩展或诊断工具可以调用 `exportLocalDataJson()` 导出 JSON，或调用 `clearLocalData()` 清除 Dexie 数据。`importLocalData(JSON.parse(json), true)` 会先校验记录结构，再在单个事务中替换数据库内容；重复键只保留更新时间较新的记录。需要回滚时，导出后调用导入函数即可，应用不会自动删除原始 `localStorage` 数据。
