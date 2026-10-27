# 鲸蓝玻璃 · Whale Glass

为 **DeepSeek Harness 桌面版**提供纯黑背景、透明玻璃面板和蓝色鲸娘壁纸的独立插件。支持更换图片、调整透明度和位置，也可以随时关闭恢复原界面。

**当前版本：1.0.2。已在 macOS 的 DeepSeek Harness Desktop 0.2.1-rc.3 上验证。** 其他 Harness 版本及 Windows / Linux 尚未实测；本插件不是 DeepSeek 网页版扩展，也不是官方产品。

[下载安装包](https://github.com/yxx-z/dsh-whale-glass/releases/latest) · [给 AI 的安装指南](AI_INSTALL.md) · [版本记录](CHANGELOG.md)

![内置鲸娘纯黑背景](assets/portrait.png)

> 上图是内置素材预览。实际界面会按设置叠加暗幕、透明面板和玻璃效果。

## 功能

- 内置「鲸娘 · 纯黑」和「深海 · DeepSeek」两张图。
- 上传自己的 PNG、JPEG、WebP、GIF，单张最大 20 MB。
- 自选图片可手动删除；删除当前背景会自动切回默认鲸娘图。
- 本次应用运行期间，可「撤销上次删除」恢复最后一张删除的图片。
- 调整图片不透明度、玻璃透明度、模糊、文字区暗幕及边缘高光。
- 支持按高度缩放、铺满窗口、完整显示，以及水平 / 垂直位置调整。
- 即时预览并自动保存；关闭插件可恢复之前的原生主题。
- 零第三方运行依赖，无编译步骤；图片处理和配置保存均在本机完成。

## 安装（推荐）

安装通过 **Harness 自带的插件管理器**完成。不要将文件复制进应用安装包，也不要手工改写 profile 的插件配置。

1. 打开 [Releases](https://github.com/yxx-z/dsh-whale-glass/releases/latest)，下载 `dsh-whale-glass-1.0.2.tgz`。不要把 GitHub 自动生成的 `Source code` 压缩包当成 npm 插件安装包。
2. 将安装包保存在运行 Harness 的电脑上。可用同一 Release 的 `SHA256SUMS.txt` 核对文件完整性。
3. 在 Harness 的插件管理入口中，将该 `.tgz` 文件的**绝对路径**作为安装目标并启用。若当前界面没有本地安装入口，把下面的安装提示交给 **Harness 内部能调用 `plugin_manager` 的 AI**。
4. 等待安装结果成功。若返回要求重启，先结束正在运行的任务，再重启 Harness。
5. 打开 **设置 → 鲸蓝玻璃**，确认两张内置图片显示、背景生效。

macOS / Linux 核对下载文件：在安装包与校验文件所在目录运行：

```bash
shasum -a 256 -c SHA256SUMS.txt
```

没有 `shasum` 的 Linux 可用 `sha256sum -c SHA256SUMS.txt`。Windows 可用 PowerShell 的 `Get-FileHash -Algorithm SHA256` 计算安装包摘要并与文件内记录比较。

### 直接丢给 AI 的安装提示

复制以下文字，填入你电脑上的真实绝对路径：

```text
请安装 DeepSeek Harness 插件「鲸蓝玻璃」。
仓库：https://github.com/yxx-z/dsh-whale-glass
先读取仓库的 README.md 和 AI_INSTALL.md，再执行安装。
安装包绝对路径：<替换为本机 dsh-whale-glass-1.0.2.tgz 的真实绝对路径>
必须通过 Harness 原生 plugin_manager 安装和启用；先列出已安装 bundles，
核对是否已安装 dsh-whale-glass。保留其他插件、聊天记录和个人设置。
不要修改 app.asar、不要直接修改 profile 配置、不要绕过版本限制。
安装后验证设置入口、内置图、上传/删除/撤销及关闭恢复原界面。
如果你无法调用 Harness 的 plugin_manager，请明确告诉我缺少的能力，
给出在 Harness 内继续执行的步骤，不要把 npm install 成功当成插件已启用。
```

详细工具参数、升级流程和验收标准见 [AI_INSTALL.md](AI_INSTALL.md)。

### 从源码安装 / 开发

克隆仓库后可以直接从**仓库根目录的绝对路径**安装，不需要 `npm install` 或构建。该目录必须包含 `package.json` 和 `cordis.patch.yml`，且不要安装后移动或删除它：本地目录安装可能通过符号链接引用源码。

```bash
git clone https://github.com/yxx-z/dsh-whale-glass.git
cd dsh-whale-glass
# 测试与打包需要 Node.js >= 20 及 npm；本项目实测 Node.js 22。
npm run check
npm test
npm pack
```

`npm pack` 产出 `dsh-whale-glass-1.0.2.tgz`，再通过 Harness 插件管理器安装。本项目未发布到 npm registry，**不要使用裸包名从 npm 安装**。源码安装完成后的 JS 改动需要重载 / 重启 Harness，不能假定自动热更新。

## 使用设置

入口：**设置 → 鲸蓝玻璃**。选图或调整参数会立即预览，稍后自动保存；出现「未保存」时点击「重试保存」。

| 设置 | 范围 / 行为 |
| --- | --- |
| 启用背景 | 关闭后恢复之前的主题，不删除配置或图库 |
| 图片不透明度 | 0–100%，越高图片越明显 |
| 玻璃透明度 | 0–90%，越高面板越透 |
| 玻璃模糊 | 0–40 px，仅用于侧栏及输入框卡片，不覆盖整行布局 |
| 文字区暗幕 | 0–95%，越高文字背景越暗 |
| 玻璃边缘高光 | 0–100% |
| 按高度 · 可缩放 | 角色缩放 50–180% |
| 铺满窗口 / 完整显示 | 前者可能裁切，后者可能留黑边 |
| 水平 / 垂直位置 | 0–100%，分别从左到右、从上到下 |
| 恢复推荐参数 | 恢复默认图和视觉参数，不清空自选图库；不改变启用开关 |

### 上传、删除与撤销

「上传自己的图片」会将图片复制到插件图库，并选为当前背景，原始文件不受影响。

自选图片下方有「删除图片」按钮。内置图片不显示删除按钮。删除当前图片后自动使用「鲸娘 · 纯黑」，其余视觉参数保留。撤销只把图片恢复到图库，不自动切换当前背景。

删除采用回收区机制：文件移到 `whale-glass/trash/`，**不会立即释放磁盘空间**。「撤销上次删除」只记住本次运行中的最后一次删除，重启或再次删除后不提供更早记录的撤销按钮。若需要找回更早的图片，可从回收区重新上传。停止 / 卸载插件不会删除这些文件。

## 升级与卸载

升级前备份下面的数据目录，并记下当前启用状态。通过插件管理器检查当前安装版本，仅更新 `dsh-whale-glass`。如果返回 `already-installed`，按原生管理器提示先移除这个 bundle 再安装新版；**不要移除其他插件**。卸载与安装之间会暂时恢复原界面，插件图库仍保留。

仅想取消外观时，点击「关闭并恢复原界面」即可；完整停用或卸载则在插件管理器中操作 `dsh-whale-glass`。不需要修改 Harness 安装包或删除整个 profile。

旧壁纸插件（例如 `dsh-chat-wallpaper`）或其他主题插件可能叠加样式。如果发现冲突，先检查已启用项，与用户确认具体冲突插件后单独处理，不要批量关闭插件。

## 数据与权限

默认根目录为 `~/.dsh/whale-glass/`。若运行 Harness 的环境设置了 `DSH_HOME`，则使用 `$DSH_HOME/whale-glass/`，不是 profile 子目录。

| 路径 | 内容 |
| --- | --- |
| `config.json` | 外观设置和当前图片编号 |
| `images/` | 导入图片的本机副本，以随机编号命名 |
| `trash/` | 已删除图片的可恢复副本 |
| 插件目录下 `assets/` | 随包发布的两张内置图 |

本插件通过宿主的同源 HTTP 路由读写这些文件，没有主动向第三方上传图片或遥测的代码。Host 插件仍具有宿主提供的本机权限；上传图片前请确认你信任所安装的代码。GitHub 仓库与 Release 不包含用户聊天、个人配置、账号信息或导入图库。

## 故障排查

| 现象 | 处理 |
| --- | --- |
| 找不到「鲸蓝玻璃」 | 核对 bundle 是否安装并启用，读取管理器的 `application` / `nextStep`，必要时重启 |
| 安装目标无效 | 使用真实绝对路径，不要用 `~`、相对路径或未替换的占位符；安装包应为 npm pack 生成的 `.tgz` |
| `already-installed` | 先确认版本；若确需升级，移除本 bundle 后安装，不要重复新建插件条目 |
| 版本不兼容 | 停止安装，记录 Harness / 插件版本；不要自动授权版本豁免 |
| 图片不明显或文字难读 | 提高图片不透明度或文字区暗幕，检查是否有其他主题叠加；也可恢复推荐参数 |
| 更新后仍显示旧图 | 新版本带图片地址版本号；确认运行的客户端已重载，可完整重启应用 |
| 导入失败 | 检查格式、20 MB 限制及图片能否解码；SVG / HTML / 视频不受支持 |
| 文件夹移动后插件失效 | 本地源码安装可能是链接；从新路径通过管理器重新安装，或改用 Release 包 |
| 关闭后仍有壁纸 | 检查其他外观插件；鲸蓝玻璃只清理自己注册的样式和主题层 |

## 项目结构与验证

```text
lib/index.js         Host：配置、图片存储、HTTP 路由
lib/client.js        Client：玻璃样式、原生主题、React 设置区
assets/              内置图片
locale/              中英文插件元数据
cordis.patch.yml     Harness bundle 入口
AI_INSTALL.md        给安装助手的操作与验收规范
test/plugin.test.mjs 配置、HTTP、文件隔离和主题生命周期测试
```

接口基于 `theme.register`、`theme.overrideTokens`、`theme/change` 和 `settings.section`，背景绘制在 body 上，不增加覆盖聊天的全屏元素。部分布局选择器依赖 Harness 当前实现，未来版本需重新验证。

本地 7 项自动测试已通过；macOS / Harness 0.2.1-rc.3 实测了内置图切换、PNG 上传、参数保存、删除当前图回退、撤销、关闭恢复以及重启后主题恢复。JPEG / WebP / GIF 的全部桌面上传路径、其他操作系统及其他 Harness 版本尚未逐项实测。CI 运行语法检查和自动测试，不能代替桌面验收。

## 许可与素材

插件代码采用 [MIT License](LICENSE)。两张内置图片的来源和许可说明见 [ASSETS.md](ASSETS.md)，**图片不在代码的 MIT 授权范围内**。本项目与 DeepSeek 官方无隶属关系。
