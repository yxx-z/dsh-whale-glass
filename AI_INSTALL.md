# AI 安装指南

本文用于帮助 AI 助手正确安装本插件。它不是权限授予：以用户指令和宿主实际授权为准。

## 已知事实

- 包名：`dsh-whale-glass`，版本：`1.0.1`，bundle 内部 entry id：`whale-glass`。
- 仓库：<https://github.com/yxx-z/dsh-whale-glass>。
- 固定版本安装包：<https://github.com/yxx-z/dsh-whale-glass/releases/download/v1.0.1/dsh-whale-glass-1.0.1.tgz>。
- 版本对应的校验文件：<https://github.com/yxx-z/dsh-whale-glass/releases/download/v1.0.1/SHA256SUMS.txt>。
- 已验证：macOS，DeepSeek Harness Desktop `0.2.1-rc.3`。不要声称兼容所有版本。
- 零第三方运行依赖，没有安装脚本，没有构建步骤。不要额外安装全局 npm 包。
- 本仓库没有发布到 npm registry。`npm install dsh-whale-glass` 不是本文的安装方法。

## 1. 识别环境与现状

1. 确认运行 Harness 的电脑、当前 profile 和应用版本。插件管理会影响该 profile 中所有会话。
2. 找到 Harness 原生工具 `plugin_manager` 并读取**当前运行时 schema**。以下 JSON 根据 rc.3 接口编写，运行时 schema 优先。
3. 调用 `list_bundles`，按 `nextOffset` 分页至完成，检查是否已安装目标包及启用状态：

```json
{"action":"list_bundles","offset":0,"limit":100}
```

需要检查插件 entry 时用 `list_plugins`，不要用猜测的 ID 操作其他插件。记录其他 bundles 的状态以便安装后对比。

如果当前 AI 只能操作终端或其他产品，无法调用 Harness 内工具，可以下载并验证安装包、给出本机路径，再让用户在 Harness 内继续。不要伪造工具成功结果，也不要以直接改 profile 配置作为替代。

## 2. 准备安装目标

推荐下载固定版本 `.tgz` 和 `SHA256SUMS.txt`，验证 SHA-256，再使用安装包**真实绝对路径**。不要将 `<路径>`、`~` 或相对路径原样传给工具。

例如下面仅为 macOS / Linux 路径格式示例，必须换成实际存在的文件：

```json
{"action":"install_bundle","target":"/absolute/path/dsh-whale-glass-1.0.1.tgz","enabled":true}
```

源码目录安装也使用绝对路径，指向包含 `package.json` 和 `cordis.patch.yml` 的根目录；可能链接到源码，不要之后删除目录。

rc.3 管理器也支持以 `.tgz` 结尾的 HTTPS 安装目标，可使用上面的固定版本 Release URL。**本地目录安装已在桌面验证；Release 包结构和隔离安装另做验证，远程 URL 的具体联网安装结果以目标机器返回为准。** GitHub 不可达时，可用已下载且校验通过的本地包，不要擅自替换为不明镜像。

## 3. 安装或升级

- 未安装：调用 `install_bundle`，`enabled:true`。
- 已安装相同版本：优先检查并恢复启用状态，不要重复安装。
- 已安装旧版本且用户要求升级：先备份 `$DSH_HOME/whale-glass/`（未设置时为 `~/.dsh/whale-glass/`），记录当前状态，再执行升级。
- 若返回 `already-installed`：只移除目标 bundle 后再安装；读取每一步的返回结果，失败时保留安装包和备份。

仅针对目标包的操作示例：

```json
{"action":"set_bundle","target":"dsh-whale-glass","enabled":true}
```

```json
{"action":"remove_bundle","target":"dsh-whale-glass"}
```

移除不会删除插件自己的配置和图库；仍应在升级前备份。工具返回的 `application`、错误原因和 `nextStep` 决定后续动作。遇到待授权构建脚本时先核查来源；本包无此需求，不要盲填 `approvedBuilds`。遇到版本门禁时停止并报告，不自动设置版本豁免。

如果返回要求重启，或源目录 JS 更新后未重载，在用户任务安全停止后重启应用。不要在聊天任务正在生成时强杀应用。

## 4. 验收：区分安装成功与界面生效

1. 再列出 bundles，确认包名、版本和启用状态；其他插件状态与安装前对照。
2. 打开设置，确认「鲸蓝玻璃」区出现，两个内置缩略图可见，聊天文字可读。
3. 切换内置图，调整一个参数，等待保存后重新打开设置核对值。
4. 如需验证上传 / 删除，使用明确的测试图片副本，不删除用户已有图库：上传后应显示并选中；删除后应回到默认图；撤销后应回到图库且不抢占背景。
5. 关闭本插件应恢复原主题，重新启用恢复玻璃背景；最后保留用户需要的开关和参数状态。
6. 需要验证重启持久性时，重启后核对背景和深色文字配色。无桌面访问能力时，如实报告只验证了安装 / 配置，不声称视觉验收通过。

## 5. 边界与排障

- 禁止修改 `app.asar` 或应用安装资源，禁止覆盖整个 profile / `package.json` / `cordis.patch.yml`。
- 不重置聊天、账号、全局主题配置、其他插件的文件或启用状态。
- 若其他壁纸插件叠加，先解释实际冲突，再按用户授权只处理具体插件。不能因 README 提到 `dsh-chat-wallpaper` 就无条件关闭它。
- 别把旧版的随机器路径、端口或账号复制到新机器；使用当前环境实际路径与工具结果。
- 本插件的写路由要求同源自定义请求头，并受 Harness 宿主访问控制；直接 curl 的 401 不等于插件坏了，不绕过宿主鉴权。
- 用户数据在 `$DSH_HOME/whale-glass/`，不在源码 `assets/`；不要为更新内置图而清空用户图库。
- 本包使用回收区删除，关闭 / 卸载不清理数据。若要求彻底清除，另行明确范围，不能顺带删除整个 `~/.dsh`。

最后向用户报告：安装的版本、实际安装目标、启用状态、已做的验收、未验证事项和设置入口。可引用 README，不要输出凭证或含私密聊天的截图。
