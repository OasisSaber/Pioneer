# Pioneer

Pioneer is a modular AI Agent interaction-system project moving from an M1 HTML design prototype into an Electron + React + TypeScript product.

- Current desktop implementation: [`apps/desktop`](apps/desktop/) contains the completed M2 read-only Electron foundation plus the M3 `Input → Intent Review → READY → Runtime Session` path and its local lifecycle-event skeleton.
- Historical visual references: frozen M1 HTML design references under [`demos/`](demos/README.md).
- Current engineering milestone: M3 is **IN PROGRESS**. `READY → Runtime Session bootstrap` is on `main`; this slice adds `INITIALIZED → START REQUESTED` with a deterministic local event stream while execution capabilities remain disabled.
- Canonical repository: `OasisSaber/Pioneer`.
- Canonical local checkout: `D:\Projects\Pioneer`.

## Install and run

Use Node.js 24 or newer and the package-manager version pinned in `package.json`:

```powershell
pnpm install
pnpm --filter @pioneer/desktop start
```

The renderer in `apps/desktop` now follows the approved Figma workspace contract for the implemented M3 Input / Intent Review slice. Figma `Pioneer · DEMO Lab` remains the visual interaction authority; later scenes are not claimed implemented until their own engineering slices land.

The deterministic Real E2E seam injects a committed fixture root. The native directory picker remains outside that seam; its M2 human acceptance evidence is recorded separately and complete.

## Verification levels and commands

The primary engineering gate is `pnpm check`:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:contract
pnpm test:prototype
pnpm test:e2e
pnpm package:smoke
pnpm check
```

- **Contract Tests** are deterministic TypeScript units for shared schemas, paths, scanner, IPC, settings, security, runtime configuration, and the tab reducer: `pnpm test:contract`.
- **Prototype Tests** are the executable frozen M1 simulator plus static/adversarial probes: `pnpm test:prototype`.
- **Real E2E** uses Playwright to launch Electron and cross main → preload → renderer against committed filesystem fixtures while checking fixture immutability: `pnpm test:e2e`.

Renderer mocks cannot establish a Real E2E claim. M2 is complete: Contract Tests, Real Electron E2E, Windows native-picker human acceptance, package smoke, and the final Windows quality gate have passed. M2 remains strictly read-only and does not include file writes, workspace reorganization, or snapshots. See [`TEST_INFRA.md`](TEST_INFRA.md) for the authoritative taxonomy and [`themasterplan/ROADMAP.md`](themasterplan/ROADMAP.md) for milestone status.

---

## 项目背景与设计工作区

> **课题全称**：模块化 AI Agent 交互系统的设计与实现
> *(Design and Implementation of a Modular AI Agent Interaction System)*
> **项目代号**：**Pioneer**（Pi 极简底盘 + oneer 开拓者）
> **专业归属**：2027 届数字媒体技术专业 · 毕业设计

---

## 一、核心设计哲学与双主线架构

> **系统本体论三联：**
> * UNIX / Linux 的理念是 **「一切皆文件」** —— 统一硬件与底层数据的抽象；
> * Harness 框架的理念是 **「一切皆插件」** —— 统一模型、工具与运行时的抽象；
> * **Pioneer 的理念是「一切皆 UI」(Everything is a UI)** —— 统一 Agent 复杂黑盒与人类直觉认知的桥梁。不把配置、工具、状态和组件藏进代码或文字，全部实体化为可交互、可编排的界面组件。

```
+========================================================================================+
|                     [主线一] 模块化 AI Agent 交互系统                                    |
|----------------------------------------------------------------------------------------|
|  [顶层框架] Tabs 多标签体系（取代常驻左侧栏，释放全宽视界）                              |
|  [ 📚 媒体库 ]  |  [ 📦 项目工作区 ]  |  [ ⚙️ 系统设置 ]  |  [ + 新标签页 ]              |
|----------------------------------------------------------------------------------------|
|  1. 媒体库 · 海报墙                                                                     |
|     - 本地项目元数据读取：Git、README、技术栈信息                                       |
|     - 海报卡片：名称 / 技术栈 / 活跃状态 / Runbook，点击直达对应工作区                  |
|     - 整理操作先预览：路径级 Diff → 确认执行 → 保留回滚快照（批准前不写入）             |
|----------------------------------------------------------------------------------------|
|  2. 项目工作区 · 模块化                                                                 |
|     - 场景切换：[ 输入 ] [ 审阅 ] [ 输出 ] [ 自定 ]                                    |
|     - 输入场景内完成任务编写与 Intent Review；审阅场景负责 Agent Files / Diff            |
|     - 输出场景负责 Artifacts；自定场景负责模块化组合；每阶段只显示当前需要的信息          |
+========================================================================================+
                          │ 显式状态层（UI 状态 ⟂ 模型上下文） + 事件流
