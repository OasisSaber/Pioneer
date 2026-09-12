# Wonderwall-Pi Figma Bridge 插件与使用指南

> **定位**：Wonderwall-Pi Agent 与 Figma Desktop 的本地双向桥接插件。
> **功能**：一键生成设计规范 Variables、AutoLayout 意图卡、书架卡片、模型轻提示与桌面画板，支持 AI 终端指令实时操控画布。

---

## 一、在 Figma 中导入并运行本插件（10 秒快速安装）

1. 打开 **Figma 桌面端 (Figma Desktop App)**，打开任意设计文件；
2. 点击左上角 Figma 主菜单（或快捷键 `Ctrl+Shift+P` / `Cmd+Shift+P`）；
3. 搜索并选择 **`Plugins` $\rightarrow$ `Development` $\rightarrow$ `Import plugin from manifest...`**；
4. 选择并打开本地文件：
   `.\figma-bridge\manifest.json`（从仓库根目录打开）；
5. 导入成功后，在菜单中点击 **`Plugins` $\rightarrow$ `Development` $\rightarrow$ `Wonderwall-Pi Figma Bridge`** 即可启动！

---

## 二、插件面板核心功能

- ⚡ **同步 Design Tokens 变量**：一键在当前 Figma 文件创建 Wonderwall-Pi 的 9 种颜色 Paint Styles（Canvas, Surface, Ink, Accent 蓝点等）。
- ➕ **生成意图核对卡 (Intent Card)**：在画布当前视口自动生成带 AutoLayout、步骤清单与批准按钮的组件。
- ➕ **生成模型适配轻提示条**：生成单行终端风格的 Model Pathology 策略轻提示条。
- ➕ **创建 1440×900 桌面画布**：一键创建符合规范的标准桌面视口 Frame 与 App Header。

---

## 二·补、整理 Pages · 项目页面归档（无需桥接服务）

插件面板顶部的「整理 Pages」区块用来把 Figma 文件的页面列表按约定归类归档。它**只做两件事**：

1. 修改 `figma.root.children` 中每个 `PageNode` 的 `name`；
2. 调整这些 PageNode 在 `children` 里的排列顺序。

**不会读取、创建、删除或修改任何页面内部的图层 / 组件 / 样式**，所以「不动 DemoLab 里的内容」是结构上保证的，而不是靠人工约定。

### 使用步骤

1. 在 Figma Desktop 打开 Pioneer 文件；
2. `Plugins` → `Development` → `Wonderwall-Pi Figma Bridge`；
3. 面板打开时会**自动只读扫描**并列出改名前后对照；
4. 确认无误后点「应用：重命名 + 排序」，按钮会变成「再点一次确认应用」，**再点一次**才执行；
5. 执行后用 `Ctrl/Cmd + Z` 可整体撤销。

### 规则在哪

规则写在 `code.js` 的 `PAGE_PLAN` 常量里，改它即可换整理方案：

```js
PAGE_PLAN = {
  renames: [
    { from: "<当前页名>", to: "<目标页名>", allowTargetTaken: false }
  ],
  order: ["<目标顺序>", "..."]
};
```

- 未在 `order` 中列出的页面会**保持相对顺序、追加在末尾**，不会被删除或改名。
- 匹配优先精确比对，失败后按归一化名比对（容忍空格 / 大小写 / 连字符 / 间隔号差异）。

### 两条安全护栏

- **幂等闸门**：默认情况下，若文档里已存在目标页名，该条改名规则直接跳过，判定为「上次已执行」。因此插件**可以安全地重复运行**——否则第二次运行会把刚扶正的新 Main 又归档掉。
  只有「目标名正被另一个即将让位的页面占用」时才需要 `allowTargetTaken: true`。
- **错文件拦截**：若一条规则都没匹配上，面板会显示警告并**禁用应用按钮**，避免在无关文件上乱动。

---

## 三、AI 实时指令桥接服务端（可选）

如需通过 AI 终端直接发送代码控制 Figma 画布，请先将 Figma 访问凭据注入当前进程环境。只从环境读取 `FIGMA_TOKEN`，不要把令牌写入命令、文档或仓库：

```powershell
$env:FIGMA_TOKEN = Read-Host "Enter FIGMA_TOKEN"
if (-not $env:FIGMA_TOKEN) { throw "FIGMA_TOKEN must be set in the environment" }
```

然后从仓库根目录运行桥接服务：
1. 在终端运行：
   ```bash
   python .\figma-bridge\bridge-server.py
   ```
2. 保持 Figma 插件面板处于打开状态，AI 即可通过该桥接端口直接在你的 Figma 画布上自动绘图与排版。

### 桥接服务安全模型

- **仅本机监听**：服务只绑定 `127.0.0.1`，不对局域网或其他网络接口开放。
- **来源白名单**：CORS 仅对 `https://www.figma.com` 与本地 `localhost/127.0.0.1` 来源放行，不再无条件开放 `*`。
- **会话 token 认证**：每次 POST 必须携带 `X-Bridge-Token` 请求头。启动时服务端会生成一次性 token 并打印在控制台；也可以通过环境变量 `FIGMA_BRIDGE_TOKEN` 固定 token（见 `.env.example`）。调用示例：

  ```bash
  curl -X POST http://127.0.0.1:8765 -H "Content-Type: application/json" \
       -H "X-Bridge-Token: <启动时打印的 token>" -d '{"type":"ping"}'
  ```
