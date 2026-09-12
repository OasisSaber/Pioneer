# Pioneer Agent · 前端与界面设计系统规范 (Design System Specification)
> **版本**：v2.0 (2026-09) · **基调**：Apple HIG 极简 × Premiere Pro 模块化工作区 × Jellyfin 影视库海报墙 × “一切皆 UI”

---

## 1. 设计哲学与核心原则 (Design Principles)

0. **一切皆 UI (Everything is a UI)**：拒绝把配置、工具、状态藏进终端黑盒或纯文本中。无论是技能卡片、插件挂载、工作区编排还是任务状态，均实体化为高可用、可直观交互的桌面 UI 组件。
1. **沉默优先 (Silence by Default)**：任何界面组件出现前，必须能回答「它凭什么现在出现」。无事件时不展示冗余状态，拒绝常驻仪表盘与大屏图表。
2. **渐进披露 (Progressive Disclosure)**：默认呈现最简单行信息或胶囊，复杂的技术参数与策略溯源通过二级展开提供。
3. **证明靠对比 (Proof by Contrast)**：通过执行前/后的状态对比与意图核对展示价值，而非堆砌图形。
4. **单彩色点缀 (Restrained Single Accent)**：全界面以黑白灰及发丝线为骨架，行动色与关键高亮严格限定为 `#0071E3`（Apple 经典蓝），每屏不超过 3 处。

---

## 2. Design Tokens (设计变量体系)

### 2.1 颜色系统 (Color Tokens)

| Token Name | Hex Code | 角色说明与使用场景 |
|---|---|---|
| `--canvas` | `#FDFCFC` | 主画布底色（opencode 暖白，柔和不刺眼） |
| `--surface` | `#F5F5F7` | 一级卡片底色（Apple 标准浅灰卡） |
| `--surface-2`| `#F8F7F7` | 二级卡片 / 输入框浅底 / 悬浮态 |
| `--ink` | `#1D1D1F` | 主要文本 / 大标题 / 关键数值 |
| `--ink-2` | `#6E6E73` | 次要文本 / 描述说明 / 副标题 |
| `--ink-3` | `#86868B` | 弱强调文本 / 页脚元数据 / 占位符 |
| `--line` | `#E0DEDE` | 极细发丝线（1px 边框与分割线） |
| `--line-strong`| `#4B4646`| 深色模式 / 终端容器内的边框线 |
| `--accent` | `#0071E3` | Apple 经典蓝（行动点缀、P0 徽标、高亮关键词） |
| `--accent-2` | `#0066CC` | 深一档蓝（交互 Hover 态） |
| `--dark` | `#161413` | 终端近黑底色 / Hero 区域背景 |
| `--dark-surface`| `#1E1C1B`| 终端卡片底色 / 快捷键浮层背景 |
| `--on-dark` | `#FDFCFC` | 深色背景上的主文字 |
| `--on-dark-2`| `#8A8585` | 深色背景上的次级灰字 |

### 2.2 字体与排版 (Typography Tokens)

```css
:root {
  /* 正文与标题字族（Apple HIG 栈） */
  --font-sans: "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  /* 终端、代码、状态元数据字族（Monospace 栈） */
  --font-mono: "SF Mono", "Sarasa Gothic SC", "Sarasa Mono SC", "JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
}
```

| 级别 | 字号 (Size) | 字重 (Weight) | 字族 (Font) | 行高 (Line Height) | 用途 |
|---|---|---|---|---|---|
| **Display 1** | 56px – 66px | 700 Bold | Sans | 1.15 | 封面主标、核心展示大字 |
| **Title 1** | 28px – 32px | 600 Semibold | Sans | 1.25 | 页面主标题、模块大标题 |
| **Title 2** | 22px – 24px | 600 Semibold | Sans / Mono | 1.35 | 卡片标题、意图卡标题 |
| **Body Large**| 18px – 20px | 400 Regular | Sans | 1.50 | 重要描述、陈述式正文 |
| **Body Regular**| 15px – 16px| 400 Regular | Sans | 1.50 | 常规正文、列表文字 |
| **Mono Meta** | 13px – 14px | 500 Medium | Mono | 1.40 | 状态标签、页脚信息、时间戳 |
| **Terminal Row**| 15px – 18px| 400 Regular | Mono | 1.45 | 终端命令行、状态输出流 |

### 2.3 间距与网格 (Spacing & Sizing)
- **Base Grid**：以 **4px / 8px** 为基础递进单位。
- **Padding 阶梯**：`8px` (XS), `14px` (S), `20px` (M), `24px` (L), `32px` (XL)。
- **Border Radius**：
  - 卡片与面板：`14px`（统一平滑圆角）；
  - 深色终端块：`8px`（严谨极客感）；
  - 按钮与胶囊（Pill）：`999px`（Apple 全胶囊）；
  - 阴影：`none`（全扁平无阴影，靠发丝线与色块区隔）。

---

## 3. 核心组件库规范 (Component Specs)