+========================================================================================+
|                     [主线二] Harness 工程的设计与实现                                    |
|----------------------------------------------------------------------------------------|
|  - 轻量上下文：仅提供当前任务所需信息，减少长提示词与重复规则干扰                       |
|  - 能力模块化：工具 / Skill / 运行能力独立组合，同一能力可跨项目复用                    |
|  - 统一接入：通过稳定边界连接模型与 Agent Runtime，降低换模型 / 加工具成本               |
|  - 对比实验：相同模型与任务下，测量不同 Harness 的上下文用量 / 完成率 / 耗时             |
|  - 复用 Pi Agent Harness：pi-ai（模型适配） / agent-core（状态·工具·事件流） /           |
|    coding-agent（Session · Compaction · SDK / RPC）                                     |
+========================================================================================+
```

> **两条主线的关系**：界面形态决定 Harness 需要暴露什么，Harness 的边界决定界面能呈现什么。不是「前端 + 后端」的简单分层。

---

## 二、核心交付导航 (Master Index)

### 1. 选题与定位（单一事实源）
- [`选题收敛说明.md`](选题收敛说明.md) — 题目删改记录、双主线定位、硬约束、时间线与待确认事项。
- [`产品定义与美学纲领.md`](产品定义与美学纲领.md) — 一句话定义、双主线产品形态、克制原则与历史探索记录。
- [`开题PPT逐页文案.md`](开题PPT逐页文案.md) — **10 页开题讲稿**与答辩速答清单（权威源为 Figma `Pioneer-PPT`）。

### 2. 开题支撑材料
- [`开题材料·需求与验收.md`](开题材料·需求与验收.md) — 需求分析、用户研究、内容制作与成果验收标准。
- [`功能全景与开题支撑清单.md`](功能全景与开题支撑清单.md) — 按双主线组织的功能全景、指南八环节自查与四合一对照。
- [`竞品基线与差异化核查.md`](竞品基线与差异化核查.md) — 交互范式与 Harness 形态的竞品核查、基线清单与差异化结论。

### 3. 工程总纲与研发工作流 (The Masterplan)
- [`themasterplan/THEMASTERPLAN.md`](themasterplan/THEMASTERPLAN.md) — 愿景、架构蓝图、数媒「四合一」交付矩阵与工程总纲。
- [`themasterplan/ROADMAP.md`](themasterplan/ROADMAP.md) — 阶段里程碑与渐进式开发路线图。

### 4. 设计规范与 Figma 协作体系 (Design System & Figma)
- [`docs/design/WONDERWALL-DESIGN-SPEC.md`](docs/design/WONDERWALL-DESIGN-SPEC.md) — 完整设计系统规范（极简骨架、海报墙、模块化面板、Design Tokens）。
- [`docs/design/COMPETITOR-SYNTHESIS.md`](docs/design/COMPETITOR-SYNTHESIS.md) — 竞品界面解构与差异化超越。
- [`docs/design/FIGMA-COLLABORATION-PLAN.md`](docs/design/FIGMA-COLLABORATION-PLAN.md) — Figma 变量、图层结构与组件协作方案。

### 5. 三页设计范例 (Design Spec Exemplars)
- [`design-specs/01-design-tokens-and-typography.html`](design-specs/01-design-tokens-and-typography.html) — 色彩 Token、双轨字体层级与网格规范。
- [`design-specs/02-component-and-surfaces.html`](design-specs/02-component-and-surfaces.html) — 意图核对卡、项目海报卡、整理 Diff 预览等原子组件范例。
- [`design-specs/03-restraint-and-pathology.html`](design-specs/03-restraint-and-pathology.html) — 克制原则对照实验。

### 6. 核心交互页面 Demo (Interactive Page Demos)
- [`demos/README.md`](demos/README.md) — **M1 Demo policy**: frozen reference implementations, allowed-change boundary, and the `apps/desktop` product handoff boundary.
- [`demos/01-bookshelf-workspace.html`](demos/01-bookshelf-workspace.html) — **Demo 01**: 项目海报墙与工作区管理（元数据读取 + 整理预览）。
- [`demos/02-session-intent-card.html`](demos/02-session-intent-card.html) — **Demo 02**: 模块化工作区执行会话（场景切换 + 意图核对 + 过程流）。
- [`demos/03-wrapup-and-gallery.html`](demos/03-wrapup-and-gallery.html) — **Demo 03**: 任务结果检查（成果画廊 + 回滚 + Runbook 提炼）。

These HTML files are M1 presentation references, not the evolving application. New product behavior belongs in the `apps/desktop` Electron implementation.

### 7. 开题汇报
> 开题汇报的**权威源为 Figma `Pioneer-PPT`**（10 页），讲稿见 [`开题PPT逐页文案.md`](开题PPT逐页文案.md)。仓库内早期 8 页 HTML 版演示稿及其验证脚本已于 2026-09-11 移除。

---

## 三、数媒四大支柱落实（四合一支撑）

1. **设计 (Design)**：
   * **媒体库海报墙**：把本地项目渲染为可一眼识别的资产卡片。
   * **模块化工作区**：Tabs 与可停靠面板，工作区随任务阶段切换。
   * **克制原则**：每个阶段只显示当前需要的信息，拒绝无意义的信息陈列。
2. **技术 (Technology)**：
   * 显式状态层与事件流；Tabs / Dockview 面板系统。
   * Harness 上下文组装、能力模块化与统一接入层。
3. **内容 (Content)**：
   * 项目元数据读取规范、Runbook 模板、场景内容包、交互短句库。
4. **智能 (Intelligence)**：
   * 意图核对机制（Human-in-the-loop）、轻量上下文策略、能力模块化组合。

---

## 四、开源许可证

本项目采用 [MIT License](LICENSE) 开源。