### 3.1 胶囊徽标 (Pill Badges)
- **P0 核心徽标**：`background: #0071E3; color: #FFFFFF; font-weight: 600; border-radius: 999px;`
- **P1 外延徽标**：`background: #FDFCFC; border: 1px solid #86868B; color: #6E6E73;`
- **模型标签**：`background: #F5F5F7; border: 1px solid #E0DEDE; color: #1D1D1F; font-family: Mono;`

### 3.2 意图核对卡 (Intent Card)
- **结构**：卡片顶栏（识别目标 + 当前接入模型）+ 意图理解核对短句 + 执行步骤清单（分步带状态指示）+ 底部操作胶囊（`[Enter] 批准执行` / `[E] 修改方案` / `[Esc] 取消`）。
- **色彩**：浅灰卡 `#F5F5F7`，左侧附带 3px `#0071E3` 聚焦发丝线。

### 3.3 适配轻提示条 (Adaptive Light-Hint)
- **形态**：悬浮或嵌入式单行条（高度 44px），深色或浅灰圆角容器。
- **文案公式**：`[模型代号] + [病理触发条件] + 已挂载 [策略名] (点击查看原因与收益)`
- **交互**：默认静默单行；点击平滑滑出抽屉展示对应的 Model Profile YAML 规则与拦截历史。

### 3.4 整理闸门预览卡 (Clean-up Diff Proposal)
- **结构**：源路径 $\rightarrow$ 目标路径对比；标记类型（`[归组]` / `[重命名]` / `[建议清理]`）；复选框批量勾选；「整体可回滚」安全保障声明。

---

## 4. 前端界面架构规范 (UI Architecture Specs)

### 4.1 顶层框架：浏览器级 Tabs 多标签页体系 (Browser-like Multi-Tab System)
- **定位**：顶层窗口主控条，彻底取缔常驻占用大块横向空间的左侧栏，释放 100% 全宽沉浸工作界面。
- **多任务与切页模型**：
  - **媒体库主页 Tab (固定/常驻)**：`[ 🎬 媒体库主页 ]`，点击随时回到 Jellyfin 海报墙浏览全局资产；
  - **动态项目工作区 Tab**：在海报墙点击任意项目，以独立 Tab 打开对应工作区（如 `[ 📦 demo-thesis-2027 ]`），支持多项目无缝并行；
  - **全屏系统设置 Tab**：`[ ⚙️ 系统设置 ]` 作为独立 Tab 100% 全屏展开，配置模型、插件、快捷键与外观，拒绝局促的浮层弹窗；
  - **快捷操作**：支持 `Ctrl+T` 新建标签、`Ctrl+W` 关闭、拖拽排布标签。

### 4.2 工作区管理层：Jellyfin 影视库海报墙风格 (Workspace Management)
- **定位**：系统入口与项目资产大厅，打破冰冷的路径目录树。
- **项目自动刮削**：后端从本地目录（Git、README、`package.json`、项目文件）自动提取项目名称、描述、技术标签，并渲染为高保真项目海报封面。
- **海报墙布局**：
  - **顶部**：全局搜索、分类筛选（活跃/归档/待整理）、新建项目入口；
  - **主体**：类似 Jellyfin / Emby 的海报网格流，每个卡片包含：项目封面海报、活跃时间徽标、技术栈胶囊、历史任务集数（Runbook 数量）；
  - **交互**：点击项目海报卡片，平滑新建或切入对应项目的专属工作区 Tab。

### 4.3 任务执行层：Premiere Pro 模块化工作区体系 (Execution Workspace)
- **定位**：专业任务执行与人机协同工作站，拒绝死板的三栏对话框。
- **工作区场景切换条**：
  - 项目 Tab 内部支持场景模板快速切换：`[ 输入 ]`、`[ 审阅 ]`、`[ 输出 ]` 以及用户保存的 `[ + 自定义工作区 ]`。状态全景场景已彻底删除收敛，成果画廊统一归入输出场景。
- **模块化可停靠面板 (Dockable Panels)**：
  - **意图核对卡面板 (Intent Card Panel)**：展示 Agent 解析出的用户目标、执行步骤、风险评级，提供批准与修改交互；
  - **事件流终端面板 (Event Stream Terminal)**：细粒度流式打字机动画、实时工具调用胶囊、报错自愈提示；
  - **任务交付成果面板 (Task Deliverables / Output Panel)**：任务产物内联预览、4 项标准操作动作（打开、文件夹内打开、复制、复制路径）、文件版本变更审阅、一键快照回退；
  - **会话分支树面板 (Session Tree Panel)**：可视化呈现会话分叉节点，支持时光机式跳转回退。
- **布局自由度**：用户可任意拖拽面板边缘调整大小、拆分组合，并一键重置或保存布局。

### 4.4 任务交付成果与收尾 (Task Output & Deliverables)
- **布局**：任务完成摘要、Runbook 自动提炼结果、成果文件一键直达与操作、资源消耗明细。

### 4.5 移动远程控制端 (Mobile Remote)
- **布局**：单列大字，平时待机全黑，仅在打断时刻（高危操作需拍板、任务完成）点亮全屏审批卡片。
